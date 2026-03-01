"use client"

import { IconButton } from "@/components/shared/icon-button"
import { useWorkspaceContext } from "@/lib/contexts/workspace-context"
import { useCurrentConversation } from "@/lib/contexts/current-conversation-context"
import { useCurrentPreferences } from "@/lib/contexts/current-preferences-context"
import { useState, useEffect, memo } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RefreshCw, Lightbulb, Home, DollarSign, Star, ListChecks, Download, X, Loader2 } from "lucide-react"
import type { DomainFieldConfig } from "@/lib/types"
import { toast } from "sonner"
import { apiGet, apiPost, apiPatch, apiDelete, API_ROUTES } from "@/lib/api"


function PreferenceCard({
  title,
  description,
  icon: Icon,
  isComplete,
  current,
  options,
  value,
  onChange,
  borderOnTabs,
  useMutedBackground,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  isComplete: boolean
  current: string | null
  options: string[]
  value: string | null
  onChange: (v: string | null) => void
  borderOnTabs?: boolean
  useMutedBackground?: boolean
}) {
  const tabClass = borderOnTabs ? "border border-border" : ""
  const bgClass = useMutedBackground ? "bg-muted/30" : "bg-card"
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-right-2 duration-200 rounded border p-2.5 transition-all hover:border-primary/40",
        isComplete ? `border-primary/40 ${bgClass}` : `border-border/50 ${bgClass}`,
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      </div>
      <p className="text-[10px] text-muted-foreground mb-2">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className={cn("rounded-md pl-2 pr-1 py-1 text-[10px] font-bold bg-accent/15 text-primary hover:bg-accent/20 hover:text-primary transition-all duration-200 inline-flex items-center gap-1", tabClass)}
            title="Remove preference"
          >
            {value.replace(/\b\w/g, (c) => c.toUpperCase())}
            <X className="h-3 w-3 shrink-0" />
          </button>
        ) : (
          options.map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => onChange(opt)}
              className={cn("rounded-md px-2 py-1 text-[10px] font-medium bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200", tabClass)}
            >
              {opt}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

const DEFAULT_ROOM_OPTIONS = ["living room", "bedroom", "kitchen", "dining room", "bathroom", "home office"]
const DEFAULT_BUDGET_OPTIONS = ["$1000", "$5000", "$10000+"]
const DEFAULT_STYLE_OPTIONS = ["modern", "traditional", "minimalist", "scandinavian", "industrial", "bohemian"]
const DEFAULT_COLOR_OPTIONS = ["blue", "green", "neutral", "warm tones", "cool tones"]
const DEFAULT_FURNITURE_OPTIONS = ["sofa", "bed", "dining table", "coffee table", "lighting"]

const KEY_TO_FIELD: Record<string, string> = {
  roomType: "roomType",
  designStyle: "style",
  budget: "budget",
  colorPref: "color",
  furnitureNeeds: "furniture",
}

interface RightSidebarProps {
  onSendToChat?: (text: string) => void
}

function optionsFromField(field: DomainFieldConfig | undefined, fallback: string[]): string[] {
  if (!field) return fallback
  const opts = field.suggestions ?? field.vocabulary ?? []
  return Array.isArray(opts) && opts.length > 0 ? opts : fallback
}

