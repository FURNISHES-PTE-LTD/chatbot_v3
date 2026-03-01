import { readFile } from "fs/promises"
import path from "path"
import { NextRequest } from "next/server"

const UPLOAD_DIR = path.join(process.cwd(), "uploads")
const CONTENT_TYPES: Record<string, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id) {
    return new Response("Bad request", { status: 400 })
  }
  const resolvedDir = path.resolve(UPLOAD_DIR)
  const filepath = path.resolve(UPLOAD_DIR, id)
  if ((filepath !== resolvedDir && !filepath.startsWith(resolvedDir + path.sep))) {
    return new Response("Bad request", { status: 400 })
  }
  try {
    const buffer = await readFile(filepath)
    const ext = id.split(".").pop()?.toLowerCase() || ""
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream"
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=86400",
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
