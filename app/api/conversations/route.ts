import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  let userId: string | null = null
  try {
    const session = await getServerSession(authOptions)
    userId = session?.user && "id" in session.user ? (session.user as { id: string }).id : null
  } catch {
    // Auth misconfigured or unavailable; treat as no user so UI still loads
  }

  try {
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
  } catch (e) {
    console.error("[GET /api/conversations]", e)
    const message = e instanceof Error ? e.message : "Database unavailable"
    return Response.json({ error: message }, { status: 503 })
  }
}
