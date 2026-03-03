import { streamText } from "ai"
import { openai } from "@/lib/core/openai"
import { prisma } from "@/lib/core/db"
import { z } from "zod"
import {
  validateInput,
  buildSafeSystemPrompt,
  sanitizeOutput,
  checkModeration,
  createSanitizeStreamTransform,
} from "@/lib/core/guardrails"
import { checkRateLimit } from "@/lib/core/rate-limit"
import { log } from "@/lib/core/logger"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDomainConfig } from "@/lib/domain/config"
import { buildContext } from "@/lib/core/context-builder"
import { getPreferencesAsRecord } from "@/lib/api"
import {
  getOpenAIKey,
  OPENAI_KEY_MISSING_MESSAGE,
  OPENAI_PRIMARY_MODEL,
  OPENAI_FALLBACK_MODEL,
  computeCost,
  withFallback,
} from "@/lib/core/openai"
import { checkCostLimit } from "@/lib/core/cost-tracker"
import { recordCost } from "@/lib/core/cost-logger"
import { lookupDesignRule, planLayout, parseRoomDimensions, parseLayoutOpenings } from "@/lib/design-rules"
import { retrieveRelevant } from "@/lib/rag/retriever"
import { checkPolicy } from "@/lib/policy/enforcement"
import { getResponseLengthInstruction } from "@/lib/core/response-length"
import { apiError, ErrorCodes } from "@/lib/api"
import { logSecurityEvent } from "@/lib/core/security-logger"

const RequestSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(10000),
  preferences: z.record(z.string()).optional(),
})

