/**
 * OpenAI API key access. Use from server-only (API routes, server components).
 * Gap 7: primary/fallback model names for LLM reliability.
 */

export const OPENAI_KEY_MISSING_MESSAGE = "OPENAI_API_KEY is not configured."

/** Primary chat/completion model (Gap 7). */
export const OPENAI_PRIMARY_MODEL = "gpt-4o-mini"
/** Fallback model when primary fails (Gap 7). */
export const OPENAI_FALLBACK_MODEL = "gpt-3.5-turbo"

/** USD per 1M tokens (input, output) for cost tracking. Approximate as of 2024. */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
}

export type UsageLike = { promptTokens?: number; completionTokens?: number; totalTokens?: number }

/** Compute approximate USD cost for a request (Gap 7 cost tracking). */
export function computeCost(usage: UsageLike, model: string): number {
  const pricing = MODEL_PRICING[model]
  if (!pricing) return 0
  const prompt = (usage.promptTokens ?? 0) / 1_000_000
  const completion = (usage.completionTokens ?? 0) / 1_000_000
  return prompt * pricing.input + completion * pricing.output
}

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
