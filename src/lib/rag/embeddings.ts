const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"
const EMBEDDING_DIM = 1536

async function callEmbeddingAPI(text: string): Promise<number[]> {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) throw new Error("OPENAI_API_KEY is not set")
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: text.slice(0, 8000),
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI embeddings: ${res.status} ${err}`)
  }
  const data = (await res.json()) as { data: Array<{ embedding: number[] }> }
  return data.data[0].embedding
}

/**
 * Embed a single text with OpenAI text-embedding-3-small.
 */
export async function embedText(text: string): Promise<number[]> {
  return callEmbeddingAPI(text)
}

export interface ChunkWithMeta {
  text: string
  source: string
  metadata?: Record<string, unknown>
}

/**
 * Embed chunks and return them with embeddings (for storage).
 */
export async function embedChunks(
  chunks: ChunkWithMeta[]
): Promise<Array<ChunkWithMeta & { embedding: number[] }>> {
  const out: Array<ChunkWithMeta & { embedding: number[] }> = []
  for (const ch of chunks) {
    const embedding = await callEmbeddingAPI(ch.text)
    out.push({ ...ch, embedding })
  }
  return out
}

/**
 * Embed chunks and store in DesignDoc table.
 */
export async function embedAndStore(
  chunks: ChunkWithMeta[]
): Promise<void> {
  const { prisma } = await import("@/lib/core/db")
  const embedded = await embedChunks(chunks)
  for (let i = 0; i < embedded.length; i++) {
    const ch = embedded[i]
    await prisma.designDoc.create({
      data: {
        source: ch.source,
        chunkIndex: i,
        content: ch.text,
        embedding: ch.embedding,
        metadata: ch.metadata ? JSON.parse(JSON.stringify(ch.metadata)) : undefined,
      },
    })
  }
}

export { EMBEDDING_DIM }
