/**
 * Seed RAG: read markdown from config/design-docs, chunk, embed, store in DesignDoc.
 * Run from project root: npx tsx scripts/seed-rag.ts
 */
import { loadDesignDocChunks } from "../src/lib/rag/documents"
import { embedAndStore } from "../src/lib/rag/embeddings"
import { prisma } from "../src/lib/core/db"

async function main() {
  const chunks = loadDesignDocChunks()
  if (chunks.length === 0) {
    console.log("No markdown chunks found in config/design-docs. Skipping.")
    return
  }
  await prisma.designDoc.deleteMany({})
  await embedAndStore(chunks)
  console.log(`Seeded ${chunks.length} design doc chunks.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
