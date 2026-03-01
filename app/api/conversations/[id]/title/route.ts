import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { prisma } from "@/lib/db"
import { messagesToTranscript } from "@/lib/api-helpers"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 4,
  })

  const preview = messagesToTranscript(messages)

  const { text: title } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: `Generate a 4-6 word title for this interior design conversation. Return ONLY the title, no quotes:\n\n${preview}`,
  })

  const trimmed = title.trim().slice(0, 60)
  await prisma.conversation.update({
    where: { id },
    data: { title: trimmed },
  })

  return Response.json({ title: trimmed })
}
