import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"
import { prisma } from "@/lib/db"
import { apiError, ErrorCodes } from "@/lib/api-error"
import { log } from "@/lib/logger"
import { UPLOAD_DIR, MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES, getUploadErrorMessageSize } from "@/lib/upload-constants"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const conversationId = formData.get("conversationId") as string | null
    if (!file || typeof file === "string") {
      return apiError(ErrorCodes.VALIDATION_ERROR, "No file provided", 400)
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return apiError(ErrorCodes.VALIDATION_ERROR, getUploadErrorMessageSize(), 400)
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return apiError(ErrorCodes.VALIDATION_ERROR, "Invalid type. Use JPEG, PNG, WebP, or GIF.", 400)
    }

    await mkdir(UPLOAD_DIR, { recursive: true })
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin"
    const id = `${randomUUID()}.${ext}`
    const filepath = path.join(UPLOAD_DIR, id)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    const url = `/api/uploads/${id}`
    if (conversationId && conversationId.trim()) {
      await prisma.file.create({
        data: {
          conversationId: conversationId.trim(),
          filename: file.name,
          url,
          type: file.type,
        },
      })
    }
    return Response.json({ url, filename: file.name })
  } catch (e) {
    log({ level: "error", event: "upload_error", error: String(e) })
    return apiError(ErrorCodes.INTERNAL_ERROR, "Upload failed", 500)
  }
}
