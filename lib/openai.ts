/**
 * OpenAI API key access. Use from server-only (API routes, server components).
 */

export const OPENAI_KEY_MISSING_MESSAGE = "OPENAI_API_KEY is not configured."

/** Return the OpenAI API key or null if not set. */
export function getOpenAIKey(): string | null {
  const key = process.env.OPENAI_API_KEY
  return key?.trim() || null
}

/**
 * Return the OpenAI API key, or throw an error with a consistent message.
 * Use in routes when you need the key and want to fail fast.
 */
export function requireOpenAIKey(): string {
  const key = getOpenAIKey()
  if (!key) throw new Error(OPENAI_KEY_MISSING_MESSAGE)
  return key
}
