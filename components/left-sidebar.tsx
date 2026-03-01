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
import { useAppContext } from "@/lib/contexts/app-context"
import { useChatContext } from "@/lib/contexts/chat-context"
import { toast } from "sonner"
import { apiDelete, API_ROUTES } from "@/lib/api"
import { IconButton } from "@/components/shared/icon-button"
import { SectionLabel } from "@/components/shared/section-label"
import { cn } from "@/lib/utils"
import { useState, useEffect, memo } from "react"
import { TypingText } from "@/components/shared/typing-text"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

export const LeftSidebar = memo(function LeftSidebar({ onHelpClick, isOverlay, onCloseMobileMenu }: LeftSidebarProps) {
  const { activeItem, recents = [], onItemClick, removeRecent } = useAppContext()
  const { removeConversationData } = useChatContext()
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)

  const handleItemClick = (id: string, label: string) => {
    onItemClick(id, label)
    onCloseMobileMenu?.()
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    const convoId = deleteTarget.id.startsWith("convo-") ? deleteTarget.id.replace(/^convo-/, "") : null
    if (convoId) {
      apiDelete(API_ROUTES.conversation(convoId))
        .then(() => {
          removeConversationData(deleteTarget.id)
          removeRecent(deleteTarget.id)
        })
        .catch(() => toast.error("Could not delete conversation"))
    } else {
      removeConversationData(deleteTarget.id)
      removeRecent(deleteTarget.id)
    }
    setDeleteTarget(null)
  }

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
                  <TypingText text={WELCOME_TEXT} speed={90} />
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
                            setDeleteTarget({ id: item.id, label: item.label })
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
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.label}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
});
