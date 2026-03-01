import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { zodSchema } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { messagesToTranscript } from "@/lib/api-helpers"
import {
  getOpenAIKey,
  withFallback,
  OPENAI_PRIMARY_MODEL,
  OPENAI_FALLBACK_MODEL,
} from "@/lib/openai"

const InsightsSchema = z.object({
  keyInsights: z.array(z.string()),
  topics: z.array(z.string()),
  recommendations: z.array(z.string()),
  exploreNext: z.array(z.string()),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  })

  if (messages.length < 3) {
    return Response.json({
      keyInsights: [],
      topics: [],
      recommendations: ["Start a conversation to generate insights"],
      exploreNext: ["Tell Eva about your room", "Describe your style preferences"],
    })
  }

  const transcript = messagesToTranscript(messages)

  if (!getOpenAIKey()) {
    return Response.json({
      keyInsights: [],
      topics: [],
      recommendations: ["Add OPENAI_API_KEY to generate insights"],
      exploreNext: ["Tell Eva about your room", "Describe your style preferences"],
    })
  }

  const prompt = `Analyze this interior design conversation and extract:
- keyInsights: 3-5 most important facts established
- topics: design topics covered (as short tags)
- recommendations: 3-4 actionable next steps
- exploreNext: 2-3 questions the user hasn't answered yet

Conversation:
${transcript}`
  const { object } = await withFallback(
    () =>
      generateObject({
        model: openai(OPENAI_PRIMARY_MODEL),
        schema: zodSchema(InsightsSchema),
        prompt,
        maxRetries: 3,
      }),
    () =>
      generateObject({
        model: openai(OPENAI_FALLBACK_MODEL),
        schema: zodSchema(InsightsSchema),
        prompt,
        maxRetries: 2,
      })
  )

  return Response.json(object)
}
