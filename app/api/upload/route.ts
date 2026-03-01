import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

const UPLOAD_DIR = path.join(process.cwd(), "uploads")
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file || typeof file === "string") {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return Response.json({ error: "File too large (max 5MB)" }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: "Invalid type. Use JPEG, PNG, WebP, or GIF." }, { status: 400 })
    }

    await mkdir(UPLOAD_DIR, { recursive: true })
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin"
    const id = `${randomUUID()}.${ext}`
    const filepath = path.join(UPLOAD_DIR, id)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    const url = `/api/uploads/${id}`
    return Response.json({ url, filename: file.name })
  } catch (e) {
    console.error("Upload error:", e)
    return Response.json({ error: "Upload failed" }, { status: 500 })
  }
}
