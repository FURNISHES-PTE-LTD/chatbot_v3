"use client"

import React from "react"
import {
  Star,
  Share2,
  FolderOpen,
  MessageSquarePlus,
  Clock,
  LayoutDashboard,
  Sparkles,
  GitBranch,
  Home,
  Download,
  List,
  Package,
} from "lucide-react"
import { useAppContext } from "@/lib/contexts/app-context"
import { useWorkspaceContext } from "@/lib/contexts/workspace-context"
import { useCurrentConversation } from "@/lib/contexts/current-conversation-context"
import type { Workspace } from "@/lib/types"
import { cn } from "@/lib/utils"
import { API_ROUTES } from "@/lib/api"
import { FilesView } from "./files-view"
import { DiscoverView } from "./discover-view"
import { PlaybookView } from "./playbook-view"
import { SettingsView } from "./views/settings-view"
import { HistoryView } from "./views/history-view"
import { ChatView } from "./views/chat-view"
import { WorkspaceView } from "./views/workspace-view"
import { AssistantPickerView } from "./views/assistant-picker"
import { useState, useEffect } from "react"

interface MainContentProps {
  workspaceListKey?: number
  onEditInChatFromFiles?: (title: string) => void
  onSendToChatFromDiscover?: (text: string) => void
}

export function MainContent({
  workspaceListKey = 0,
  onEditInChatFromFiles,
  onSendToChatFromDiscover,
}: MainContentProps) {
  const { activeItem, recents = [], onItemClick } = useAppContext()
  const { conversationId } = useCurrentConversation()
  const {
    currentWorkspace,
    currentProject,
    showAssistantPicker,
    selectWorkspaceProject,
    clearWorkspaceProject,
  } = useWorkspaceContext()
  const [isSaved, setIsSaved] = useState(false)
  const [selectedWorkspaceForView, setSelectedWorkspaceForView] = useState<Workspace | null>(null)

  useEffect(() => {
    setSelectedWorkspaceForView(null)
  }, [workspaceListKey])

  const isChatView = activeItem === "new-chat" || activeItem.startsWith("recent-") || activeItem.startsWith("convo-")

  const getActiveIcon = () => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      "new-chat": MessageSquarePlus,
      files: FolderOpen,
      discover: Sparkles,
      playbook: GitBranch,
      workspace: LayoutDashboard,
      project: Home,
      settings: Star,
      recommendations: Sparkles,
      export: Download,
      history: List,
    }
    const IconComponent =
      currentWorkspace && currentProject
        ? LayoutDashboard
        : activeItem.startsWith("recent-") || activeItem.startsWith("convo-")
          ? Clock
          : iconMap[activeItem] || Package
    return <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
  }

  const getBreadcrumbText = () => {
    if (currentWorkspace && currentProject) {
      return `${currentWorkspace.name} / ${currentProject.name}`
    }
    if ((activeItem.startsWith("recent-") || activeItem.startsWith("convo-")) && recents.length > 0) {
      const found = recents.find((r) => r.id === activeItem)
      if (found) return found.label
    }
    if (activeItem === "new-chat") return "+ New Chat"
    if (activeItem === "workspace") return "Workspace"
    if (activeItem === "playbook") return "Playbook"
    if (activeItem === "recommendations") return "Recommendations"
    if (activeItem === "export") return "Export"
    if (activeItem === "history") return "History"
    return activeItem
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const renderContent = () => {
    if (isChatView) {
      return (
        <ChatView
          title={getBreadcrumbText()}
          currentWorkspace={currentWorkspace}
          currentProject={currentProject}
        />
      )
    }

    if (activeItem === "workspace") {
      return (
        <WorkspaceView
          selectedWorkspaceForView={selectedWorkspaceForView}
          onSelectWorkspaceForView={setSelectedWorkspaceForView}
          currentWorkspace={currentWorkspace}
          currentProject={currentProject}
          onSelectWorkspaceProject={selectWorkspaceProject}
          onClearWorkspaceProject={clearWorkspaceProject}
        />
      )
    }

    if (activeItem === "files") return <FilesView onEditInChat={onEditInChatFromFiles} />
    if (activeItem === "discover" || activeItem === "recommendations") return <DiscoverView onSendToChat={onSendToChatFromDiscover} />
    if (activeItem === "playbook") {
      return (
        <div className="flex flex-col h-full min-h-0 -m-6">
          <PlaybookView />
        </div>
      )
    }
    if (activeItem === "export") {
      return (
        <div className="p-6">
          <h1 className="text-base font-semibold text-foreground mb-2">Export</h1>
          <p className="text-sm text-muted-foreground mb-4">Export your current conversation as Markdown or JSON.</p>
          {conversationId ? (
            <div className="flex gap-2">
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
                    .catch(() => {})
                }}
                className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted"
              >
                Download as Markdown
              </button>
              <button
                type="button"
                onClick={() => {
                  fetch(API_ROUTES.conversationExport(conversationId))
                    .then((r) => r.json())
                    .then((data) => {
                      const a = document.createElement("a")
                      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }))
                      a.download = `conversation-${conversationId.slice(-8)}.json`
                      a.click()
                      URL.revokeObjectURL(a.href)
                    })
                    .catch(() => {})
                }}
                className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted"
              >
                Download as JSON
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Start a conversation to export it.</p>
          )}
        </div>
      )
    }
    if (activeItem === "history") {
      return <HistoryView onItemClick={onItemClick} />
    }

    switch (activeItem) {
      case "project":
        return (
          <div>
            <h1 className="text-base font-semibold text-foreground">Project</h1>
            <p className="mb-4 text-xs text-muted-foreground">Manage your design projects</p>
            <div className="rounded border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Your workspace for managing multiple design projects</p>
            </div>
          </div>
        )
      case "settings":
        return <SettingsView />
      default:
        return (
          <div>
            <h1 className="text-base font-semibold text-foreground">Saved Plans</h1>
            <p className="text-xs text-muted-foreground">Select a section to get started</p>
          </div>
        )
    }
  }

  return (
    <div data-tutorial="main-content" className="h-full overflow-hidden flex flex-col">
        {showAssistantPicker ? (
          <AssistantPickerView />
        ) : (
          <>
            <div className="flex h-10 items-center justify-between px-3 border-b border-border">
              <div className="flex items-center gap-2">
                {activeItem === "workspace" && !selectedWorkspaceForView ? (
                  <>
                    {getActiveIcon()}
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-xs font-medium text-foreground border-b-2 border-primary pb-0.5">
                      Workspace
                    </span>
                  </>
                ) : currentWorkspace && currentProject ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkspaceForView(null)
                        onItemClick?.("workspace", "Workspace")
                      }}
                      className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                      title="All workspaces"
                    >
                      {getActiveIcon()}
                    </button>
                    <span className="text-xs text-muted-foreground">/</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkspaceForView(null)
                        onItemClick?.("workspace", "Workspace")
                      }}
                      className="text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                      title="Workspace"
                    >
                      Workspace
                    </button>
                    <span className="text-xs text-muted-foreground">/</span>
                    <button
                      type="button"
                      onClick={() => setSelectedWorkspaceForView(currentWorkspace)}
                      className="text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                      title={`${currentWorkspace.name} projects`}
                    >
                      {currentWorkspace.name}
                    </button>
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-xs font-medium text-foreground border-b-2 border-primary pb-0.5">
                      {currentProject.name}
                    </span>
                  </>
                ) : activeItem === "workspace" && selectedWorkspaceForView ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkspaceForView(null)
                        onItemClick?.("workspace", "Workspace")
                      }}
                      className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                      title="All workspaces"
                    >
                      {getActiveIcon()}
                    </button>
                    <span className="text-xs text-muted-foreground">/</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkspaceForView(null)
                        onItemClick?.("workspace", "Workspace")
                      }}
                      className="text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                      title="Workspace"
                    >
                      Workspace
                    </button>
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-xs font-medium text-foreground border-b-2 border-primary pb-0.5">
                      {selectedWorkspaceForView.name}
                    </span>
                  </>
                ) : (
                  <>
                    {getActiveIcon()}
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-xs font-medium text-foreground capitalize border-b-2 border-primary pb-0.5">
                      {getBreadcrumbText()}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaved(!isSaved)}
                  className="flex items-center justify-center h-7 w-7 rounded hover:bg-accent/10 text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
                  title={isSaved ? "Unsave" : "Save"}
                >
                  <Star className={cn("h-3.5 w-3.5", isSaved && "fill-current text-primary")} />
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center h-7 w-7 rounded hover:bg-accent/10 text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
                  title="Share"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <main role="main" className="flex-1 overflow-y-auto bg-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {renderContent()}
            </main>
          </>
        )}
      </div>
  )
}
