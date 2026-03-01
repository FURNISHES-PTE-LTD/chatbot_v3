"use client"

import { DEMO_RECENT_ID } from "@/lib/constants"
import { AppProvider } from "@/lib/contexts/app-context"
import { WorkspaceProvider, useWorkspaceContext } from "@/lib/contexts/workspace-context"
import { CurrentConversationProvider } from "@/lib/contexts/current-conversation-context"
import { CurrentPreferencesProvider } from "@/lib/contexts/current-preferences-context"
import { ChatProvider } from "@/lib/contexts/chat-context"
import { ErrorBoundary } from "@/components/error-boundary"
import type { RecentItem } from "@/lib/types"
import { LeftSidebar } from "./left-sidebar"
import { RightSidebar } from "./right-sidebar"
import { MainContent } from "./main-content"
import { Navbar } from "./navbar"
import { TutorialGuide } from "./tutorial-guide"
import { useState, useEffect } from "react"
import { apiGet, API_ROUTES } from "@/lib/api"

function DashboardLayoutInner() {
  const [activeItem, setActiveItem] = useState(DEMO_RECENT_ID)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const [workspaceListKey, setWorkspaceListKey] = useState(0)
  const [recents, setRecents] = useState<RecentItem[]>([{ id: DEMO_RECENT_ID, label: "Design brief demo" }])
  const [pendingChatMessage, setPendingChatMessage] = useState<string | null>(null)
  const { setShowAssistantPicker } = useWorkspaceContext()

  useEffect(() => {
    apiGet<{ id: string; title: string }[]>(API_ROUTES.conversations)
      .then((convos) => {
        const apiRecents: RecentItem[] = convos.map((c) => ({
          id: `convo-${c.id}`,
          label: c.title,
        }))
        setRecents((prev) => {
          const keepDemo = prev.filter((r) => r.id === DEMO_RECENT_ID)
          return [...keepDemo, ...apiRecents]
        })
      })
      .catch(console.error)
  }, [])

  const handleItemClick = (id: string, label: string) => {
    let itemId = id

    if (id === "new-chat") {
      const newId = `recent-${Date.now()}`
      setRecents((prev) => [{ id: newId, label: "New Chat" }, ...prev])
      setActiveItem(newId)
      return
    }

    setShowAssistantPicker(false)
    if (id === "workspace") {
      setWorkspaceListKey((k) => k + 1)
    }
    setActiveItem(itemId)
  }

  const handleFurnishesClick = () => {
    setActiveItem("landing")
  }

  const handleHelpClick = () => {
    setIsTutorialOpen(true)
  }

  const onConversationTitleGenerated = (oldRecentId: string, convoId: string, title: string) => {
    const newId = `convo-${convoId}`
    setRecents((prev) =>
      prev.map((r) => (r.id === oldRecentId ? { id: newId, label: title } : r)),
    )
    if (activeItem === oldRecentId) setActiveItem(newId)
  }

  const appContextValue = {
    activeItem,
    setActiveItem,
    recents,
    addRecent: (item: RecentItem) => setRecents((prev) => [item, ...prev]),
    onItemClick: handleItemClick,
    onConversationTitleGenerated,
  }

  return (
    <AppProvider value={appContextValue}>
      <CurrentConversationProvider>
        <CurrentPreferencesProvider>
          <ChatProvider
            pendingMessage={pendingChatMessage}
            setPendingMessage={setPendingChatMessage}
            onClearPendingMessage={() => setPendingChatMessage(null)}
            onConversationTitleGenerated={onConversationTitleGenerated}
          >
            <ErrorBoundary>
            <div className="flex flex-col h-screen w-full overflow-hidden bg-muted">
              <Navbar onFurnishesClick={handleFurnishesClick} />

              <div className="flex flex-1 overflow-hidden p-2 gap-2 px-4">
                <div className="overflow-hidden h-full">
                  <LeftSidebar onHelpClick={handleHelpClick} />
                </div>

                <div className="flex-1 bg-card overflow-hidden border border-border transition-all duration-200">
                  <MainContent
                    workspaceListKey={workspaceListKey}
                    onEditInChatFromFiles={(title) => {
                      setPendingChatMessage(`Can you adjust the ${title}?`)
                      const newId = `recent-${Date.now()}`
                      setRecents((prev) => [{ id: newId, label: "New Chat" }, ...prev])
                      setActiveItem(newId)
                    }}
                    onSendToChatFromDiscover={(text) => {
                      setPendingChatMessage(text)
                      const newId = `recent-${Date.now()}`
                      setRecents((prev) => [{ id: newId, label: "New Chat" }, ...prev])
                      setActiveItem(newId)
                    }}
                  />
                </div>

                <div className="overflow-hidden h-full">
                  <RightSidebar
                    onSendToChat={(text) => {
                      setPendingChatMessage(text)
                      const isChat =
                        activeItem === "new-chat" ||
                        activeItem.startsWith("recent-") ||
                        activeItem.startsWith("convo-")
                      if (!isChat) {
                        const newId = `recent-${Date.now()}`
                        setRecents((prev) => [{ id: newId, label: "New Chat" }, ...prev])
                        setActiveItem(newId)
                      }
                    }}
                  />
                </div>
              </div>

              <TutorialGuide isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
            </div>
            </ErrorBoundary>
          </ChatProvider>
        </CurrentPreferencesProvider>
      </CurrentConversationProvider>
    </AppProvider>
  )
}

export function DashboardLayout() {
  return (
    <WorkspaceProvider>
      <DashboardLayoutInner />
    </WorkspaceProvider>
  )
}
