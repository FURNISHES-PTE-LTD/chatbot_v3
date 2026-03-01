/**
 * Export conversation as JSON or Markdown (preferences, change history, messages).
 * Markdown includes optional LLM-generated summary, key_decisions, open_questions (Gap 8).
 */
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { zodSchema } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/db"
import {
  getOpenAIKey,
  withFallback,
  OPENAI_PRIMARY_MODEL,
  OPENAI_FALLBACK_MODEL,
} from "@/lib/openai"

const ExportSummarySchema = z.object({
  summary: z.string().describe("2-3 sentence project summary"),
  key_decisions: z.array(z.string()).describe("Main choices made"),
  open_questions: z.array(z.string()).describe("1-3 open questions"),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const url = new URL(req.url)
  const format = (url.searchParams.get("format") ?? "markdown").toLowerCase()
  const validFormat = format === "json" || format === "markdown" ? format : "markdown"

  const [prefs, changes, messages] = await Promise.all([
    prisma.preference.findMany({ where: { conversationId: id } }),
    prisma.preferenceChange.findMany({ where: { conversationId: id }, orderBy: { createdAt: "asc" } }),
    prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: "asc" } }),
  ])
  const preferences: Record<string, string> = {}
  for (const p of prefs) preferences[p.field] = p.value
  const messagesData = messages.map((m) => ({ role: m.role, content: m.content }))
  const changeHistory = changes.map((c) => ({
    field: c.field,
    oldValue: c.oldValue,
    newValue: c.newValue,
    changeType: c.changeType,
    createdAt: c.createdAt.toISOString(),
  }))

  if (validFormat === "json") {
    const body = JSON.stringify(
      { preferences, changeHistory, messages: messagesData },
      null,
      2,
    )
    return new Response(body, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="conversation-${id.slice(-8)}.json"`,
      },
    })
  }

  let summary = ""
  let key_decisions: string[] = []
  let open_questions: string[] = []
  if (getOpenAIKey() && (Object.keys(preferences).length > 0 || messagesData.length > 0)) {
    try {
      const prefsStr = JSON.stringify(preferences, null, 0)
      const recent = messagesData
        .slice(-20)
        .map((m) => `${m.role}: ${(m.content ?? "").slice(0, 150)}`)
        .join("\n")
      const exportPrompt = `Preferences: ${prefsStr}\nRecent messages:\n${recent}\n\nRespond with JSON: "summary" (2-3 sentences), "key_decisions" (array of short strings), "open_questions" (1-3 questions). Output only JSON.`
      const { object } = await withFallback(
        () =>
          generateObject({
            model: openai(OPENAI_PRIMARY_MODEL),
            schema: zodSchema(ExportSummarySchema),
            prompt: exportPrompt,
            maxRetries: 2,
          }),
        () =>
          generateObject({
            model: openai(OPENAI_FALLBACK_MODEL),
            schema: zodSchema(ExportSummarySchema),
            prompt: exportPrompt,
            maxRetries: 1,
          })
      )
      summary = object.summary ?? ""
      key_decisions = object.key_decisions ?? []
      open_questions = object.open_questions ?? []
    } catch {
      // leave summary/decisions/questions empty
    }
  }

  const parts: string[] = ["# Project Export\n\n"]
  if (summary) {
    parts.push("## Summary\n\n")
    parts.push(summary + "\n\n")
  }
  if (key_decisions.length > 0) {
    parts.push("## Key decisions\n\n")
    for (const d of key_decisions) parts.push(`- ${d}\n`)
    parts.push("\n")
  }
  if (open_questions.length > 0) {
    parts.push("## Open questions\n\n")
    for (const q of open_questions) parts.push(`- ${q}\n`)
    parts.push("\n")
  }
  parts.push("## Preferences\n\n```json\n")
  parts.push(JSON.stringify(preferences, null, 2))
  parts.push("\n```\n\n")
  parts.push("## Preference change history\n\n")
  for (const c of changeHistory) {
    parts.push(`- **${c.field}**: ${c.oldValue ?? "(none)"} → ${c.newValue} (${c.changeType})\n`)
  }
  parts.push("\n## Conversation\n\n")
  for (const m of messagesData) {
    parts.push(`**${m.role}**: ${(m.content || "").replace(/\n/g, " ")}\n\n`)
  }
  const body = parts.join("")
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="conversation-${id.slice(-8)}.md"`,
    },
  })
}
