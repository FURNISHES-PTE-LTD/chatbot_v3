import { detectIntent } from "./intent-detector"

export type PolicyRule = {
  trigger: string
  requires: string[]
  message: string
}

const POLICY_RULES: PolicyRule[] = [
  {
    trigger: "layout_advice",
    requires: ["roomType", "roomDimensions"],
    message: "I'd love to help with layout! Could you tell me your room dimensions first?",
  },
  {
    trigger: "shopping_list",
    requires: ["budget"],
    message: "To give you a useful shopping list, what's your budget range?",
  },
  {
    trigger: "furniture_recs",
    requires: ["roomType"],
    message: "What room are you furnishing? That'll help me suggest the right pieces.",
  },
]

export interface PolicyResult {
  blocked: boolean
  clarificationMessage?: string
}

/**
 * Check if the user's intent requires preferences that are missing.
 * If blocked, return the clarification message (skip LLM call).
 */
export function checkPolicy(
  userMessage: string,
  currentPreferences: Record<string, string>
): PolicyResult {
  const intent = detectIntent(userMessage)
  if (!intent) return { blocked: false }

  const rule = POLICY_RULES.find((r) => r.trigger === intent)
  if (!rule) return { blocked: false }

  const missing = rule.requires.filter((key) => {
    const val = currentPreferences[key]
    return val === undefined || val === null || String(val).trim() === ""
  })
  if (missing.length === 0) return { blocked: false }

  return {
    blocked: true,
    clarificationMessage: rule.message,
  }
}
