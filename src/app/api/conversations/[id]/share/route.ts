import { prisma } from "@/lib/core/db"
import { requireConversationAccess } from "@/lib/auth/helpers"
import { apiError, ErrorCodes } from "@/lib/api"

function generateShareId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let id = ""
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  for (let i = 0; i < 12; i++) id += chars[bytes[i]! % chars.length]
  return id
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: conversationId } = await params
  const { error, status } = await requireConversationAccess(conversationId)
  if (error) return apiError(status === 404 ? ErrorCodes.NOT_FOUND : ErrorCodes.FORBIDDEN, error, status)
  const shareId = generateShareId()
  await prisma.sharedProject.create({
    data: { conversationId, shareId },
  })
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const shareUrl = `${baseUrl}/shared/${shareId}`
  return Response.json({ shareUrl })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: conversationId } = await params
  const { error, status } = await requireConversationAccess(conversationId)
  if (error) return apiError(status === 404 ? ErrorCodes.NOT_FOUND : ErrorCodes.FORBIDDEN, error, status)
  await prisma.sharedProject.deleteMany({ where: { conversationId } })
  return Response.json({ ok: true })
}
