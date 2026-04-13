import { getDomainConfig } from "@/lib/domain/config"
import { getOpenAIKey } from "./openai"

export { sanitizeOutput } from "./sanitize-output"

const MAX_MESSAGE_LENGTH = 10000

/** Patterns that may indicate prompt injection (case-insensitive). Ported from V2. */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|above)/i,
  /you\s+are\s+now\s+/i,
  /new\s+instructions\s*:/i,
  /system\s*:\s*/i,
  /\[system\]/i,
  /<\|(im_start|system)\|>/i,
  /human\s*:\s*/i,
  /assistant\s*:\s*/i,
  /prompt\s*:\s*/i,
  /jailbreak/i,
  /override\s+(your\s+)?(instructions|rules)/i,
  /act\s+as\s+if\s+you\s+(are|were)/i,
  /pretend\s+you\s+(are|have)/i,
]

export function checkInjection(message: string): { safe: boolean; reason?: string } {
  if (typeof message !== "string") return { safe: true }
  for (const pat of INJECTION_PATTERNS) {
    if (pat.test(message)) {
      return { safe: false, reason: "Possible prompt injection detected" }
    }
  }
  return { safe: true }
}

export function validateInput(content: string): { valid: boolean; reason?: string } {
  if (typeof content !== "string") {
    return { valid: false, reason: "Invalid message" }
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, reason: "Message too long" }
  }
  if (content.trim().length === 0) {
    return { valid: false, reason: "Empty message" }
  }
  // Injection detection: default true so production is protected even if config missing
  const guardrails = getDomainConfig().guardrails
  if (guardrails?.injection_detection !== false) {
    const inj = checkInjection(content)
    if (!inj.safe) return { valid: false, reason: inj.reason }
  }
  return { valid: true }
}

/**
 * Call OpenAI Moderation API when guardrails.moderation_enabled is true (Gap 23).
 * On API failure, allows the message through to avoid blocking users.
 */
export async function checkModeration(
  message: string
): Promise<{ safe: boolean; reason?: string }> {
  const guardrails = getDomainConfig().guardrails
  if (!guardrails?.moderation_enabled) return { safe: true }
  const key = getOpenAIKey()
  if (!key || typeof message !== "string" || !message.trim()) return { safe: true }

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ input: message }),
    })
    if (!res.ok) return { safe: true }
    const data = (await res.json()) as { results?: Array<{ flagged?: boolean }> }
    const flagged = data.results?.[0]?.flagged === true
    return flagged ? { safe: false, reason: "Content flagged by moderation" } : { safe: true }
  } catch {
    return { safe: true }
  }
}

export function buildSafeSystemPrompt(base: string): string {
  return `${base}

IMPORTANT: You are an interior design assistant ONLY. If the user asks about topics unrelated to design, home improvement, furniture, or decor, politely redirect them back to design topics. Never provide advice on medical, legal, financial, or harmful topics.`
}
