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

/**
 * Retrieve top-K design doc chunks most relevant to the query.
 * Embeds the query, loads all chunks from DB, scores by cosine similarity.
 */
export async function retrieveRelevant(
  query: string,
  topK: number = 3
): Promise<string[]> {
  const rows = await prisma.designDoc.findMany({
    select: { content: true, embedding: true },
  })
  const withEmbedding = rows.filter((r) => r.embedding != null)
  if (withEmbedding.length === 0) return []

  const queryEmbedding = await embedText(query)
  const withScore = withEmbedding
    .map((r) => ({
      content: r.content,
      score: cosineSimilarity(queryEmbedding, r.embedding as number[]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return withScore.map((x) => x.content)
}
