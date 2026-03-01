import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ summary: "Add OPENAI_API_KEY to enable brainstorming." }, { status: 503 })
  }
  const body = await req.json()
  const { conversationId, preferences } = body as { conversationId?: string; preferences?: Record<string, string> }
  if (!conversationId) {
    return Response.json({ error: "conversationId required" }, { status: 400 })
  }

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
  const transcript = messages.map((m) => `${m.role}: ${m.content}`).join("\n")

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: `You are Eva, an interior design assistant. Based on this conversation and preferences, write one short paragraph (2-3 sentences) that summarizes design ideas and suggests next steps. Speak directly to the user. Keep it under 80 words.

Preferences: ${prefs}

Conversation:
${transcript}`,
  })

  return Response.json({ summary: text.trim() })
}
