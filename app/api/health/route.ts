import { prisma } from "@/lib/core/db"
import { getOpenAIKey } from "@/lib/core/openai"

const startTime = Date.now()

export async function GET() {
  const checks: Record<string, boolean | string> = {
    database: false,
    llm: !!getOpenAIKey(),
    env: !!process.env.DATABASE_URL,
  }
  let status: "ok" | "degraded" | "error" = "ok"
  let errorDetail: string | undefined

  try {
    await prisma.conversation.count()
    checks.database = true
  } catch (e) {
    checks.database = false
    status = "error"
    errorDetail = e instanceof Error ? e.message : String(e)
  }

  if (!checks.llm && status === "ok") status = "degraded"

  const body = {
    ok: status !== "error",
    status,
    database: checks.database ? "connected" : "error",
    llm: checks.llm,
    env: checks.env,
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    ...(errorDetail && { error: errorDetail }),
  }

  return Response.json(body, {
    status: status === "error" ? 503 : 200,
  })
}
