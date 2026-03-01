"use client"

import { useState, useEffect } from "react"
import { Sparkles, ChevronRight, Link2, Lightbulb, Compass, ListChecks, Hash, Check, MessageCircle } from "lucide-react"
import { SectionLabel } from "@/components/shared/section-label"
import { KEY_INSIGHTS, TOPICS, RECOMMENDATIONS, PREFERENCES, EXPLORE_NEXT } from "@/lib/mock-data"
import { PREFERENCE_STATUS } from "@/lib/theme-colors"
import { useCurrentConversation } from "@/lib/contexts/current-conversation-context"
import { cn } from "@/lib/utils"
import { apiGet, API_ROUTES } from "@/lib/api"

interface InsightsData {
  keyInsights: string[]
  topics: string[]
  recommendations: string[]
  exploreNext: string[]
}

function StatusDot({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const colors: Record<string, string> = {
    confirmed: PREFERENCE_STATUS.confirmed,
    potential: PREFERENCE_STATUS.potential,
    inferred: PREFERENCE_STATUS.inferred,
  }
  const sizes = { sm: "w-2 h-2", md: "w-2.5 h-2.5" }
  return (
    <span
      className={cn(
        "rounded-full flex-shrink-0",
        colors[status] || "bg-border",
        sizes[size],
      )}
    >
      <span className="sr-only">{status}</span>
    </span>
  )
}

interface DiscoverViewProps {
  onSendToChat?: (text: string) => void
}

export function DiscoverView({ onSendToChat }: DiscoverViewProps) {
  const { conversationId } = useCurrentConversation()
  const [configFields, setConfigFields] = useState<{ id: string; label: string }[]>([])
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [prefs, setPrefs] = useState<{ field: string; value: string; confidence: number; status: string }[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [checkedRecommendations, setCheckedRecommendations] = useState<Set<string>>(new Set())

  useEffect(() => {
    apiGet<{ fields?: { id: string; label: string }[] }>(API_ROUTES.config)
      .then((config) => setConfigFields(config.fields ?? []))
      .catch(() => setConfigFields([]))
  }, [])

  useEffect(() => {
    if (!conversationId) {
      setInsights(null)
      setPrefs([])
      return
    }
    Promise.all([
      apiGet<InsightsData>(API_ROUTES.conversationInsights(conversationId)),
      apiGet<{ field: string; value: string; confidence: number; status: string }[]>(API_ROUTES.conversationPreferences(conversationId)),
    ]).then(([ins, prefsList]) => {
      setInsights(ins)
      setPrefs(prefsList)
    }).catch(() => {})
  }, [conversationId])

  const getFieldLabel = (fieldId: string) =>
    configFields.find((f) => f.id === fieldId)?.label ?? fieldId

  const toggleRecommendation = (id: string) => {
    setCheckedRecommendations((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const typeStyles: Record<
    string,
    { color: string; bg: string; border: string }
  > = {
    style: { color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
    color: { color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" },
    furniture: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    vibe: { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  }

  const suggestionStyles: Record<
    string,
    { color: string; bg: string; label: string }
  > = {
    explore: { color: "text-violet-600", bg: "bg-violet-50", label: "Explore" },
    idea: { color: "text-primary", bg: "bg-primary/10", label: "Idea" },
    furniture: { color: "text-blue-600", bg: "bg-blue-50", label: "Furniture" },
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Summary card: KEY INSIGHTS, TOPICS, RECOMMENDATIONS */}
      <div className="rounded-xl border border-border bg-card p-5 mb-5 flex flex-col gap-5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-3.5 h-3.5 text-primary" />
            <SectionLabel>
              Key insights
            </SectionLabel>
          </div>
          <ul className="flex flex-col gap-2">
            {(insights?.keyInsights?.length ? insights.keyInsights : KEY_INSIGHTS).map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="rounded-full bg-primary w-1.5 h-1.5 flex-shrink-0 mt-1.5" />
                <span className="leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-3.5 h-3.5 text-muted-foreground" />
            <SectionLabel>
              Topics
            </SectionLabel>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(insights?.topics?.length ? insights.topics : TOPICS).map((topic, i) => (
              <span
                key={i}
                className="text-xs font-medium px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-3.5 h-3.5 text-primary" />
            <SectionLabel>
              Recommendations
            </SectionLabel>
          </div>
          <ul className="flex flex-col gap-2">
            {(insights?.recommendations?.length ? insights.recommendations.map((label, i) => ({ id: `rec-${i}`, label })) : RECOMMENDATIONS).map(({ id, label }) => {
              const checked = checkedRecommendations.has(id)
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 group"
                >
                  <button
                    type="button"
                    onClick={() => toggleRecommendation(id)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                        checked
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/40 group-hover:border-primary/50",
                      )}
                    >
                      {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                    </span>
                    <span className="text-sm text-foreground leading-relaxed">{label}</span>
                  </button>
                  {onSendToChat && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSendToChat(label)
                      }}
                      className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 flex-shrink-0"
                      title="Discuss in chat"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="pb-5 border-b border-border mb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-base font-semibold text-foreground">
            What Eva learned about you
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Based on your conversation — and ideas to explore further.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {(prefs.length ? prefs.map((p) => ({ id: p.field, label: getFieldLabel(p.field), type: p.field, confidence: p.confidence, status: p.status, connections: [] as string[], suggestions: [] as { text: string; type: string }[] })) : PREFERENCES).map((pref) => {
          const t = typeStyles[pref.type] ?? typeStyles.style
          const isExp = expanded === pref.id
          return (
            <div
              key={pref.id}
              className={cn(
                "rounded-xl border bg-card overflow-hidden transition-all",
                isExp ? t.border : "border-border",
              )}
            >
              <button
                type="button"
                onClick={() => setExpanded(isExp ? null : pref.id)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0",
                    t.bg,
                    t.color,
                  )}
                >
                  {pref.label[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {pref.label}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] font-semibold px-2 py-0.5 rounded-md uppercase",
                        t.bg,
                        t.color,
                      )}
                    >
                      {pref.type}
                    </span>
                    <StatusDot status={pref.status} />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {Math.round((pref.confidence ?? 0) * 100)}% · {(pref.connections?.length ?? 0)} connections
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform shrink-0",
                    isExp && "rotate-90",
                  )}
                />
              </button>

              {isExp && pref.suggestions?.length > 0 && (
                <div className="px-5 pb-5 flex flex-col gap-5 animate-in slide-in-from-top-2 duration-200">
                  {pref.connections?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <SectionLabel>
                          Connected to
                        </SectionLabel>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {pref.connections.map((c, i) => (
                          <span
                            key={i}
                            className="text-xs font-medium px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-3.5 h-3.5 text-primary" />
                      <SectionLabel>
                        Eva suggests
                      </SectionLabel>
                    </div>
                    <div className="flex flex-col gap-2">
                      {pref.suggestions.map((s, i) => {
                        const sx = suggestionStyles[s.type] ?? suggestionStyles.idea
                        return (
                          <button
                            type="button"
                            key={i}
                            onClick={() => onSendToChat?.(s.text)}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all text-left w-full"
                          >
                            <div className="flex-1 text-xs text-foreground leading-relaxed">
                              {s.text}
                            </div>
                            <span
                              className={cn(
                                "text-[9px] font-semibold px-2 py-0.5 rounded-md shrink-0",
                                sx.bg,
                                sx.color,
                              )}
                            >
                              {sx.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <div className="p-5 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary">
              What to explore next
            </span>
          </div>
          {(insights?.exploreNext?.length ? insights.exploreNext : EXPLORE_NEXT).map((s, i) => (
            <button
              type="button"
              key={i}
              onClick={() => onSendToChat?.(s)}
              className="flex items-center gap-2 text-xs text-primary mt-2 hover:underline w-full text-left cursor-pointer"
            >
              <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
