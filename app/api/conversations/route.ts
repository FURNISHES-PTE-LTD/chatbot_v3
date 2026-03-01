import { prisma } from "@/lib/db"

export async function GET() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
  })

  return Response.json(
    conversations.map((c) => ({
      id: c.id,
      title: c.title,
      lastMessage: c.messages[0]?.content?.slice(0, 80) ?? "",
      messageCount: c._count.messages,
      updatedAt: c.updatedAt,
    })),
  )
}
