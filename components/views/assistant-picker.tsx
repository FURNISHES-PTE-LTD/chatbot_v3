"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import type { Assistant } from "@/lib/types"
import { useWorkspaceContext } from "@/lib/contexts/workspace-context"
import { SectionLabel } from "@/components/shared/section-label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type AssistantStyleFocus = "creative" | "minimal" | "practical"

interface AssistantOption {
  id: string
  name: string
  tagline: string
  description: string
  traits: string[]
  tone: string
  styleFocus: AssistantStyleFocus
}

const MOCK_ASSISTANTS: AssistantOption[] = [
  { id: "eva", name: "Eva", tagline: "[the Assistant]", description: "Warm and methodical. Great at breaking down design decisions and keeping your project on track.", traits: ["Organized", "Detail-oriented", "Encouraging"], tone: "Friendly and professional", styleFocus: "practical" },
  { id: "alex", name: "Alex", tagline: "[the Minimalist]", description: "Clean lines, fewer choices. Focuses on simplicity and intentional design without the fluff.", traits: ["Direct", "Minimal", "Technical"], tone: "Calm and concise", styleFocus: "minimal" },
  { id: "sam", name: "Sam", tagline: "[the Creative]", description: "Bold ideas and unexpected combinations. Pushes you to try new styles and take design risks.", traits: ["Creative", "Bold", "Experimental"], tone: "Playful and inspiring", styleFocus: "creative" },
  { id: "maya", name: "Maya", tagline: "[the Consultant]", description: "Budget and timeline first. Helps you prioritize and get the most value from your space.", traits: ["Pragmatic", "Budget-savvy", "Strategic"], tone: "Confident and practical", styleFocus: "practical" },
  { id: "rio", name: "Rio", tagline: "[the Curator]", description: "Deep knowledge of trends and brands. Surfaces the right pieces and stories for your taste.", traits: ["Knowledgeable", "Trend-aware", "Storyteller"], tone: "Warm and informative", styleFocus: "practical" },
]

const ASSISTANT_STYLE_OPTIONS: { value: AssistantStyleFocus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "creative", label: "Creative" },
  { value: "minimal", label: "Minimal" },
  { value: "practical", label: "Practical" },
]

const ALL_TRAITS = Array.from(new Set(MOCK_ASSISTANTS.flatMap((a) => a.traits))).sort()

export function AssistantPickerView() {
  const { selectedAssistant, setSelectedAssistant, setShowAssistantPicker } = useWorkspaceContext()
  const [styleFilter, setStyleFilter] = useState<AssistantStyleFocus | "">("")
  const [traits, setTraits] = useState<string[]>([])

  const filteredAssistants = MOCK_ASSISTANTS.filter((a) => {
    if (styleFilter && a.styleFocus !== styleFilter) return false
    if (traits.length > 0) {
      const hasTrait = traits.some((t) => a.traits.includes(t))
      if (!hasTrait) return false
    }
    return true
  })

  const toggleTrait = (trait: string) => {
    setTraits((prev) => (prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-10 items-center px-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs font-medium text-foreground border-b-2 border-primary pb-0.5">
            Choose AI Assistant
          </span>
        </div>
      </div>
      <main role="main" className="flex-1 overflow-y-auto bg-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <p className="text-sm text-muted-foreground mb-4 max-w-xl">
          Each assistant has a different style and focus. Use the filters below to narrow your choice—more creative,
          more minimal, or more practical.
        </p>

        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel>Style</SectionLabel>
            {ASSISTANT_STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value || "all"}
                type="button"
                onClick={() => setStyleFilter(opt.value as AssistantStyleFocus | "")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer",
                  (opt.value === "" && !styleFilter) || styleFilter === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel>Traits</SectionLabel>
            {ALL_TRAITS.map((trait) => (
              <button
                key={trait}
                type="button"
                onClick={() => toggleTrait(trait)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 cursor-pointer",
                  traits.includes(trait)
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent",
                )}
              >
                {trait}
              </button>
            ))}
          </div>
          {(styleFilter || traits.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setStyleFilter("")
                setTraits([])
              }}
              className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAssistants.length === 0 ? (
            <p className="col-span-full text-sm text-muted-foreground py-8 text-center">
              No assistants match the current filters. Try clearing some filters.
            </p>
          ) : (
            filteredAssistants.map((assistant) => (
              <button
                key={assistant.id}
                type="button"
                onClick={() => {
                setSelectedAssistant({ id: assistant.id, name: assistant.name, tagline: assistant.tagline })
                setShowAssistantPicker(false)
              }}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-lg border bg-card p-4 text-left transition-all duration-200 cursor-pointer",
                  selectedAssistant?.id === assistant.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-primary/5",
                )}
              >
                <div className="flex w-full items-center gap-3">
                  <Avatar className="h-10 w-10 bg-primary shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {assistant.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{assistant.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{assistant.tagline}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{assistant.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {assistant.traits.map((trait) => (
                    <span
                      key={trait}
                      className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/80"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/80 italic">Tone: {assistant.tone}</p>
              </button>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
