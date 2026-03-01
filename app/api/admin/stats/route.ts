import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
  const [totalConvos, totalMessages, byConvo] = await Promise.all([
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.message.groupBy({
      by: ["conversationId"],
      _count: true,
    }),
  ])

  const avgMessagesPerConversation =
    byConvo.length > 0
      ? byConvo.reduce((sum, g) => sum + g._count, 0) / byConvo.length
      : 0

  return Response.json({
    totalConversations: totalConvos,
    totalMessages,
    avgMessagesPerConversation: Math.round(avgMessagesPerConversation * 100) / 100,
  })
}
