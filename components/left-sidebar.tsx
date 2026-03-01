"use client"

import type React from "react"
import {
  FolderOpen,
  MessageSquarePlus,
  CircleHelp,
  Sparkles,
  GitBranch,
  LayoutDashboard,
  Trash2,
  ListChecks,
  Download,
  List,
} from "lucide-react"
import { DEFAULT_RECENTS } from "@/lib/mock-data"
import { useAppContext } from "@/lib/contexts/app-context"
import { toast } from "sonner"
import { apiDelete, API_ROUTES } from "@/lib/api"
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
      { icon: LayoutDashboard, label: "Workspace", id: "workspace", expandable: false },
      { icon: FolderOpen, label: "Files", id: "files", expandable: false },
    ],
  },
  {
    id: "design",
    label: "DESIGN",
    items: [
      { icon: Sparkles, label: "Discover", id: "discover", expandable: false },
      { icon: ListChecks, label: "Recommendations", id: "recommendations", expandable: false },
      { icon: GitBranch, label: "Playbook", id: "playbook", expandable: false },
      { icon: Download, label: "Export", id: "export", expandable: false },
      { icon: List, label: "History", id: "history", expandable: false },
    ],
  },
]

interface LeftSidebarProps {
  onHelpClick?: () => void
  /** When true, sidebar is shown as overlay (no hidden on mobile). */
  isOverlay?: boolean
  /** Callback when user selects a nav item (e.g. close mobile overlay). */
  onCloseMobileMenu?: () => void
}

const WELCOME_TEXT = "Welcome back !"

export function LeftSidebar({ onHelpClick, isOverlay, onCloseMobileMenu }: LeftSidebarProps) {
  const { activeItem, recents = DEFAULT_RECENTS, onItemClick, removeRecent } = useAppContext()
  const [typedLength, setTypedLength] = useState(0)

  const handleItemClick = (id: string, label: string) => {
    onItemClick(id, label)
    onCloseMobileMenu?.()
  }

  useEffect(() => {
    if (typedLength >= WELCOME_TEXT.length) return
    const t = setTimeout(() => setTypedLength((n) => n + 1), 90)
    return () => clearTimeout(t)
  }, [typedLength])

  return (
    <>
      <aside className={cn("shrink-0 flex-col border border-border bg-card w-64 h-full", isOverlay ? "flex" : "hidden md:flex")} aria-label="Main navigation">
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
                            onClick={() => handleItemClick(item.id, item.label)}
                            className={cn(
                              "group flex w-full items-center gap-2 rounded-none px-5 py-1 text-left text-xs font-medium cursor-pointer",
                              "transition-all duration-200",
                              activeItem === item.id || activeItem.startsWith(`${item.id}-`)
                                ? "bg-accent/15 text-primary"
                                : "text-foreground/80 hover:bg-accent/15 hover:text-foreground",
                            )}
                            aria-current={activeItem === item.id || activeItem.startsWith(`${item.id}-`) ? "page" : undefined}
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
                      <div
                        key={item.id}
                        className={cn(
                          "group flex w-full items-center gap-1 rounded-none px-5 py-1.5 text-left text-xs font-medium cursor-pointer",
                          "transition-all duration-200",
                          activeItem === item.id
                            ? "bg-accent/15 text-primary"
                            : "text-foreground/80 hover:bg-accent/15 hover:text-foreground",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => handleItemClick(item.id, item.label)}
                          className="flex-1 min-w-0 truncate text-left"
                          aria-current={activeItem === item.id ? "page" : undefined}
                        >
                          {item.label}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!window.confirm("Are you sure you want to delete this conversation?")) return
                            const convoId = item.id.startsWith("convo-") ? item.id.replace(/^convo-/, "") : null
                            if (convoId) {
                              apiDelete(API_ROUTES.conversation(convoId))
                                .then(() => removeRecent(item.id))
                                .catch(() => toast.error("Could not delete conversation"))
                            } else {
                              removeRecent(item.id)
                            }
                          }}
                          className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete conversation"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
