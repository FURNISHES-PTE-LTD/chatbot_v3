"use client"

import {
  DEMO_RECENT_ID,
  DEFAULT_WORKSPACE,
  DEFAULT_PROJECT,
  DEFAULT_ASSISTANT,
} from "@/lib/constants"
import { AppProvider } from "@/lib/contexts/app-context"
import type { RecentItem, Workspace, Project, Assistant } from "@/lib/types"
import { LeftSidebar } from "./left-sidebar"
import { RightSidebar } from "./right-sidebar"
import { MainContent } from "./main-content"
import { Navbar } from "./navbar"
import { TutorialGuide } from "./tutorial-guide"
import { useState } from "react"

const INITIAL_RECENTS: RecentItem[] = [
  { id: DEMO_RECENT_ID, label: "Design brief demo" },
  { id: "recent-living-room", label: "Living Room Redesign" },
  { id: "recent-sofa-ideas", label: "Sofa ideas & layout" },
  { id: "recent-color-palette", label: "Color palette exploration" },
]

export function DashboardLayout() {
  const [activeItem, setActiveItem] = useState("recent-living-room")
  const [tabs, setTabs] = useState([
    { id: "tab-1", title: "Project 1", section: "recent-living-room" },
    { id: "tab-2", title: "Project 2", section: "search" },
  ])
  const [activeTabId, setActiveTabId] = useState("tab-1")
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(DEFAULT_WORKSPACE)
  const [currentProject, setCurrentProject] = useState<Project | null>(DEFAULT_PROJECT)
  const [showAssistantPicker, setShowAssistantPicker] = useState(false)
  const [workspaceListKey, setWorkspaceListKey] = useState(0)
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant>(DEFAULT_ASSISTANT)
  const [recents, setRecents] = useState<RecentItem[]>(INITIAL_RECENTS)
  const [pendingChatMessage, setPendingChatMessage] = useState<string | null>(null)

  const handleSelectWorkspaceProject = (workspace: Workspace, project: Project) => {
    setCurrentWorkspace(workspace)
    setCurrentProject(project)
  }

  const handleClearWorkspaceProject = () => {
    setCurrentWorkspace(null)
    setCurrentProject(null)
  }

  const addNewTab = () => {
    const newTab = {
      id: `tab-${Date.now()}`,
      title: `Project ${tabs.length + 1}`,
      section: "search",
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
    setActiveItem("search")
  }

  const closeTab = (tabId: string) => {
    const newTabs = tabs.filter((tab) => tab.id !== tabId)
    if (newTabs.length === 0) {
      setTabs([{ id: "tab-1", title: "Project 1", section: "search" }])
      setActiveTabId("tab-1")
      setActiveItem("search")
    } else {
      setTabs(newTabs)
      if (activeTabId === tabId) {
        setActiveTabId(newTabs[0].id)
        setActiveItem(newTabs[0].section)
      }
    }
  }

  const handleItemClick = (id: string, label: string) => {
    let itemId = id

    // New Chat: add a new recent and open its chat interface
    if (id === "new-chat") {
      const newId = `recent-${Date.now()}`
      setRecents((prev) => [{ id: newId, label: "New Chat" }, ...prev])
      setActiveItem(newId)
      setTabs((t) => t.map((tab) => (tab.id === activeTabId ? { ...tab, section: newId } : tab)))
      return
    }

    if (showAssistantPicker) {
      setShowAssistantPicker(false)
    }
    if (id === "workspace") {
      setWorkspaceListKey((k) => k + 1)
    }
    setActiveItem(itemId)
    setTabs(tabs.map((tab) => (tab.id === activeTabId ? { ...tab, section: itemId } : tab)))
  }

  const handleTabSwitch = (tabId: string) => {
    setActiveTabId(tabId)
    const tab = tabs.find((t) => t.id === tabId)
    if (tab) {
      setActiveItem(tab.section)
    }
  }

  const handleFurnishesClick = () => {
    setActiveItem("landing")
  }

  const handleHelpClick = () => {
    setIsTutorialOpen(true)
  }

  const handleCartClick = () => {
    setActiveItem("cart")
    setTabs(tabs.map((tab) => (tab.id === activeTabId ? { ...tab, section: "cart" } : tab)))
  }

  const handleChangeAssistantClick = () => {
    setShowAssistantPicker(true)
  }

  const handleSelectAssistant = (assistant: Assistant) => {
    setSelectedAssistant(assistant)
    setShowAssistantPicker(false)
  }

  const appContextValue = {
    activeItem,
    setActiveItem,
    recents,
    addRecent: (item: RecentItem) => setRecents((prev) => [item, ...prev]),
    onItemClick: handleItemClick,
  }

  return (
    <AppProvider value={appContextValue}>
      <div className="flex flex-col h-screen w-full overflow-hidden bg-muted">
        <Navbar onFurnishesClick={handleFurnishesClick} />

        <div className="flex flex-1 overflow-hidden p-2 gap-2 px-4">
          <div className="overflow-hidden h-full">
            <LeftSidebar onHelpClick={handleHelpClick} />
          </div>

          <div className="flex-1 bg-card overflow-hidden border border-border transition-all duration-200">
            <MainContent
              workspaceListKey={workspaceListKey}
              currentWorkspace={currentWorkspace}
              currentProject={currentProject}
              onSelectWorkspaceProject={handleSelectWorkspaceProject}
              onClearWorkspaceProject={handleClearWorkspaceProject}
              showAssistantPicker={showAssistantPicker}
              onSelectAssistant={handleSelectAssistant}
              selectedAssistant={selectedAssistant}
              pendingChatMessage={pendingChatMessage}
              onClearPendingChatMessage={() => setPendingChatMessage(null)}
              onEditInChatFromFiles={(title) => {
                setPendingChatMessage(`Can you adjust the ${title}?`)
                const newId = `recent-${Date.now()}`
                setRecents((prev) => [{ id: newId, label: "New Chat" }, ...prev])
                setActiveItem(newId)
                setTabs((t) => t.map((tab) => (tab.id === activeTabId ? { ...tab, section: newId } : tab)))
              }}
              onSendToChatFromDiscover={(text) => {
                setPendingChatMessage(text)
                const newId = `recent-${Date.now()}`
                setRecents((prev) => [{ id: newId, label: "New Chat" }, ...prev])
                setActiveItem(newId)
                setTabs((t) => t.map((tab) => (tab.id === activeTabId ? { ...tab, section: newId } : tab)))
              }}
            />
          </div>

          <div className="overflow-hidden h-full">
            <RightSidebar
              onChangeAssistantClick={handleChangeAssistantClick}
              selectedAssistant={selectedAssistant}
            />
          </div>
        </div>

        <TutorialGuide isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
      </div>
    </AppProvider>
  )
}
