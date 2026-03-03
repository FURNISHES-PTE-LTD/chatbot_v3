import { generateObject } from "ai"
import { openai } from "@/lib/core/openai"
import { zodSchema } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/core/db"
import { messagesToTranscript } from "@/lib/api"
import {
  getOpenAIKey,
  withFallback,
  OPENAI_PRIMARY_MODEL,
  OPENAI_FALLBACK_MODEL,
  computeCost,
  toUsageLike,
} from "@/lib/core/openai"
import { recordCost } from "@/lib/core/cost-logger"
import { apiError, ErrorCodes } from "@/lib/api"

const SuggestionsRequestSchema = z.object({
  conversationId: z.string(),
})

const SuggestionsSchema = z.object({
  suggestions: z.array(z.string()),
})

const DEFAULT_SUGGESTIONS = ["Mood image", "Floorplan", "Color palette", "Cozy living room", "Small bedroom", "Minimalist tips"]

export async function POST(req: Request) {
  if (!getOpenAIKey()) {
    return Response.json({ suggestions: DEFAULT_SUGGESTIONS })
  }
  const body = await req.json()
  const parsed = SuggestionsRequestSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(ErrorCodes.VALIDATION_ERROR, "Invalid request", 400, parsed.error.flatten())
  }
  const { conversationId } = parsed.data

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 20,
  })
  if (messages.length < 2) {
    return Response.json({ suggestions: DEFAULT_SUGGESTIONS })
  }

  const transcript = messagesToTranscript(messages)

  const prompt = `Based on this interior design conversation, suggest 6-8 short follow-up prompts the user might want to ask next. Return only a JSON object with "suggestions": array of short strings (each 1-5 words), e.g. "Mood image", "Floorplan", "Cozy living room".

Conversation:
${transcript}`
  const result = await withFallback(
    () =>
      generateObject({
        model: openai(OPENAI_PRIMARY_MODEL),
        schema: zodSchema(SuggestionsSchema),
        prompt,
        maxRetries: 3,
      }),
    () =>
      generateObject({
        model: openai(OPENAI_FALLBACK_MODEL),
        schema: zodSchema(SuggestionsSchema),
        prompt,
        maxRetries: 2,
      })
  )
  const object = result.object
  if (result.usage) {
    const u = toUsageLike(result.usage)
    const costUsd = computeCost(u, OPENAI_PRIMARY_MODEL)
    void recordCost(
      conversationId,
      OPENAI_PRIMARY_MODEL,
      u.promptTokens ?? 0,
      u.completionTokens ?? 0,
      costUsd
    )
  }

  return Response.json({ suggestions: object.suggestions.slice(0, 8) })
}
