import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { prisma } from "@/lib/db"
import { z } from "zod"

const RequestSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(10000),
  preferences: z.record(z.string()).optional(),
})

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY is not set. Add it to .env.local to enable chat." },
      { status: 503 }
    )
  }

  const body = await req.json()
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { conversationId, message, preferences } = parsed.data

  let convoId = conversationId
  if (!convoId) {
    const convo = await prisma.conversation.create({ data: {} })
    convoId = convo.id
  }

  await prisma.message.create({
    data: { conversationId: convoId, role: "user", content: message },
  })

  const history = await prisma.message.findMany({
    where: { conversationId: convoId },
    orderBy: { createdAt: "asc" },
    take: 50,
  })

  const prefContext = preferences
    ? Object.entries(preferences)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
    : "none gathered yet"

  const systemPrompt = `You are Eva, a friendly interior design assistant. You help users plan room designs, choose furniture, select color palettes, and create design briefs.

Current user preferences: ${prefContext}

Guidelines:
- Be warm, concise, and specific to interior design
- When the user mentions preferences (room type, style, colors, budget, furniture), acknowledge them naturally
- Suggest concrete options when possible (specific furniture styles, color combinations, layout ideas)
- Ask clarifying follow-up questions to refine their design brief
- Keep responses under 150 words unless the user asks for detail`

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages: history.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  })

  result.text.then(async (fullText) => {
    await prisma.message.create({
      data: { conversationId: convoId!, role: "assistant", content: fullText },
    })
  })

  return result.toTextStreamResponse({
    headers: { "X-Conversation-Id": convoId },
  })
}
