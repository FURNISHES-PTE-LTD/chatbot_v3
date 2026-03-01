import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { messagesToTranscript } from "@/lib/api-helpers"
import { getOpenAIKey, OPENAI_KEY_MISSING_MESSAGE } from "@/lib/openai"

const BrainstormRequestSchema = z.object({
  conversationId: z.string(),
  preferences: z.record(z.string()).optional(),
})

export async function POST(req: Request) {
  if (!getOpenAIKey()) {
    return Response.json({ error: OPENAI_KEY_MISSING_MESSAGE }, { status: 503 })
  }
  const body = await req.json()
  const parsed = BrainstormRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    )
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

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: `You are Eva, an interior design assistant. Based on this conversation and preferences, write one short paragraph (2-3 sentences) that summarizes design ideas and suggests next steps. Speak directly to the user. Keep it under 80 words.

Preferences: ${prefs}

Conversation:
${transcript}`,
    maxRetries: 3,
  })

  return Response.json({ summary: text.trim() })
}