export async function POST(req: Request) {
  const start = Date.now()
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous"
  if (!(await checkRateLimit(clientIp))) {
    logSecurityEvent({ type: "rate_limit", clientIp })
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
    if (validation.reason?.toLowerCase().includes("injection")) {
      logSecurityEvent({ type: "injection_detected", clientIp, details: validation.reason })
    }
    return apiError(ErrorCodes.VALIDATION_ERROR, validation.reason ?? "Validation failed", 400)
  }
  const moderation = await checkModeration(message)
  if (!moderation.safe) {
    logSecurityEvent({ type: "moderation_flagged", clientIp, details: moderation.reason })
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

  // Cost check before creating user message so 429 does not leave an orphan message (Bug 3)
  if (convoId) {
    const { allowed, limit } = await checkCostLimit(convoId)
    if (!allowed) {
      logSecurityEvent({ type: "cost_limit_hit", clientIp, conversationId: convoId })
      return apiError(
        ErrorCodes.RATE_LIMITED,
        `This conversation has reached its usage limit ($${limit}). Please start a new conversation.`,
        429
      )
    }
  }

  const userMessage = await prisma.message.create({
    data: { conversationId: convoId, role: "user", content: message },
  })

  try {
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

  const policy = checkPolicy(message, prefRecord)
  if (policy.blocked && policy.clarificationMessage) {
    await prisma.message.create({
      data: { conversationId: convoId!, role: "assistant", content: policy.clarificationMessage },
    })
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(policy.clarificationMessage!))
        controller.close()
      },
    })
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        ...(convoId ? { "X-Conversation-Id": convoId } : {}),
        "X-User-Message-Id": userMessage.id,
      },
    })
  }

  const { systemSuffix, messages } = await buildContext(messagesForContext, prefRecord, {
    maxContextTokens: convCfg.max_context_tokens,
    summarizeAfter: convCfg.summarize_after,
  })

  let basePrompt = (domainConfig.system_prompt || "").trim() + systemSuffix
  const designRule = lookupDesignRule(message)
  if (designRule) {
    basePrompt += `\n\n[DESIGN RULE] Use these exact numbers when answering: ${designRule}`
  }
  try {
    const ragChunks = await retrieveRelevant(message, 3)
    if (ragChunks.length > 0) {
      basePrompt += `\n\n[DESIGN KNOWLEDGE] Ground your answer in this when relevant:\n${ragChunks.join("\n\n---\n\n")}`
    }
  } catch {
    // RAG optional (e.g. no embeddings seeded or no API key)
  }
  const layoutKeywords = ["layout", "arrange", "where should i put", "where to put", "placement", "floor plan"]
  const wantsLayout = layoutKeywords.some((k) => message.toLowerCase().includes(k))
  if (wantsLayout) {
    const parsed = parseRoomDimensions(message)
    const roomW = prefRecord.roomWidth ?? (parsed != null ? String(parsed.widthInches / 12) : null)
    const roomL = prefRecord.roomLength ?? (parsed != null ? String(parsed.lengthInches / 12) : null)
    if (roomW && roomL) {
      const widthInches = typeof roomW === "string" ? parseFloat(roomW) * 12 : Number(roomW) * 12
      const lengthInches = typeof roomL === "string" ? parseFloat(roomL) * 12 : Number(roomL) * 12
      if (widthInches > 0 && lengthInches > 0) {
        const openings = parseLayoutOpenings(message)
        const options = planLayout({
          roomWidthInches: widthInches,
          roomLengthInches: lengthInches,
          doors: openings.doors,
          windows: openings.windows,
          closets: openings.closets,
        })
        const layoutText = options
          .map(
            (opt, i) =>
              `Option ${i + 1}: ${opt.rationale} Placements: ${opt.placements.map((p) => `${p.piece} on ${p.position.wall} wall`).join("; ")}.`
          )
          .join(" ")
        basePrompt += `\n\n[LAYOUT OPTIONS] Present these placement options naturally: ${layoutText}`
      }
    }
  }
  const responseLengthInstruction = getResponseLengthInstruction(message, messagesForContext.length)
  basePrompt += `\n\n${responseLengthInstruction}`
  const systemPrompt = buildSafeSystemPrompt(basePrompt)

  function buildStreamOptions(model: string) {
    return {
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
      abortSignal: req.signal,
      onFinish: ({ usage }: { usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } }) => {
        if (usage && convoId) {
          const promptTokens = usage.promptTokens ?? 0
          const completionTokens = usage.completionTokens ?? 0
          const costUsd = computeCost(usage, model)
          log({
            level: "info",
            event: "llm_usage",
            conversationId: convoId,
            promptTokens,
            completionTokens,
            totalTokens: usage.totalTokens ?? 0,
            model,
            costUsd: Math.round(costUsd * 1e6) / 1e6,
          })
          void recordCost(convoId, model, promptTokens, completionTokens, costUsd)
        }
      },
    }
  }

  let result: Awaited<ReturnType<typeof streamText>>
  try {
    result = await streamText({
      model: openai(OPENAI_PRIMARY_MODEL),
      ...buildStreamOptions(OPENAI_PRIMARY_MODEL),
      maxRetries: 3,
    })
  } catch (primaryErr) {
    log({ level: "warn", event: "chat_primary_model_failed", error: String(primaryErr) })
    try {
      result = await streamText({
        model: openai(OPENAI_FALLBACK_MODEL),
        ...buildStreamOptions(OPENAI_FALLBACK_MODEL),
        maxRetries: 2,
      })
    } catch (fallbackErr) {
      log({ level: "error", event: "chat_all_models_failed", primary: String(primaryErr), fallback: String(fallbackErr) })
      return apiError(
        ErrorCodes.LLM_UNAVAILABLE,
        "The AI service is temporarily unavailable. Please try again in a moment.",
        503
      )
    }
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
    headers: {
      ...(convoId ? { "X-Conversation-Id": convoId } : {}),
      "X-User-Message-Id": userMessage.id,
    },
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
  } catch (err) {
    log({ level: "error", event: "chat_route_error", error: String(err) })
    return apiError(
      ErrorCodes.INTERNAL_ERROR,
      "Something went wrong. Please try again.",
      500
    )
  }
}
