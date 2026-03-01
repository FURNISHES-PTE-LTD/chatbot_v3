import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { zodSchema } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { messagesToTranscript } from "@/lib/api-helpers"
import { getOpenAIKey } from "@/lib/openai"

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
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    )
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

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: zodSchema(SuggestionsSchema),
    prompt: `Based on this interior design conversation, suggest 6-8 short follow-up prompts the user might want to ask next. Return only a JSON object with "suggestions": array of short strings (each 1-5 words), e.g. "Mood image", "Floorplan", "Cozy living room".

Conversation:
${transcript}`,
    maxRetries: 3,
  })

  return Response.json({ suggestions: object.suggestions.slice(0, 8) })
}
