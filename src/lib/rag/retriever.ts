import { prisma } from "@/lib/core/db"
import { embedText } from "./embeddings"

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

/** Cached design doc rows (content + embedding) to avoid full table scan on every request. Invalidated on cold start; call invalidateRagCache() after re-seeding. */
let cachedRows: { content: string; embedding: number[] }[] | null = null

/** Call after re-seeding design docs so the next retrieveRelevant uses fresh data. */
export function invalidateRagCache(): void {
  cachedRows = null
}

async function getDesignDocRows(): Promise<{ content: string; embedding: number[] }[]> {
  if (cachedRows) return cachedRows
  const rows = await prisma.designDoc.findMany({
    select: { content: true, embedding: true },
  })
  const withEmbedding = rows
    .filter((r): r is { content: string; embedding: number[] } => r.embedding != null)
    .map((r) => ({ content: r.content, embedding: r.embedding as number[] }))
  cachedRows = withEmbedding
  return withEmbedding
}

/**
 * Retrieve top-K design doc chunks most relevant to the query.
 * Uses in-memory cache of chunks to avoid full table scan on every request.
 * For scale (1000+ chunks), add pgvector and use ORDER BY embedding <=> $query LIMIT $k via prisma.$queryRaw.
 */
export async function retrieveRelevant(
  query: string,
  topK: number = 3
): Promise<string[]> {
  const rows = await getDesignDocRows()
  if (rows.length === 0) return []

  const queryEmbedding = await embedText(query)
  const withScore = rows
    .map((r) => ({
      content: r.content,
      score: cosineSimilarity(queryEmbedding, r.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return withScore.map((x) => x.content)
}
