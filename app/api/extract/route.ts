import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { zodSchema } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/db"

const ExtractionSchema = z.object({
  entities: z.array(
    z.object({
      text: z.string(),
      field: z.enum(["roomType", "style", "budget", "color", "furniture", "exclusion"]),
      confidence: z.number().min(0).max(1),
    }),
  ),
})

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY not set" }, { status: 503 })
  }
  const body = await req.json()
  const { messageId, content, conversationId } = body as {
    messageId?: string | null
    content?: string
    conversationId?: string
  }
  if (!content || !conversationId) {
    return Response.json({ error: "content and conversationId required" }, { status: 400 })
  }

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: zodSchema(ExtractionSchema),
    prompt: `Extract interior design preferences from this message. Only extract what is explicitly stated. Set confidence below 0.7 for ambiguous mentions.\n\nMessage: "${content}"`,
  })

  if (messageId) {
    await prisma.message.update({
      where: { id: messageId },
      data: { extractions: object.entities },
    })
  }

  for (const entity of object.entities) {
    await prisma.preference.upsert({
      where: {
        conversationId_field: { conversationId, field: entity.field },
      },
      create: {
        conversationId,
        field: entity.field,
        value: entity.text,
        confidence: entity.confidence,
        status:
          entity.confidence > 0.85
            ? "confirmed"
            : entity.confidence > 0.6
              ? "potential"
              : "inferred",
        source: messageId ?? undefined,
      },
      update: {
        value: entity.text,
        confidence: entity.confidence,
        status:
          entity.confidence > 0.85
            ? "confirmed"
            : entity.confidence > 0.6
              ? "potential"
              : "inferred",
        source: messageId ?? undefined,
      },
    })
  }

  return Response.json({ entities: object.entities })
}
