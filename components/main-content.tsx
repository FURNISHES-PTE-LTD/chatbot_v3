"use client"

import React from "react"
import {
  Star,
  Share2,
  Search,
  Package,
  FolderOpen,
  MessageSquarePlus,
  ShoppingCart,
  Clock,
  TrendingUp,
  LayoutDashboard,
  Sparkles,
  GitBranch,
  Home,
} from "lucide-react"
import { useAppContext } from "@/lib/contexts/app-context"
import { useWorkspaceContext } from "@/lib/contexts/workspace-context"
import { ChatProvider } from "@/lib/contexts/chat-context"
import type { Workspace } from "@/lib/types"
import { cn } from "@/lib/utils"
import { FilesView } from "./files-view"
import { DiscoverView } from "./discover-view"
import { PlaybookView } from "./playbook-view"
import { SearchView } from "./views/search-view"
import { CartView } from "./views/cart-view"
import { CommunityView } from "./views/community-view"
import { CustomizeView } from "./views/customize-view"
import { SettingsView } from "./views/settings-view"
import { ChatView } from "./views/chat-view"
import { WorkspaceView } from "./views/workspace-view"
import { AssistantPickerView } from "./views/assistant-picker"
import { useState, useEffect } from "react"

interface MainContentProps {
  workspaceListKey?: number
  pendingChatMessage?: string | null
  onClearPendingChatMessage?: () => void
  onEditInChatFromFiles?: (title: string) => void
  onSendToChatFromDiscover?: (text: string) => void
}

export function MainContent({
  workspaceListKey = 0,
  pendingChatMessage = null,
  onClearPendingChatMessage,
  onEditInChatFromFiles,
  onSendToChatFromDiscover,
}: MainContentProps) {
  const { activeItem, recents = [], onItemClick } = useAppContext()
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

  const isChatView = activeItem === "new-chat" || activeItem.startsWith("recent-")

  const getActiveIcon = () => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      "new-chat": MessageSquarePlus,
      search: Search,
      files: FolderOpen,
      discover: Sparkles,
      playbook: GitBranch,
      workspace: LayoutDashboard,
      cart: ShoppingCart,
      project: Home,
      community: TrendingUp,
      customize: Package,
      settings: Star,
    }
    const IconComponent =
      currentWorkspace && currentProject
        ? LayoutDashboard
        : activeItem.startsWith("recent-")
          ? Clock
          : iconMap[activeItem] || Package
    return <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
  }

  const getBreadcrumbText = () => {
    if (currentWorkspace && currentProject) {
      return `${currentWorkspace.name} / ${currentProject.name}`
    }
    if (activeItem.startsWith("recent-") && recents.length > 0) {
      const found = recents.find((r) => r.id === activeItem)
      if (found) return found.label
    }
    if (activeItem === "new-chat") return "+ New Chat"
    if (activeItem === "workspace") return "Workspace"
    if (activeItem === "playbook") return "Playbook"
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

    if (activeItem === "search") return <SearchView />
    if (activeItem === "files") return <FilesView onEditInChat={onEditInChatFromFiles} />
    if (activeItem === "discover") return <DiscoverView onSendToChat={onSendToChatFromDiscover} />
    if (activeItem === "playbook") {
      return (
        <div className="flex flex-col h-full min-h-0 -m-6">
          <PlaybookView />
        </div>
      )
    }
    if (activeItem === "cart") return <CartView />

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
      case "community":
        return <CommunityView />
      case "customize":
        return <CustomizeView />
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
    <ChatProvider
      pendingMessage={pendingChatMessage}
      onClearPendingMessage={onClearPendingChatMessage}
    >
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
    </ChatProvider>
  )
}
