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
 * Shared by API persistence and client-side streaming display (no line-buffered stream transform).
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
