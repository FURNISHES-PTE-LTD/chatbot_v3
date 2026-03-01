"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import type { Workspace, Project, Assistant } from "@/lib/types"
import { DEFAULT_WORKSPACE, DEFAULT_PROJECT, DEFAULT_ASSISTANT } from "@/lib/constants"

interface WorkspaceContextValue {
  currentWorkspace: Workspace | null
  currentProject: Project | null
  selectedAssistant: Assistant
  showAssistantPicker: boolean
  selectWorkspaceProject: (workspace: Workspace, project: Project) => void
  clearWorkspaceProject: () => void
  setSelectedAssistant: (assistant: Assistant) => void
  setShowAssistantPicker: (show: boolean) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(DEFAULT_WORKSPACE)
  const [currentProject, setCurrentProject] = useState<Project | null>(DEFAULT_PROJECT)
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant>(DEFAULT_ASSISTANT)
  const [showAssistantPicker, setShowAssistantPicker] = useState(false)

  const selectWorkspaceProject = useCallback((workspace: Workspace, project: Project) => {
    setCurrentWorkspace(workspace)
    setCurrentProject(project)
  }, [])

  const clearWorkspaceProject = useCallback(() => {
    setCurrentWorkspace(null)
    setCurrentProject(null)
  }, [])

  const value: WorkspaceContextValue = {
    currentWorkspace,
    currentProject,
    selectedAssistant,
    showAssistantPicker,
    selectWorkspaceProject,
    clearWorkspaceProject,
    setSelectedAssistant,
    setShowAssistantPicker,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspaceContext(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error("useWorkspaceContext must be used within WorkspaceProvider")
  return ctx
}
