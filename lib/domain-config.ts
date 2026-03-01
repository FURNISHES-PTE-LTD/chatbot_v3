/**
 * Domain configuration (fields, system prompt, conversation limits).
 * Ported from V2 config/domain.yaml.
 */
import { readFileSync } from "fs"
import { join } from "path"

export interface DomainField {
  id: string
  label: string
  type: string
  vocabulary?: string[]
  suggestions?: string[]
}

export interface DomainConfig {
  name: string
  system_prompt: string
  fields: DomainField[]
  recommendations?: { enabled: boolean; max_items: number; include_alternatives?: boolean }
  analytics?: { insights_enabled: boolean; trends_enabled: boolean; export_formats: string[] }
  guardrails?: { moderation_enabled: boolean; injection_detection: boolean; max_message_length: number }
  conversation?: { max_history: number; summarize_after: number; max_context_tokens: number }
  rate_limits?: { requests_per_minute: number; session_cost_limit_usd: number }
}

let cached: DomainConfig | null = null

function getConfigPath(): string {
  const root = process.cwd()
  return join(root, "config", "domain.json")
}

export function getDomainConfig(): DomainConfig {
  if (cached) return cached
  try {
    const path = getConfigPath()
    const raw = readFileSync(path, "utf-8")
    cached = JSON.parse(raw) as DomainConfig
    return cached!
  } catch {
    cached = {
      name: "default",
      system_prompt: "You are a helpful assistant.",
      fields: [],
      conversation: { max_history: 50, summarize_after: 20, max_context_tokens: 4000 },
    }
    return cached
  }
}
