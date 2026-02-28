"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bookmark, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"

interface RightSidebarProps {
  onClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onChangeAssistantClick?: () => void
  selectedAssistant?: { id: string; name: string; tagline: string }
}

export function RightSidebar({
  onClose,
  isCollapsed,
  onToggleCollapse,
  onChangeAssistantClick,
  selectedAssistant = { id: "eva", name: "Eva", tagline: "[the Assistant]" },
}: RightSidebarProps) {
  const [activeView, setActiveView] = useState<"chat" | "summary">("summary")
  const [inputValue, setInputValue] = useState("")
  const [isBorderHovered, setIsBorderHovered] = useState(false)

  const handleSendMessage = () => {
    if (!inputValue.trim()) return
    setInputValue("")
  }

  return (
    <aside
      className={cn(
        "shrink-0 flex flex-col bg-card border border-border h-full relative transition-all duration-300 ease-in-out",
        isCollapsed ? "w-0 border-0 overflow-hidden" : "w-64",
      )}
    >
      <div
        onMouseEnter={() => setIsBorderHovered(true)}
        onMouseLeave={() => setIsBorderHovered(false)}
        className="absolute -left-2 top-0 bottom-0 w-4 z-10"
      />

      <button
        onClick={onToggleCollapse}
        className={cn(
          "absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background border border-border/60 flex items-center justify-center transition-all duration-200",
          isBorderHovered ? "opacity-100 scale-100" : "opacity-0 scale-90",
          "hover:border-primary/50 hover:bg-accent/10 cursor-pointer",
        )}
      >
        {isCollapsed ? (
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

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
        <button
          onClick={onChangeAssistantClick}
          className="flex items-center justify-center h-7 w-7 rounded hover:bg-accent/10 text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer shrink-0"
          title="Change AI assistant"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-4 border-b border-border bg-card px-4 py-2">
        <button
          onClick={() => setActiveView("summary")}
          className={cn(
            "relative text-xs font-medium transition-all duration-300",
            activeView === "summary" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Summary
          {activeView === "summary" && (
            <div className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-primary animate-in slide-in-from-left duration-200" />
          )}
        </button>
        <button
          onClick={() => setActiveView("chat")}
          className={cn(
            "relative text-xs font-medium transition-all duration-300",
            activeView === "chat" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Chat
          {activeView === "chat" && (
            <div className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-primary animate-in slide-in-from-left duration-200" />
          )}
        </button>
      </div>

      {activeView === "chat" && (
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-sm text-foreground">Good morning!</div>

            <div className="text-xs text-muted-foreground leading-relaxed">
              First step is complete. Control Center Configured! This will be the central hub for managing your
              Workflows...
            </div>

            <div className="text-xs text-foreground font-medium mt-3">Working on Workflows...</div>

            <div className="group relative rounded-sm border border-border bg-card p-3 transition-all duration-300 hover:border-primary/40 hover:shadow-sm">
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-4 w-4 rounded bg-muted flex items-center justify-center">
                    <div className="h-2 w-2 rounded bg-primary/60" />
                  </div>
                </div>
                <div className="flex-1 text-xs text-foreground leading-relaxed">
                  Management shift report that goes on the second line
                </div>
                <button className="flex-shrink-0 text-muted-foreground transition-colors duration-300 hover:text-primary">
                  <Bookmark className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs text-foreground">This looks good</div>
              <Avatar className="h-5 w-5 bg-accent">
                <AvatarFallback className="bg-accent text-accent-foreground text-[10px]">U</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="border-t border-border bg-card p-3">
            <div className="flex items-center gap-2 rounded-sm border border-border bg-background p-2 transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-sm">
              <Avatar className="h-5 w-5 bg-primary flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">E</AvatarFallback>
              </Avatar>
              <Input
                placeholder={`Ask ${selectedAssistant.name}`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="h-7 border-0 bg-transparent px-0 text-xs placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <button
                onClick={handleSendMessage}
                className="flex-shrink-0 rounded p-1.5 bg-primary text-primary-foreground transition-all duration-300 hover:bg-accent hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!inputValue.trim()}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground/60 text-center">
              The agents can sometimes make mistakes. Double-check responses.
            </p>
          </div>
        </div>
      )}

      {activeView === "summary" && (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-4">
            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Current Section
              </h4>
              <div className="rounded border border-border/50 bg-primary/5 p-2.5 transition-all duration-300 hover:border-primary/40">
                <p className="text-xs font-medium text-foreground">Dashboard</p>
                <p className="text-[10px] text-muted-foreground">Overview</p>
              </div>
            </div>

            <div className="animate-in fade-in slide-in-from-right-2 duration-300 delay-75">
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Active Filters
              </h4>
              <div className="space-y-1.5">
                {[
                  { label: "Date Range", value: "Last 7 days" },
                  { label: "Status", value: "All" },
                  { label: "Sort By", value: "Recent" },
                ].map((filter) => (
                  <div
                    key={filter.label}
                    className="flex items-center justify-between rounded border border-border/50 bg-primary/5 px-2.5 py-1.5 transition-all duration-300 hover:border-primary/40"
                  >
                    <span className="text-[10px] text-muted-foreground">{filter.label}</span>
                    <span className="text-xs text-foreground">{filter.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-in fade-in slide-in-from-right-2 duration-300 delay-150">
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Setup Progress
              </h4>
              <div className="rounded border border-border/50 bg-primary/5 p-2.5 transition-all duration-300 hover:border-primary/40">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Completed</span>
                  <span className="text-xs font-medium text-primary">3/5</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[60%] bg-primary transition-all duration-500" />
                </div>
              </div>
            </div>

            <div className="animate-in fade-in slide-in-from-right-2 duration-300 delay-200">
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Quick Stats
              </h4>
              <div className="space-y-1.5">
                {[
                  { label: "Revenue", value: "$45,231", color: "text-accent" },
                  { label: "Orders", value: "2,350", color: "text-primary" },
                  { label: "Customers", value: "1,234", color: "text-foreground" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between rounded border border-border/50 bg-primary/5 px-2.5 py-1.5 transition-all duration-300 hover:border-primary/40"
                  >
                    <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                    <span className={cn("text-xs font-medium", stat.color)}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
