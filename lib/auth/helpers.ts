import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/core/db"

export async function requireConversationAccess(conversationId: string) {
  const session = await getServerSession(authOptions)
  const userId =
    session?.user && "id" in session.user ? (session.user as { id: string }).id : null
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  })
  if (!conversation) return { error: "Not found", status: 404, conversation: null }
  if (conversation.userId && conversation.userId !== userId)
    return { error: "Forbidden", status: 403, conversation: null }
  return { error: null, status: 200, conversation }
}
