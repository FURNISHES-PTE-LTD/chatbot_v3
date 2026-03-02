/**
 * Keyword-based intent detection (no LLM). Used by policy enforcement.
 */

const LAYOUT_KEYWORDS = [
  "layout",
  "arrange",
  "place",
  "where should i put",
  "floor plan",
  "position",
  "placement",
  "where to put",
  "furniture arrangement",
]
const SHOPPING_KEYWORDS = [
  "shopping list",
  "buy",
  "purchase",
  "where to get",
  "how much will it cost",
  "shopping",
  "buy list",
  "what to buy",
]
const FURNITURE_KEYWORDS = [
  "recommend",
  "suggest furniture",
  "what sofa",
  "which table",
  "furniture recommendation",
  "suggest a",
  "what chair",
  "which chair",
  "what bed",
  "which bed",
  "what desk",
  "which desk",
]

export type Intent = "layout_advice" | "shopping_list" | "furniture_recs" | null

export function detectIntent(message: string): Intent {
  const lower = message.toLowerCase()
  if (LAYOUT_KEYWORDS.some((k) => lower.includes(k))) return "layout_advice"
  if (SHOPPING_KEYWORDS.some((k) => lower.includes(k))) return "shopping_list"
  if (FURNITURE_KEYWORDS.some((k) => lower.includes(k))) return "furniture_recs"
  return null
}
