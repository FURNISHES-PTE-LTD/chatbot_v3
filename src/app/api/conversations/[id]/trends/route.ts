/**
 * Preference trends: trajectory (stable/exploring/narrowing/pivoting) and stability.
 * Ported from V2 get_trends(). Gap 9.
 */
import { generateText } from "ai"
import { openai } from "@/lib/core/openai"
import { prisma } from "@/lib/core/db"
import { requireConversationAccess } from "@/lib/auth"
import { apiError, ErrorCodes } from "@/lib/api"
import { getDomainConfig } from "@/lib/domain/config"
import {
  getOpenAIKey,
  withFallback,
  OPENAI_PRIMARY_MODEL,
  OPENAI_FALLBACK_MODEL,
  computeCost,
  toUsageLike,
} from "@/lib/core/openai"
import { recordCost } from "@/lib/core/cost-logger"

function trajectoryFromChanges(
  changes: Array<{ field: string }>
): "stable" | "exploring" | "narrowing" | "pivoting" {
  if (changes.length === 0) return "stable"
  const n = changes.length
  const fieldsChanged = new Set(changes.map((c) => c.field)).size
  if (n <= 2 && fieldsChanged <= 1) return "stable"
  if (fieldsChanged >= 3 && n >= 3) return "exploring"
  if (n >= 4 && fieldsChanged <= 2) return "narrowing"
  return "exploring"
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error, status } = await requireConversationAccess(id)
  if (error) return apiError(status === 404 ? ErrorCodes.NOT_FOUND : ErrorCodes.FORBIDDEN, error, status)
  const analytics = getDomainConfig().analytics as { trends_enabled?: boolean } | undefined
  if (analytics?.trends_enabled === false) {
    return Response.json({
      summary: "",
      fields: [],
      trajectory: "stable",
      stability: "high",
    })
  }

  const changes = await prisma.preferenceChange.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  })

  const trajectory = trajectoryFromChanges(changes)
  const stability =
    trajectory === "stable"
      ? "high"
      : trajectory === "narrowing"
        ? "medium"
        : "low"

  const fields = changes.map((c: { field: string; changeType: string; confidence: number | null }) => ({
    field: c.field,
    changeType: c.changeType,
    confidence: c.confidence,
  }))

  let summary = `Trajectory: ${trajectory}; stability: ${stability}.`
  if (getOpenAIKey() && changes.length > 0) {
    try {
      const recent = JSON.stringify(fields.slice(-20))
      const prompt = `Preference change history (field, type): ${recent}\nCurrent trajectory: ${trajectory}. In one short sentence, summarize the user's preference evolution. No JSON.`
      const trendResult = await withFallback(
        () =>
          generateText({
            model: openai(OPENAI_PRIMARY_MODEL),
            prompt,
            maxRetries: 2,
          }),
        () =>
          generateText({
            model: openai(OPENAI_FALLBACK_MODEL),
            prompt,
            maxRetries: 1,
          })
      )
      if (trendResult.text?.trim()) summary = trendResult.text.trim()
      if (trendResult.usage) {
        const u = toUsageLike(trendResult.usage)
        const costUsd = computeCost(u, OPENAI_PRIMARY_MODEL)
        void recordCost(id, OPENAI_PRIMARY_MODEL, u.promptTokens ?? 0, u.completionTokens ?? 0, costUsd)
      }
    } catch {
      // keep default summary
    }
  }

  return Response.json({
    summary,
    fields,
    trajectory,
    stability,
  })
}
