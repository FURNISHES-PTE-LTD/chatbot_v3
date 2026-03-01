import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { zodSchema } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { messagesToTranscript } from "@/lib/api-helpers"
import { getOpenAIKey } from "@/lib/openai"

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

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: zodSchema(InsightsSchema),
    prompt: `Analyze this interior design conversation and extract:
- keyInsights: 3-5 most important facts established
- topics: design topics covered (as short tags)
- recommendations: 3-4 actionable next steps
- exploreNext: 2-3 questions the user hasn't answered yet

Conversation:
${transcript}`,
  })

  return Response.json(object)
}
