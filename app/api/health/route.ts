import { prisma } from "@/lib/db"
import { getOpenAIKey } from "@/lib/openai"

export async function GET() {
  try {
    await prisma.conversation.count()
    return Response.json({
      ok: true,
      database: "connected",
      llm: !!getOpenAIKey(),
    })
  } catch (e) {
    return Response.json(
      { ok: false, database: "error", error: String(e) },
      { status: 503 },
    )
  }
}
