import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { apiError, ErrorCodes } from "@/lib/api-error"
import { log } from "@/lib/logger"

export async function GET() {
  try {
    let userId: string | null = null
    try {
      const session = await getServerSession(authOptions)
      userId = session?.user && "id" in session.user ? (session.user as { id: string }).id : null
    } catch {
      // Auth misconfigured or unavailable; treat as no user so UI still loads
    }

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
      conversations.map((c: { id: string; title: string; messages: { content: string }[]; _count: { messages: number }; updatedAt: Date }) => ({
        id: c.id,
        title: c.title,
        lastMessage: c.messages[0]?.content?.slice(0, 80) ?? "",
        messageCount: c._count.messages,
        updatedAt: c.updatedAt,
      })),
    )
  } catch (e) {
    log({ level: "error", event: "api_conversations_error", error: String(e) })
    const message = e instanceof Error ? e.message : "Database unavailable"
    const status = message.includes("Invalid environment") || message.includes("DATABASE") ? 503 : 500
    return apiError(ErrorCodes.INTERNAL_ERROR, message, status)
  }
}
