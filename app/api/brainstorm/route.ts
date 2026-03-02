import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { messagesToTranscript } from "@/lib/api-helpers"
import {
  getOpenAIKey,
  OPENAI_KEY_MISSING_MESSAGE,
  withFallback,
  OPENAI_PRIMARY_MODEL,
  OPENAI_FALLBACK_MODEL,
} from "@/lib/openai"
import { apiError, ErrorCodes } from "@/lib/api-error"

const BrainstormRequestSchema = z.object({
  conversationId: z.string(),
  preferences: z.record(z.string()).optional(),
})

export async function POST(req: Request) {
  if (!getOpenAIKey()) {
    return apiError(ErrorCodes.LLM_UNAVAILABLE, OPENAI_KEY_MISSING_MESSAGE, 503)
  }
  const body = await req.json()
  const parsed = BrainstormRequestSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(ErrorCodes.VALIDATION_ERROR, "Invalid request", 400, parsed.error.flatten())
  }
  const { conversationId, preferences } = parsed.data

  const prefs = preferences
    ? Object.entries(preferences)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
    : "none"

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 15,
  })
  const transcript = messagesToTranscript(messages)

  const prompt = `You are Eva, an interior design assistant. Based on this conversation and preferences, write one short paragraph (2-3 sentences) that summarizes design ideas and suggests next steps. Speak directly to the user. Keep it under 80 words.

Preferences: ${prefs}

Conversation:
${transcript}`
  const { text } = await withFallback(
    () =>
      generateText({
        model: openai(OPENAI_PRIMARY_MODEL),
        prompt,
        maxRetries: 3,
      }),
    () =>
      generateText({
        model: openai(OPENAI_FALLBACK_MODEL),
        prompt,
        maxRetries: 2,
      })
  )

  return Response.json({ summary: text.trim() })
}
