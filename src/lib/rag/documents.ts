import { readFileSync, readdirSync } from "fs"
import { join } from "path"

const DESIGN_DOCS_DIR = join(process.cwd(), "config", "design-docs")

/** ~500 tokens ≈ ~2000 chars per chunk. Split by paragraphs then recombine. */
const TARGET_CHARS = 1800

export interface DocChunk {
  text: string
  source: string
  metadata?: Record<string, unknown>
}

/**
 * Chunk markdown content into passages of roughly target length.
 */
function chunkText(content: string, source: string): DocChunk[] {
  const chunks: DocChunk[] = []
  const paragraphs = content.split(/\n\n+/)
  let current = ""
  for (const p of paragraphs) {
    if (current.length + p.length > TARGET_CHARS && current.length > 0) {
      chunks.push({ text: current.trim(), source })
      current = p
    } else {
      current = current ? current + "\n\n" + p : p
    }
  }
  if (current.trim()) chunks.push({ text: current.trim(), source })
  return chunks
}

/**
 * Load all markdown files from config/design-docs and return chunked content.
 */
export function loadDesignDocChunks(): DocChunk[] {
  const chunks: DocChunk[] = []
  try {
    const files = readdirSync(DESIGN_DOCS_DIR).filter((f: string) => f.endsWith(".md"))
    for (const file of files) {
      const path = join(DESIGN_DOCS_DIR, file)
      const content = readFileSync(path, "utf-8")
      chunks.push(...chunkText(content, file))
    }
  } catch {
    // Directory or files missing
  }
  return chunks
}
