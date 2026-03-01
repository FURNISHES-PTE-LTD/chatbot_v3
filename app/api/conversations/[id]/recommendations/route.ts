/**
 * Get LLM-powered design/product recommendations from conversation preferences.
 * Ported from V2 recommendations.py.
 */
import { prisma } from "@/lib/db"
import { getDomainConfig } from "@/lib/domain-config"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const prefs = await prisma.preference.findMany({ where: { conversationId: id } })
  const preferences: Record<string, string> = {}
  for (const p of prefs) preferences[p.field] = p.value

  const domainConfig = getDomainConfig()
  const recCfg = domainConfig.recommendations ?? {}
  const maxItems = recCfg.max_items ?? 10
  if (recCfg.enabled === false) {
    return Response.json({ items: [], suggestions: [], budget_breakdown: {} })
  }
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ items: [], suggestions: [], budget_breakdown: {} })
  }

  try {
    const prefsStr = Object.keys(preferences).length
      ? JSON.stringify(preferences, null, 0)
      : "No preferences yet."
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Based on these user preferences, suggest concrete items and a budget breakdown.
Preferences:
${prefsStr}

Respond with a single JSON object with exactly these keys:
- "items": array of objects, each with "name", "category", "why_it_fits" (short sentence), "estimated_price" (number or null). Max ${maxItems} items.
- "suggestions": array of short strings (design or product suggestions).
- "budget_breakdown": object with category keys and numeric "amount" or "range" (e.g. "100-200") and optional "notes".
Output only valid JSON, no markdown.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    })
    if (!res.ok) return Response.json({ items: [], suggestions: [], budget_breakdown: {} })
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    let content = (data.choices?.[0]?.message?.content ?? "").trim()
    if (content.startsWith("```")) {
      content = content.replace(/^```\w*\n?/, "").replace(/\n?```$/, "").trim()
    }
    const parsed = JSON.parse(content) as {
      items?: Array<{ name: string; category: string; why_it_fits: string; estimated_price?: number | null }>
      suggestions?: string[]
      budget_breakdown?: Record<string, unknown>
    }
    const items = (parsed.items ?? []).slice(0, maxItems)
    const suggestions = parsed.suggestions ?? []
    const budget_breakdown = parsed.budget_breakdown ?? {}
    return Response.json({ items, suggestions, budget_breakdown })
  } catch {
    return Response.json({ items: [], suggestions: [], budget_breakdown: {} })
  }
}
