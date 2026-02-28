"use client"

import { LeftSidebar } from "./left-sidebar"
import { RightSidebar } from "./right-sidebar"
import { MainContent } from "./main-content"
import { Navbar, type NavItemId } from "./navbar"
import { TutorialGuide } from "./tutorial-guide"
import { useState } from "react"

const DEFAULT_WORKSPACE = { id: "ws-1", name: "Home Renovation" }
const DEFAULT_PROJECT = { id: "proj-1a", name: "Living Room" }

export function DashboardLayout() {
  const [activeItem, setActiveItem] = useState("recent-living-room")
  const [activeNavId, setActiveNavId] = useState<NavItemId>("about")
  const [tabs, setTabs] = useState([
    { id: "tab-1", title: "Project 1", section: "recent-living-room" },
    { id: "tab-2", title: "Project 2", section: "saved-plans" },
  ])
  const [activeTabId, setActiveTabId] = useState("tab-1")
  const [isRightSidebarVisible, setIsRightSidebarVisible] = useState(true)
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const [currentWorkspace, setCurrentWorkspace] = useState<{ id: string; name: string } | null>(DEFAULT_WORKSPACE)
  const [currentProject, setCurrentProject] = useState<{ id: string; name: string } | null>(DEFAULT_PROJECT)
  const [showAssistantPicker, setShowAssistantPicker] = useState(false)
  const [workspaceListKey, setWorkspaceListKey] = useState(0)
  const [selectedAssistant, setSelectedAssistant] = useState<{ id: string; name: string; tagline: string }>({
    id: "eva",
    name: "Eva",
    tagline: "[the Assistant]",
  })
  const [recents, setRecents] = useState<{ id: string; label: string }[]>([
    { id: "recent-living-room", label: "Living Room Redesign" },
    { id: "recent-sofa-ideas", label: "Sofa ideas & layout" },
    { id: "recent-color-palette", label: "Color palette exploration" },
  ])

  const handleSelectWorkspaceProject = (workspace: { id: string; name: string }, project: { id: string; name: string }) => {
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
      section: "saved-plans",
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
    setActiveItem("saved-plans")
  }

  const closeTab = (tabId: string) => {
    const newTabs = tabs.filter((tab) => tab.id !== tabId)
    if (newTabs.length === 0) {
      setTabs([{ id: "tab-1", title: "Project 1", section: "saved-plans" }])
      setActiveTabId("tab-1")
      setActiveItem("saved-plans")
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

    // Handle subdirectory items with parent context
    if (id === "trending" || id === "collections" || id === "others") {
      itemId = `explore-${id}`
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

  const handleAiAssistantClick = () => {
    setIsRightSidebarCollapsed(!isRightSidebarCollapsed)
  }

  const handleCloseRightSidebar = () => {
    setIsRightSidebarVisible(false)
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

  const handleSelectAssistant = (assistant: { id: string; name: string; tagline: string }) => {
    setSelectedAssistant(assistant)
    setShowAssistantPicker(false)
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-muted">
      <Navbar
        activeNavId={activeNavId}
        onNavClick={setActiveNavId}
        onFurnishesClick={handleFurnishesClick}
        onStartJourneyClick={() => setActiveItem("landing")}
      />

      <div className="flex flex-1 overflow-hidden p-2 gap-2 px-4">
        {/* Left Sidebar */}
        <div className="overflow-hidden h-full">
          <LeftSidebar
            activeItem={activeItem}
            recents={recents}
            onItemClick={handleItemClick}
            onAiAssistantClick={handleAiAssistantClick}
            onHelpClick={handleHelpClick}
          />
        </div>

        {/* Middle Section */}
        <div className="flex-1 bg-card overflow-hidden border border-border transition-all duration-300">
          <MainContent
            activeItem={activeItem}
            recents={recents}
            onItemClick={handleItemClick}
            workspaceListKey={workspaceListKey}
            currentWorkspace={currentWorkspace}
            currentProject={currentProject}
            onSelectWorkspaceProject={handleSelectWorkspaceProject}
            onClearWorkspaceProject={handleClearWorkspaceProject}
            showAssistantPicker={showAssistantPicker}
            onSelectAssistant={handleSelectAssistant}
            selectedAssistant={selectedAssistant}
          />
        </div>

        {/* Right Sidebar */}
        <div className="overflow-hidden h-full">
          <RightSidebar
            onClose={handleCloseRightSidebar}
            isCollapsed={isRightSidebarCollapsed}
            onToggleCollapse={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
            onChangeAssistantClick={handleChangeAssistantClick}
            selectedAssistant={selectedAssistant}
          />
        </div>
      </div>

      <TutorialGuide isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </div>
  )
}
