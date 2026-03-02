/**
 * Conversation context builder: token-aware history, optional summarization of older messages.
 * Ported from V2 conversation.py.
 */
import { messagesToTranscript } from "@/lib/api"
import { getOpenAIKey, OPENAI_PRIMARY_MODEL } from "./openai"

const CHARS_PER_TOKEN = 4
const MAX_CONTEXT_CHARS = 3000

function estimateTokens(text: string): number {
  return Math.max(0, Math.floor(text.length / CHARS_PER_TOKEN))
}

export interface MessageForContext {
  role: string
  content: string
}

export interface BuildContextResult {
  systemSuffix: string
  messages: MessageForContext[]
}

/**
 * Summarize a list of messages via LLM into one short paragraph. Call from server only (uses OPENAI_API_KEY).
 */
async function summarizeMessages(messages: MessageForContext[]): Promise<string> {
  const key = getOpenAIKey()
  if (!key || messages.length === 0) return ""
  try {
    const blob = messagesToTranscript(
      messages.map((m) => ({ role: m.role, content: (m.content || "").slice(0, 300) })),
    )
    const body = blob.length > MAX_CONTEXT_CHARS ? blob.slice(-MAX_CONTEXT_CHARS) : blob
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: OPENAI_PRIMARY_MODEL,
        messages: [
          {
            role: "user",
            content: `Summarize this conversation in 2-4 sentences, preserving key preferences and decisions:\n\n${body}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    })
    if (!res.ok) return ""
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const content = data.choices?.[0]?.message?.content
    return (content ?? "").trim()
  } catch {
    return ""
  }
}

/**
 * Build context for LLM: system suffix (preferences) + messages (recent or summarized).
 */
export async function buildContext(
  messages: MessageForContext[],
  preferences: Record<string, string>,
  options: {
    maxContextTokens?: number
    summarizeAfter?: number
  } = {}
): Promise<BuildContextResult> {
  const maxContextTokens = options.maxContextTokens ?? 4000
  const summarizeAfter = options.summarizeAfter ?? 20
  const approxChars = maxContextTokens * CHARS_PER_TOKEN

  const systemSuffix = Object.keys(preferences).length
    ? `\n\nCurrent preferences (use for context): ${JSON.stringify(preferences)}`
    : ""

  let totalTokens = 0
  for (const m of messages) {
    totalTokens += estimateTokens(m.content || "") + 5
  }

  if (totalTokens <= maxContextTokens && messages.length <= summarizeAfter) {
    return { systemSuffix, messages: messages.map((m) => ({ role: m.role, content: m.content || "" })) }
  }

  if (messages.length > summarizeAfter && getOpenAIKey()) {
    const toSummarize = messages.slice(0, -summarizeAfter)
    const rest = messages.slice(-summarizeAfter)
    const summary = await summarizeMessages(toSummarize)
    const out: MessageForContext[] = []
    if (summary) {
      out.push({ role: "user", content: `[Earlier conversation summary]: ${summary}` })
    }
    for (const m of rest) {
      out.push({ role: m.role, content: m.content || "" })
    }
    let count = 0
    const trimmed: MessageForContext[] = []
    for (let i = out.length - 1; i >= 0; i--) {
      count += (out[i].content?.length ?? 0) + 20
      if (count > approxChars) break
      trimmed.unshift(out[i])
    }
    return { systemSuffix, messages: trimmed.length ? trimmed : out }
  }

  const out: MessageForContext[] = []
  let count = 0
  for (let i = messages.length - 1; i >= 0; i--) {
    count += (messages[i].content?.length ?? 0) + 20
    if (count > approxChars) break
    out.unshift({ role: messages[i].role, content: messages[i].content || "" })
  }
  return { systemSuffix, messages: out.length ? out : messages.map((m) => ({ role: m.role, content: m.content || "" })) }
}
