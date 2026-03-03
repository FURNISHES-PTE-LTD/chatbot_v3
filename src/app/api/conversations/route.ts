import { prisma } from "@/lib/core/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { apiError, ErrorCodes } from "@/lib/api"
import { log } from "@/lib/core/logger"

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export async function GET(req: Request) {
  try {
    let userId: string | null = null
    try {
      const session = await getServerSession(authOptions)
      userId = session?.user && "id" in session.user ? (session.user as { id: string }).id : null
    } catch {
      // Auth misconfigured or unavailable; treat as no user so UI still loads
    }

    const url = req.url ? new URL(req.url) : null
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(url?.searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
    )
    const offset = Math.max(0, parseInt(url?.searchParams.get("offset") ?? "0", 10) || 0)

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: userId ? { userId } : { userId: null },
        orderBy: { updatedAt: "desc" },
        skip: offset,
        take: limit + 1,
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { messages: true } },
        },
      }),
      prisma.conversation.count({ where: userId ? { userId } : { userId: null } }),
    ])

    const hasMore = conversations.length > limit
    const page = conversations.slice(0, limit)

    return Response.json({
      conversations: page.map((c: { id: string; title: string; messages: { content: string }[]; _count: { messages: number }; updatedAt: Date }) => ({
        id: c.id,
        title: c.title,
        lastMessage: c.messages[0]?.content?.slice(0, 80) ?? "",
        messageCount: c._count.messages,
        updatedAt: c.updatedAt,
      })),
      hasMore,
      total,
    })
  } catch (e) {
    log({ level: "error", event: "api_conversations_error", error: String(e) })
    const message = e instanceof Error ? e.message : "Database unavailable"
    const status = message.includes("Invalid environment") || message.includes("DATABASE") ? 503 : 500
    return apiError(ErrorCodes.INTERNAL_ERROR, message, status)
  }
}
