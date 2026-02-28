"use client"

import { useState } from "react"
import { Sparkles, ChevronRight, Link2, Lightbulb, Compass, ListChecks, Hash, Check, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const KEY_INSIGHTS = [
  "Modern minimalist style for 400 sq ft space",
  "South-facing windows - consider UV-resistant fabrics",
  "Low-profile sectional as main seating anchor",
  "Warm white and cream base with terracotta accents",
  "Natural materials: linen, oak, travertine, brass",
]

const TOPICS = [
  "Furniture Selection",
  "Color Palette",
  "Space Planning",
  "Materials",
]

const RECOMMENDATIONS = [
  { id: "rec-1", label: 'Select sectional dimensions around 95" x 85"' },
  { id: "rec-2", label: "Choose UV-resistant linen or bouclé" },
  { id: "rec-3", label: "Add sculptural accent chairs in rust" },
  { id: "rec-4", label: "Consider floating media console" },
]

const PREFERENCES = [
  {
    id: "minimalist",
    label: "Minimalist",
    type: "style",
    confidence: 92,
    status: "confirmed",
    connections: ["Clean lines", "Neutral palettes", "Functional furniture"],
    suggestions: [
      { text: "Japandi style — blends minimalist + warm wood", type: "explore" },
      { text: "Hidden storage solutions", type: "furniture" },
    ],
  },
  {
    id: "warm",
    label: "Warm Tones",
    type: "color",
    confidence: 72,
    status: "potential",
    connections: ["Terracotta", "Sand", "Cream"],
    suggestions: [
      { text: "Pair with natural wood furniture", type: "idea" },
      { text: "Warm LED lighting for evenings", type: "explore" },
    ],
  },
  {
    id: "sofa",
    label: "Sofa",
    type: "furniture",
    confidence: 96,
    status: "confirmed",
    connections: ["L-shape", "Boucle fabric", "Low-profile"],
    suggestions: [
      { text: "Modular sofa for layout flexibility", type: "furniture" },
      { text: "Boucle or linen for warmth", type: "explore" },
    ],
  },
  {
    id: "cozy",
    label: "Cozy",
    type: "vibe",
    confidence: 68,
    status: "inferred",
    connections: ["Soft textures", "Warm lighting", "Layered textiles"],
    suggestions: [
      { text: "Floor lamp with warm diffused light", type: "furniture" },
      { text: "Layer cushions in varied textures", type: "idea" },
    ],
  },
]

function StatusDot({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const colors: Record<string, string> = {
    confirmed: "bg-orange-500",
    potential: "bg-primary",
    inferred: "bg-violet-500",
  }
  const sizes = { sm: "w-2 h-2", md: "w-2.5 h-2.5" }
  return (
    <span
      className={cn(
        "rounded-full flex-shrink-0",
        colors[status] || "bg-border",
        sizes[size],
      )}
    />
  )
}

const EXPLORE_NEXT = [
  "Tell Eva about lighting preferences",
  "Mention materials you love",
  "Describe how you use the room day-to-day",
]

interface DiscoverViewProps {
  onSendToChat?: (text: string) => void
}

export function DiscoverView({ onSendToChat }: DiscoverViewProps) {
  const [expanded, setExpanded] = useState<string | null>("minimalist")
  const [checkedRecommendations, setCheckedRecommendations] = useState<Set<string>>(new Set())

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
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Key insights
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {KEY_INSIGHTS.map((insight, i) => (
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
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Topics
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {TOPICS.map((topic, i) => (
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
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Recommendations
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {RECOMMENDATIONS.map(({ id, label }) => {
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
        {PREFERENCES.map((pref) => {
          const t = typeStyles[pref.type]
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
                    {pref.confidence}% · {pref.connections.length} connections
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform shrink-0",
                    isExp && "rotate-90",
                  )}
                />
              </button>

              {isExp && (
                <div className="px-5 pb-5 flex flex-col gap-5 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Connected to
                      </span>
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

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Eva suggests
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {pref.suggestions.map((s, i) => {
                        const sx = suggestionStyles[s.type]
                        return (
                          <button
                            key={i}
                            type="button"
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
          {EXPLORE_NEXT.map((s, i) => (
            <button
              key={i}
              type="button"
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
