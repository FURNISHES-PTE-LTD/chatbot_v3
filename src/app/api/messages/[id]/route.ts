import { prisma } from "@/lib/core/db"
import { requireConversationAccess } from "@/lib/auth"
import { apiError, ErrorCodes } from "@/lib/api"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: messageId } = await params
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, content: true, role: true, createdAt: true, conversationId: true },
  })
  if (!message) return apiError(ErrorCodes.NOT_FOUND, "Message not found", 404)
  const { error, status } = await requireConversationAccess(message.conversationId)
  if (error) return apiError(status === 404 ? ErrorCodes.NOT_FOUND : ErrorCodes.FORBIDDEN, error, status)
  return Response.json({
    id: message.id,
    content: message.content,
    role: message.role,
    createdAt: message.createdAt,
  })
}