export const RightSidebar = memo(function RightSidebar({ onSendToChat }: RightSidebarProps = {}) {
  const { selectedAssistant, setShowAssistantPicker } = useWorkspaceContext()
  const { conversationId } = useCurrentConversation()
  const { preferences, setPreferences } = useCurrentPreferences()
  const [brainstormLoading, setBrainstormLoading] = useState(false)
  const [prefsLoading, setPrefsLoading] = useState(true)
  const [domainFields, setDomainFields] = useState<DomainFieldConfig[]>([])

  const roomType = preferences.roomType ?? null
  const budget = preferences.budget ?? null
  const designStyle = preferences.style ?? null
  const colorPref = preferences.color ?? null
  const furnitureNeeds = preferences.furniture ?? null

  useEffect(() => {
    apiGet<{ fields?: DomainFieldConfig[] }>(API_ROUTES.config)
      .then((config) => setDomainFields(config.fields ?? []))
      .catch(() => setDomainFields([]))
  }, [])

  const fieldsById = Object.fromEntries((domainFields ?? []).map((f) => [f.id, f]))
  const roomOptions = optionsFromField(fieldsById.roomType, DEFAULT_ROOM_OPTIONS)
  const budgetOptions = optionsFromField(fieldsById.budget, DEFAULT_BUDGET_OPTIONS)
  const styleOptions = optionsFromField(fieldsById.style, DEFAULT_STYLE_OPTIONS)
  const colorOptions = optionsFromField(fieldsById.color, DEFAULT_COLOR_OPTIONS)
  const furnitureOptions = optionsFromField(fieldsById.furniture, DEFAULT_FURNITURE_OPTIONS)

  useEffect(() => {
    if (!conversationId) {
      setPrefsLoading(false)
      setPreferences({})
      return
    }
    setPrefsLoading(true)
    apiGet<{ field: string; value: string }[]>(API_ROUTES.conversationPreferences(conversationId))
      .then((prefs) => {
        const map: Record<string, string> = {}
        prefs.forEach((p) => {
          map[p.field] = p.value
        })
        setPreferences(map)
      })
      .catch(() => toast.error("Failed to load preferences"))
      .finally(() => setPrefsLoading(false))
  }, [conversationId, setPreferences])

  const handlePreferenceChange = async (key: string, value: string | null) => {
    const field = KEY_TO_FIELD[key]
    const next = { ...preferences }
    if (value) {
      next[field] = value
      setPreferences(next)
      if (conversationId) {
        await apiPatch(API_ROUTES.conversationPreferences(conversationId), { field, value })
          .then(() => toast.success(`Preference updated: ${field}`))
          .catch(() => toast.error("Failed to update preference"))
      }
    } else {
      delete next[field]
      setPreferences(next)
      if (conversationId) {
        await apiDelete(API_ROUTES.conversationPreferences(conversationId), { field })
          .then(() => toast.success("Preference removed"))
          .catch(() => toast.error("Failed to update preference"))
      }
    }
  }

  return (
    <aside className="shrink-0 flex flex-col bg-card border border-border h-full w-64" aria-label="Preferences panel">
      <div className="flex items-center gap-2.5 px-4 py-4 bg-card border-b border-border">
        <Avatar className="h-8 w-8 bg-primary">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {selectedAssistant.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{selectedAssistant.name}</div>
          <div className="text-[10px] text-muted-foreground truncate">{selectedAssistant.tagline}</div>
        </div>
        <IconButton icon={RefreshCw} title="Change AI assistant" onClick={() => setShowAssistantPicker(true)} />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-3">
            {conversationId && prefsLoading && (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {conversationId && !prefsLoading && (
              <div className="text-[10px] text-muted-foreground px-0.5 pb-0.5">
                {[roomType, budget, designStyle, colorPref, furnitureNeeds].filter(Boolean).length} of 5 fields filled
              </div>
            )}
            {/* Brainstorm card */}
            <div className="animate-in fade-in slide-in-from-right-2 duration-200 rounded border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0" />
                <h4 className="text-xs font-medium text-muted-foreground">Brainstorm for me!!</h4>
              </div>
              <button
                type="button"
                disabled={!conversationId || brainstormLoading}
                onClick={async () => {
                  if (!conversationId || !onSendToChat) return
                  setBrainstormLoading(true)
                  try {
                    const data = await apiPost<{ summary?: string }>(API_ROUTES.brainstorm, { conversationId, preferences })
                    if (data.summary) {
                      onSendToChat(data.summary)
                      toast.info("Brainstorm ideas added to chat")
                    }
                  } catch {
                    toast.error("Brainstorm generation failed")
                  } finally {
                    setBrainstormLoading(false)
                  }
                }}
                className="w-full text-xs font-medium text-primary hover:bg-primary/10 rounded-md py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {brainstormLoading ? "Thinking…" : "Generate ideas"}
              </button>
            </div>

            {conversationId && (
              <div className="rounded border border-border bg-muted/30 p-3">
                <button
                  type="button"
                  onClick={() => {
                    fetch(API_ROUTES.conversationExport(conversationId, "markdown"))
                      .then((r) => r.blob())
                      .then((blob) => {
                        const a = document.createElement("a")
                        a.href = URL.createObjectURL(blob)
                        a.download = `conversation-${conversationId.slice(-8)}.md`
                        a.click()
                        URL.revokeObjectURL(a.href)
                      })
                      .catch(() => toast.error("Export failed"))
                  }}
                  className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
            )}

            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-0.5 pb-0.5 pt-1">
              Preferences
            </p>
            <PreferenceCard
              title="Room Type"
              description="The type of room you're designing"
              icon={Home}
              isComplete={!!roomType}
              current={roomType}
              options={roomOptions}
              value={roomType}
              onChange={(v) => handlePreferenceChange("roomType", v)}
              borderOnTabs
              useMutedBackground
            />
            <PreferenceCard
              title="Budget Range"
              description="Your budget for the project"
              icon={DollarSign}
              isComplete={!!budget}
              current={budget}
              options={budgetOptions}
              value={budget}
              onChange={(v) => handlePreferenceChange("budget", v)}
              borderOnTabs
            />
            <PreferenceCard
              title="Design Style"
              description="Your preferred design aesthetic"
              icon={Lightbulb}
              isComplete={!!designStyle}
              current={designStyle}
              options={styleOptions}
              value={designStyle}
              onChange={(v) => handlePreferenceChange("designStyle", v)}
              borderOnTabs
            />
            <PreferenceCard
              title="Color Preferences"
              description="Colors you want to incorporate"
              icon={Star}
              isComplete={!!colorPref}
              current={colorPref}
              options={colorOptions}
              value={colorPref}
              onChange={(v) => handlePreferenceChange("colorPref", v)}
              borderOnTabs
            />
            <PreferenceCard
              title="Furniture Needs"
              description="Furniture items you need"
              icon={ListChecks}
              isComplete={!!furnitureNeeds}
              current={furnitureNeeds}
              options={furnitureOptions}
              value={furnitureNeeds}
              onChange={(v) => handlePreferenceChange("furnitureNeeds", v)}
              borderOnTabs
            />
          </div>
        </div>
    </aside>
  )
});
