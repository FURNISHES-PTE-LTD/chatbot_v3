/**
 * Get LLM-powered design/product recommendations from conversation preferences.
 * Uses Vercel AI SDK generateObject with structured output.
 */
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { zodSchema } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireConversationAccess } from "@/lib/auth-helpers"
import { getDomainConfig } from "@/lib/domain-config"
import { getPreferencesAsRecord } from "@/lib/api-helpers"
import {
  getOpenAIKey,
  withFallback,
  OPENAI_PRIMARY_MODEL,
  OPENAI_FALLBACK_MODEL,
} from "@/lib/openai"

const RecommendationsSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      why_it_fits: z.string(),
      estimated_price: z.number().nullable(),
    })
  ),
  suggestions: z.array(z.string()),
  budget_breakdown: z.record(z.unknown()),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error, status } = await requireConversationAccess(id)
  if (error) return Response.json({ error }, { status })
  const preferences = await getPreferencesAsRecord(prisma, id)

  const domainConfig = getDomainConfig()
  const recCfg = (domainConfig.recommendations ?? {}) as { max_items?: number; enabled?: boolean }
  const maxItems = recCfg.max_items ?? 10
  if (recCfg.enabled === false) {
    return Response.json({ items: [], suggestions: [], budget_breakdown: {} })
  }
  if (!getOpenAIKey()) {
    return Response.json({ items: [], suggestions: [], budget_breakdown: {} })
  }

  try {
    const prefsStr = Object.keys(preferences).length
      ? JSON.stringify(preferences, null, 0)
      : "No preferences yet."
    const prompt = `Based on these user preferences, suggest concrete items and a budget breakdown.
Preferences:
${prefsStr}

Return:
- "items": array of objects with "name", "category", "why_it_fits" (short sentence), "estimated_price" (number or null). Max ${maxItems} items.
- "suggestions": array of short strings (design or product suggestions).
- "budget_breakdown": object with category keys and numeric or range values and optional "notes".`

    const result = await withFallback(
      () =>
        generateObject({
          model: openai(OPENAI_PRIMARY_MODEL),
          schema: zodSchema(RecommendationsSchema),
          prompt,
          maxRetries: 3,
        }),
      () =>
        generateObject({
          model: openai(OPENAI_FALLBACK_MODEL),
          schema: zodSchema(RecommendationsSchema),
          prompt,
          maxRetries: 2,
        })
    )
    const { object } = result
    const items = (object.items ?? []).slice(0, maxItems)
    const suggestions = object.suggestions ?? []
    const budget_breakdown = object.budget_breakdown ?? {}
    return Response.json({ items, suggestions, budget_breakdown })
  } catch {
    return Response.json({ items: [], suggestions: [], budget_breakdown: {} })
  }
}
