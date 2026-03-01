import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = session?.user && "id" in session.user ? (session.user as { id: string }).id : null

  const conversations = await prisma.conversation.findMany({
    where: userId ? { userId } : { userId: null },
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
