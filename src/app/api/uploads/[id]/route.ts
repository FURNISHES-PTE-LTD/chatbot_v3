/**
 * Serve an uploaded file by id.
 * GET is unauthenticated: anyone with the upload id can access the file.
 * For private uploads, add auth or conversation ownership check.
 */
import { readFile } from "fs/promises"
import path from "path"
import { NextRequest } from "next/server"
import { apiError, ErrorCodes } from "@/lib/api"
import { UPLOAD_DIR, CONTENT_TYPES } from "@/lib/upload-constants"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) {
    return apiError(ErrorCodes.VALIDATION_ERROR, "Bad request", 400)
  }
  const resolvedDir = path.resolve(UPLOAD_DIR)
  const filepath = path.resolve(UPLOAD_DIR, id)
  if (filepath !== resolvedDir && !filepath.startsWith(resolvedDir + path.sep)) {
    return apiError(ErrorCodes.VALIDATION_ERROR, "Bad request", 400)
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
    return apiError(ErrorCodes.NOT_FOUND, "Upload not found", 404)
  }
}
