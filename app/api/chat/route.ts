import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { prisma } from "@/lib/db"
import { z } from "zod"
import {
  validateInput,
  buildSafeSystemPrompt,
  sanitizeOutput,
  checkModeration,
  createSanitizeStreamTransform,
} from "@/lib/guardrails"
import { checkRateLimit } from "@/lib/rate-limit"
import { log } from "@/lib/logger"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDomainConfig } from "@/lib/domain-config"
import { buildContext } from "@/lib/context-builder"
import { getPreferencesAsRecord } from "@/lib/api-helpers"
import {
  getOpenAIKey,
  OPENAI_KEY_MISSING_MESSAGE,
  OPENAI_PRIMARY_MODEL,
  OPENAI_FALLBACK_MODEL,
  computeCost,
  withFallback,
} from "@/lib/openai"
import { checkCostLimit } from "@/lib/cost-tracker"
import { apiError, ErrorCodes } from "@/lib/api-error"

const RequestSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(10000),
  preferences: z.record(z.string()).optional(),
})

export async function POST(req: Request) {
  const start = Date.now()
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous"
  if (!checkRateLimit(clientIp)) {
    return apiError(ErrorCodes.RATE_LIMITED, "Too many requests. Please slow down.", 429)
  }

  if (!getOpenAIKey()) {
    return apiError(ErrorCodes.LLM_UNAVAILABLE, OPENAI_KEY_MISSING_MESSAGE, 503)
  }

  const body = await req.json()
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(ErrorCodes.VALIDATION_ERROR, String(parsed.error.flatten()), 400)
  }

  const { conversationId, message, preferences } = parsed.data
  const validation = validateInput(message)
  if (!validation.valid) {
    return apiError(ErrorCodes.VALIDATION_ERROR, validation.reason ?? "Validation failed", 400)
  }
  const moderation = await checkModeration(message)
  if (!moderation.safe) {
    return apiError(ErrorCodes.MODERATION_FLAGGED, moderation.reason ?? "Moderation flagged", 400)
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
  const convCfg = (domainConfig.conversation ?? {}) as { max_history?: number; summarize_after?: number; max_context_tokens?: number }
  const maxHistory = convCfg.max_history ?? 50

  const historyRows = await prisma.message.findMany({
    where: { conversationId: convoId },
    orderBy: { createdAt: "asc" },
    take: maxHistory,
  })
  const messagesForContext = historyRows.map((m: { role: string; content: string }) => ({
    role: m.role,
    content: m.content,
  }))

  let prefRecord: Record<string, string> = preferences ?? {}
  if (Object.keys(prefRecord).length === 0) {
    prefRecord = await getPreferencesAsRecord(prisma, convoId!)
  }

  const { systemSuffix, messages } = await buildContext(messagesForContext, prefRecord, {
    maxContextTokens: convCfg.max_context_tokens,
    summarizeAfter: convCfg.summarize_after,
  })

  if (convoId) {
    const { allowed, limit } = await checkCostLimit(convoId)
    if (!allowed) {
      return apiError(
        ErrorCodes.RATE_LIMITED,
        `This conversation has reached its usage limit ($${limit}). Please start a new conversation.`,
        429
      )
    }
  }

  const basePrompt = (domainConfig.system_prompt || "").trim() + systemSuffix
  const systemPrompt = buildSafeSystemPrompt(basePrompt)

  const streamOptions = {
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
    abortSignal: req.signal,
    onFinish: ({ usage }: { usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } }) => {
      if (usage) {
        const costUsd = computeCost(usage, OPENAI_PRIMARY_MODEL)
        log({
          level: "info",
          event: "llm_usage",
          conversationId: convoId,
          promptTokens: usage.promptTokens ?? 0,
          completionTokens: usage.completionTokens ?? 0,
          totalTokens: usage.totalTokens ?? 0,
          model: OPENAI_PRIMARY_MODEL,
          costUsd: Math.round(costUsd * 1e6) / 1e6,
        })
      }
    },
  }

  let result: Awaited<ReturnType<typeof streamText>>
  try {
    result = await streamText({
      model: openai(OPENAI_PRIMARY_MODEL),
      ...streamOptions,
      maxRetries: 3,
    })
  } catch {
    result = await streamText({
      model: openai(OPENAI_FALLBACK_MODEL),
      ...streamOptions,
      maxRetries: 2,
    })
  }

  void Promise.resolve(result.text)
    .then(async (fullText) => {
      const sanitized = sanitizeOutput(fullText)
      await prisma.message.create({
        data: { conversationId: convoId!, role: "assistant", content: sanitized },
      })
      log({
        level: "info",
        event: "chat_response",
        conversationId: convoId,
        latencyMs: Date.now() - start,
      })
    })
    .catch((err) => {
      log({
        level: "error",
        event: "message_persist_failed",
        conversationId: convoId,
        error: String(err),
      })
    })

  const response = result.toTextStreamResponse({
    headers: convoId ? { "X-Conversation-Id": convoId } : undefined,
  })
  // Sanitize stream so user never sees leaked [system]: or <|im_start|> etc.
  if (response.body) {
    const sanitizedBody = response.body.pipeThrough(createSanitizeStreamTransform())
    return new Response(sanitizedBody, {
      status: response.status,
      headers: response.headers,
    })
  }
  return response
}
