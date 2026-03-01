/**
 * Export conversation as JSON or Markdown (preferences, change history, messages).
 * Ported from V2 export.py.
 */
import { prisma } from "@/lib/db"

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

  const parts: string[] = ["# Project Export\n\n"]
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
