/**
 * OpenAI API key access. Use from server-only (API routes, server components).
 * Gap 7: primary/fallback model names for LLM reliability.
 */

export const OPENAI_KEY_MISSING_MESSAGE = "OPENAI_API_KEY is not configured."

/** Primary chat/completion model (Gap 7). */
export const OPENAI_PRIMARY_MODEL = "gpt-4o-mini"
/** Fallback model when primary fails (Gap 7). */
export const OPENAI_FALLBACK_MODEL = "gpt-3.5-turbo"

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

/**
 * Run an async operation; on failure, run the fallback. Used for LLM fallback model (Gap 7).
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  try {
    return await primary()
  } catch {
    return await fallback()
  }
}
