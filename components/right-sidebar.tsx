"use client"

import { IconButton } from "@/components/shared/icon-button"
import type { Assistant } from "@/lib/types"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RefreshCw, Lightbulb, Home, DollarSign, Star, ListChecks } from "lucide-react"

interface RightSidebarProps {
  onChangeAssistantClick?: () => void
  selectedAssistant?: Assistant
}

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
        "animate-in fade-in slide-in-from-right-2 duration-200 rounded border p-2.5 transition-all duration-200 hover:border-primary/40",
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
            className={cn("rounded-md px-2 py-1 text-[10px] font-bold bg-accent/15 text-primary hover:bg-accent/20 hover:text-primary transition-all duration-200", tabClass)}
          >
            {value.replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ) : (
          options.map((opt) => (
            <button
              key={opt}
              type="button"
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

const ROOM_OPTIONS = ["living room", "bedroom", "kitchen", "dining room", "bathroom", "home office"]
const BUDGET_OPTIONS = ["$1000", "$5000", "$10000+"]
const STYLE_OPTIONS = ["modern", "traditional", "minimalist", "scandinavian", "industrial", "bohemian"]
const COLOR_OPTIONS = ["blue", "green", "neutral", "warm tones", "cool tones"]
const FURNITURE_OPTIONS = ["sofa", "bed", "dining table", "coffee table", "lighting"]

export function RightSidebar({
  onChangeAssistantClick,
  selectedAssistant = { id: "eva", name: "Eva", tagline: "[the Assistant]" },
}: RightSidebarProps) {
  const [roomType, setRoomType] = useState<string | null>("kitchen")
  const [budget, setBudget] = useState<string | null>(null)
  const [designStyle, setDesignStyle] = useState<string | null>(null)
  const [colorPref, setColorPref] = useState<string | null>(null)
  const [furnitureNeeds, setFurnitureNeeds] = useState<string | null>(null)

  return (
    <aside className="shrink-0 flex flex-col bg-card border border-border h-full w-64">
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
        <IconButton icon={RefreshCw} title="Change AI assistant" onClick={onChangeAssistantClick} />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-3">
            {/* Brainstorm card */}
            <div className="animate-in fade-in slide-in-from-right-2 duration-200 rounded border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0" />
                <h4 className="text-[12px] font-medium text-muted-foreground">Brainstorm for me!!</h4>
              </div>
            </div>

            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-0.5 pb-0.5 pt-1">
              Preferences
            </p>
            <PreferenceCard
              title="Room Type"
              description="The type of room you're designing"
              icon={Home}
              isComplete={!!roomType}
              current={roomType}
              options={ROOM_OPTIONS}
              value={roomType}
              onChange={setRoomType}
              borderOnTabs
              useMutedBackground
            />
            <PreferenceCard
              title="Budget Range"
              description="Your budget for the project"
              icon={DollarSign}
              isComplete={!!budget}
              current={budget}
              options={BUDGET_OPTIONS}
              value={budget}
              onChange={setBudget}
              borderOnTabs
            />
            <PreferenceCard
              title="Design Style"
              description="Your preferred design aesthetic"
              icon={Lightbulb}
              isComplete={!!designStyle}
              current={designStyle}
              options={STYLE_OPTIONS}
              value={designStyle}
              onChange={setDesignStyle}
              borderOnTabs
            />
            <PreferenceCard
              title="Color Preferences"
              description="Colors you want to incorporate"
              icon={Star}
              isComplete={!!colorPref}
              current={colorPref}
              options={COLOR_OPTIONS}
              value={colorPref}
              onChange={setColorPref}
              borderOnTabs
            />
            <PreferenceCard
              title="Furniture Needs"
              description="Furniture items you need"
              icon={ListChecks}
              isComplete={!!furnitureNeeds}
              current={furnitureNeeds}
              options={FURNITURE_OPTIONS}
              value={furnitureNeeds}
              onChange={setFurnitureNeeds}
              borderOnTabs
            />
          </div>
        </div>
    </aside>
  )
}
