import { prisma } from "@/lib/db"

export async function GET() {
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
