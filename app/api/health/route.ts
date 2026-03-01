import { prisma } from "@/lib/db"

export async function GET() {
  try {
    await prisma.conversation.count()
    return Response.json({
      ok: true,
      database: "connected",
      llm: !!process.env.OPENAI_API_KEY,
    })
  } catch (e) {
    return Response.json(
      { ok: false, database: "error", error: String(e) },
      { status: 503 },
    )
  }
}
