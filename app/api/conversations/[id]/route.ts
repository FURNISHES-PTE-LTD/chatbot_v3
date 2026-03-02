import { prisma } from "@/lib/db"
import { requireConversationAccess } from "@/lib/auth-helpers"
import { apiError, ErrorCodes } from "@/lib/api-error"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error, status } = await requireConversationAccess(id)
  if (error) return apiError(status === 404 ? ErrorCodes.NOT_FOUND : ErrorCodes.FORBIDDEN, error, status)
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  })

  if (!conversation) {
    return apiError(ErrorCodes.NOT_FOUND, "Conversation not found", 404)
  }

  return Response.json(conversation)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error, status } = await requireConversationAccess(id)
  if (error) return apiError(status === 404 ? ErrorCodes.NOT_FOUND : ErrorCodes.FORBIDDEN, error, status)
  const conversation = await prisma.conversation.findUnique({
    where: { id },
  })
  if (!conversation) {
    return apiError(ErrorCodes.NOT_FOUND, "Conversation not found", 404)
  }
  await prisma.conversation.delete({
    where: { id },
  })
  return Response.json({ ok: true })
}
