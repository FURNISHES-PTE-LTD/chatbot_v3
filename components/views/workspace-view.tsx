"use client"

import { ChevronLeft, LayoutDashboard } from "lucide-react"
import { MOCK_WORKSPACES, MOCK_PROJECTS_BY_WORKSPACE } from "@/lib/mock-data"
import type { Workspace, Project } from "@/lib/types"
import { useChatContext } from "@/lib/contexts/chat-context"
import { cn } from "@/lib/utils"
import { ChatAvatar } from "@/components/chat/chat-avatar"
import { ChatBubble } from "@/components/chat/chat-bubble"

interface WorkspaceViewProps {
  selectedWorkspaceForView: Workspace | null
  onSelectWorkspaceForView: (workspace: Workspace | null) => void
  currentWorkspace: Workspace | null
  currentProject: Project | null
  onSelectWorkspaceProject?: (workspace: Workspace, project: Project) => void
  onClearWorkspaceProject?: () => void
}

export function WorkspaceView({
  selectedWorkspaceForView,
  onSelectWorkspaceForView,
  currentWorkspace,
  currentProject,
  onSelectWorkspaceProject,
  onClearWorkspaceProject,
}: WorkspaceViewProps) {
  const { messagesByKey } = useChatContext()

  if (!selectedWorkspaceForView) {
    return (
      <div>
        <h1 className="text-base font-semibold text-foreground mb-4">Workspace</h1>
        <p className="text-xs text-muted-foreground mb-4">Choose a workspace to view its projects. The selected workspace and project are shown in the bar above.</p>
        <div className="space-y-2">
          {MOCK_WORKSPACES.map((workspace: Workspace) => (
            <button
              key={workspace.id}
              type="button"
              onClick={() => {
                onClearWorkspaceProject?.()
                onSelectWorkspaceForView(workspace)
              }}
              className="w-full flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-all duration-200 cursor-pointer hover:border-primary/50 hover:bg-primary/5"
            >
              <LayoutDashboard className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground">{workspace.name}</span>
              <ChevronLeft className="h-4 w-4 ml-auto rotate-180 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  const projects = MOCK_PROJECTS_BY_WORKSPACE[selectedWorkspaceForView.id] ?? []
  const projectChatKey =
    currentWorkspace?.id === selectedWorkspaceForView.id && currentProject
      ? `${selectedWorkspaceForView.id}-${currentProject.id}`
      : null
  const projectChatMessages = projectChatKey ? (messagesByKey[projectChatKey] || []) : []
  const hasProjectSelected = Boolean(currentProject && currentWorkspace?.id === selectedWorkspaceForView.id)

  if (hasProjectSelected) {
    return (
      <div>
        <button
          type="button"
          onClick={() => onClearWorkspaceProject?.()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to projects
        </button>
        <h2 className="text-sm font-semibold text-foreground mb-3">Chat history — {currentProject!.name}</h2>
        {projectChatMessages.length === 0 ? (
          <p className="text-xs text-muted-foreground">No messages yet. Open + New Chat to start a conversation in this project.</p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-card p-3">
            {projectChatMessages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "")}>
                <ChatAvatar role={msg.role === "user" ? "user" : "assistant"} initial={msg.role === "user" ? "Y" : "E"} size="sm" />
                <ChatBubble role={msg.role === "user" ? "user" : "assistant"} size="sm">
                  {msg.content}
                </ChatBubble>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelectWorkspaceForView(null)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to workspaces
      </button>
      <h1 className="text-base font-semibold text-foreground mb-1">{selectedWorkspaceForView.name}</h1>
      <p className="text-xs text-muted-foreground mb-4">Select a project to set as current</p>
      <div className="space-y-2">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => onSelectWorkspaceProject?.(selectedWorkspaceForView, project)}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-all duration-200 cursor-pointer hover:border-primary/50 hover:bg-primary/5",
              currentWorkspace?.id === selectedWorkspaceForView.id && currentProject?.id === project.id &&
                "border-primary bg-primary/10",
            )}
          >
            <LayoutDashboard className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-foreground">{project.name}</span>
            {currentWorkspace?.id === selectedWorkspaceForView.id && currentProject?.id === project.id && (
              <span className="ml-auto text-xs text-primary font-medium">Current</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
