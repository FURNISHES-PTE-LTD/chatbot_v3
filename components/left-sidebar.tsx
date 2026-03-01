"use client"

import type React from "react"
import {
  Search,
  FolderOpen,
  MessageSquarePlus,
  CircleHelp,
  Sparkles,
  GitBranch,
  LayoutDashboard,
} from "lucide-react"
import { DEFAULT_RECENTS } from "@/lib/mock-data"
import { useAppContext } from "@/lib/contexts/app-context"
import { IconButton } from "@/components/shared/icon-button"
import { SectionLabel } from "@/components/shared/section-label"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

type NavItem = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  id: string
  expandable: boolean
  subItems?: { label: string; id: string }[]
}

const navigationCategories: { id: string; label: string; items: NavItem[] }[] = [
  {
    id: "discover",
    label: "DISCOVER",
    items: [
      { icon: MessageSquarePlus, label: "New Chat", id: "new-chat", expandable: false },
      { icon: Search, label: "Search", id: "search", expandable: false },
      { icon: LayoutDashboard, label: "Workspace", id: "workspace", expandable: false },
      { icon: FolderOpen, label: "Files", id: "files", expandable: false },
    ],
  },
  {
    id: "design",
    label: "DESIGN",
    items: [
      { icon: Sparkles, label: "Discover", id: "discover", expandable: false },
      { icon: GitBranch, label: "Playbook", id: "playbook", expandable: false },
    ],
  },
]

interface LeftSidebarProps {
  onHelpClick?: () => void
}

const WELCOME_TEXT = "Welcome back !"

export function LeftSidebar({ onHelpClick }: LeftSidebarProps) {
  const { activeItem, recents = DEFAULT_RECENTS, onItemClick } = useAppContext()
  const [typedLength, setTypedLength] = useState(0)

  useEffect(() => {
    if (typedLength >= WELCOME_TEXT.length) return
    const t = setTimeout(() => setTypedLength((n) => n + 1), 90)
    return () => clearTimeout(t)
  }, [typedLength])

  return (
    <>
      <aside className="hidden shrink-0 flex-col border border-border bg-card md:flex w-64 h-full">
        <div className="flex flex-col h-full overflow-hidden">
          <div
            data-tutorial="welcome"
            className="shrink-0 pt-3 pb-2 px-5 border-b border-border h-[60px] flex items-center"
          >
              <div className="flex w-full items-center">
                <div className="flex-1 min-w-0 font-medium text-[13px] leading-[1.3] text-foreground">
                  <span>{WELCOME_TEXT.slice(0, typedLength)}</span>
                  <span className="ml-0.5 inline-block w-[1ch] animate-cursor-blink text-orange-500" aria-hidden="true">
                    _
                  </span>
                </div>
                <IconButton icon={CircleHelp} title="Help & Tutorial" onClick={onHelpClick} />
              </div>
            </div>

          <nav data-tutorial="navigation" className="flex-1 flex flex-col gap-0 overflow-y-auto scrollbar-hide">
            <div className="space-y-1.5 pt-3">
                {navigationCategories.map((category) => (
                  <div key={category.id}>
                    <div className="px-5 pb-0.5">
                      <SectionLabel>{category.label}</SectionLabel>
                    </div>
                    <div className="space-y-0">
                      {category.items.map((item) => (
                        <div key={item.id}>
                          <button
                            type="button"
                            onClick={() => onItemClick(item.id, item.label)}
                            className={cn(
                              "group flex w-full items-center gap-2 rounded-none px-5 py-1 text-left text-xs font-medium cursor-pointer",
                              "transition-all duration-200",
                              activeItem === item.id || activeItem.startsWith(`${item.id}-`)
                                ? "bg-accent/15 text-primary"
                                : "text-foreground/80 hover:bg-accent/15 hover:text-foreground",
                            )}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1">{item.label}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Recents */}
                <div>
                  <div className="px-5 pb-0.5 pt-2">
                    <SectionLabel>RECENTS</SectionLabel>
                  </div>
                  <div className="space-y-0">
                    {recents.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onItemClick(item.id, item.label)}
                        className={cn(
                          "flex w-full items-center rounded-none px-5 py-1.5 text-left text-xs font-medium cursor-pointer",
                          "transition-all duration-200",
                          activeItem === item.id
                            ? "bg-accent/15 text-primary"
                            : "text-foreground/80 hover:bg-accent/15 hover:text-foreground",
                        )}
                      >
                        <span className="flex-1 truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
          </nav>
        </div>
      </aside>
    </>
  )
}
