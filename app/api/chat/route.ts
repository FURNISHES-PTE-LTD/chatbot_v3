import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { validateInput, buildSafeSystemPrompt } from "@/lib/guardrails"
import { checkRateLimit } from "@/lib/rate-limit"
import { log } from "@/lib/logger"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDomainConfig } from "@/lib/domain-config"
import { buildContext } from "@/lib/context-builder"

const RequestSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(10000),
  preferences: z.record(z.string()).optional(),
})

export async function POST(req: Request) {
  const start = Date.now()
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous"
  if (!checkRateLimit(clientIp)) {
    return Response.json({ error: "Too many requests. Please slow down." }, { status: 429 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY is not set. Add it to .env.local to enable chat." },
      { status: 503 }
    )
  }

  const body = await req.json()
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { conversationId, message, preferences } = parsed.data
  const validation = validateInput(message)
  if (!validation.valid) {
    return Response.json({ error: validation.reason }, { status: 400 })
  }

  const session = await getServerSession(authOptions)
  const userId = session?.user && "id" in session.user ? (session.user as { id: string }).id : null

  let convoId = conversationId
  if (!convoId) {
    const convo = await prisma.conversation.create({
      data: userId ? { userId } : {},
    })
    convoId = convo.id
  }

  await prisma.message.create({
    data: { conversationId: convoId, role: "user", content: message },
  })

  const domainConfig = getDomainConfig()
  const convCfg = domainConfig.conversation ?? {}
  const maxHistory = convCfg.max_history ?? 50

  const historyRows = await prisma.message.findMany({
    where: { conversationId: convoId },
    orderBy: { createdAt: "asc" },
    take: maxHistory,
  })
  const messagesForContext = historyRows.map((m) => ({ role: m.role, content: m.content }))

  let prefRecord: Record<string, string> = preferences ?? {}
  if (Object.keys(prefRecord).length === 0) {
    const prefs = await prisma.preference.findMany({ where: { conversationId: convoId } })
    for (const p of prefs) prefRecord[p.field] = p.value
  }

  const { systemSuffix, messages } = await buildContext(messagesForContext, prefRecord, {
    maxContextTokens: convCfg.max_context_tokens,
    summarizeAfter: convCfg.summarize_after,
  })

  const basePrompt = (domainConfig.system_prompt || "").trim() + systemSuffix
  const systemPrompt = buildSafeSystemPrompt(basePrompt)

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  })

  result.text.then(async (fullText) => {
    await prisma.message.create({
      data: { conversationId: convoId!, role: "assistant", content: fullText },
    })
    log({
      level: "info",
      event: "chat_response",
      conversationId: convoId,
      latencyMs: Date.now() - start,
    })
  })

  return result.toTextStreamResponse({
    headers: { "X-Conversation-Id": convoId },
  })
}
