import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { zodSchema } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/db"

const SuggestionsSchema = z.object({
  suggestions: z.array(z.string()),
})

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ suggestions: ["Mood image", "Floorplan", "Color palette", "Cozy living room", "Small bedroom", "Minimalist tips"] })
  }
  const body = await req.json()
  const { conversationId } = body as { conversationId?: string }
  if (!conversationId) {
    return Response.json({ suggestions: ["Mood image", "Floorplan", "Color palette", "Cozy living room", "Small bedroom", "Minimalist tips"] })
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 20,
  })
  if (messages.length < 2) {
    return Response.json({ suggestions: ["Mood image", "Floorplan", "Color palette", "Cozy living room", "Small bedroom", "Minimalist tips"] })
  }

  const transcript = messages.map((m) => `${m.role}: ${m.content}`).join("\n")

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: zodSchema(SuggestionsSchema),
    prompt: `Based on this interior design conversation, suggest 6-8 short follow-up prompts the user might want to ask next. Return only a JSON object with "suggestions": array of short strings (each 1-5 words), e.g. "Mood image", "Floorplan", "Cozy living room".

Conversation:
${transcript}`,
  })

  return Response.json({ suggestions: object.suggestions.slice(0, 8) })
}
