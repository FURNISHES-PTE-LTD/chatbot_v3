import { getDomainConfig } from "@/lib/domain-config"
import { getOpenAIKey } from "@/lib/openai"

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

/** Patterns that indicate leaked prompt/system text in LLM output. Ported from V2. */
const PROMPT_LEAK_PATTERNS = [
  /\[?system\]?\s*:.*$/im,
  /<\|im_start\|>.*$/im,
  /<\|im_end\|>/g,
  /Human\s*:.*$/im,
  /Assistant\s*:.*$/im,
  /^(system|human|assistant)\s*:\s*/im,
]

const ROLE_LINE = /^(system|human|assistant)\s*:\s*/i
const MAX_OUTPUT_LENGTH = 10000

/**
 * Sanitize LLM output: strip prompt leak markers and truncate to max length.
 * Ported from V2 check_output().
 */
export function sanitizeOutput(text: string): string {
  if (typeof text !== "string" || !text.trim()) return ""
  const lines = text.split("\n")
  const out: string[] = []
  for (const line of lines) {
    let stripped = line
    for (const pat of PROMPT_LEAK_PATTERNS) {
      stripped = stripped.replace(pat, "")
    }
    stripped = stripped.trim()
    if (stripped && !ROLE_LINE.test(stripped)) out.push(line)
  }
  let result = out.join("\n").trim() || text.trim()
  if (result.length > MAX_OUTPUT_LENGTH) {
    result = result.slice(0, MAX_OUTPUT_LENGTH - 3).trimEnd() + "..."
  }
  return result
}

/** Strip a single line of prompt-leak content; return empty if line should be dropped. */
function stripLine(line: string): string {
  let stripped = line
  for (const pat of PROMPT_LEAK_PATTERNS) {
    stripped = stripped.replace(pat, "")
  }
  stripped = stripped.trim()
  if (!stripped || ROLE_LINE.test(stripped)) return ""
  return stripped
}

/**
 * Create a TransformStream that sanitizes streamed LLM output line-by-line
 * so the user never sees leaked [system]: or <|im_start|> etc.
 */
export function createSanitizeStreamTransform(): TransformStream<Uint8Array, Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let buffer = ""

  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""
      for (const line of lines) {
        const out = stripLine(line)
        if (out) controller.enqueue(encoder.encode(out + "\n"))
      }
    },
    flush(controller) {
      if (buffer) {
        const out = stripLine(buffer)
        if (out) controller.enqueue(encoder.encode(out))
      }
    },
  })
}

export function buildSafeSystemPrompt(base: string): string {
  return `${base}

IMPORTANT: You are an interior design assistant ONLY. If the user asks about topics unrelated to design, home improvement, furniture, or decor, politely redirect them back to design topics. Never provide advice on medical, legal, financial, or harmful topics.`
}
