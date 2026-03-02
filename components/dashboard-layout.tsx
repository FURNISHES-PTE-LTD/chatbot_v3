"use client"

import { AppProvider } from "@/lib/contexts/app-context"
import { WorkspaceProvider, useWorkspaceContext } from "@/lib/contexts/workspace-context"
import { CurrentConversationProvider } from "@/lib/contexts/current-conversation-context"
import { CurrentPreferencesProvider } from "@/lib/contexts/current-preferences-context"
import { ChatProvider } from "@/lib/contexts/chat-context"
import ErrorBoundary from "@/components/error-boundary"
import type { RecentItem } from "@/lib/types"
import { LeftSidebar } from "./left-sidebar"
import { RightSidebar } from "./right-sidebar"
import { MainContent } from "./main-content"
import { Navbar } from "./navbar"
import { TutorialGuide } from "./tutorial-guide"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Menu } from "lucide-react"
import { apiGet, API_ROUTES } from "@/lib/api"

function DashboardLayoutInner() {
  const [activeItem, setActiveItem] = useState("new-chat")
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [workspaceListKey, setWorkspaceListKey] = useState(0)
  const [recents, setRecents] = useState<RecentItem[]>([])
  const [pendingChatMessage, setPendingChatMessage] = useState<string | null>(null)
  const { setShowAssistantPicker } = useWorkspaceContext()

  useEffect(() => {
    apiGet<{ id: string; title: string }[]>(API_ROUTES.conversations)
      .then((convos) => {
        const apiRecents: RecentItem[] = convos.map((c) => ({
          id: `convo-${c.id}`,
          label: c.title,
        }))
        setRecents(apiRecents)
      })
      .catch(console.error)
  }, [])

  const handleItemClick = useCallback((id: string, label: string) => {
    const itemId = id

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
  }, [setShowAssistantPicker])

  const handleFurnishesClick = () => {
    setActiveItem("landing")
  }

  const handleHelpClick = () => {
    setIsTutorialOpen(true)
  }

  const onConversationTitleGenerated = useCallback((oldRecentId: string, convoId: string, title: string) => {
    const newId = `convo-${convoId}`
    setRecents((prev) =>
      prev.map((r) => (r.id === oldRecentId ? { id: newId, label: title } : r)),
    )
    setActiveItem((current) => (current === oldRecentId ? newId : current))
  }, [])

  const removeRecent = useCallback((id: string) => {
    setRecents((prev) => prev.filter((r) => r.id !== id))
    setActiveItem((current) => (current === id ? "new-chat" : current))
  }, [])

  const addRecent = useCallback((item: RecentItem) => {
    setRecents((prev) => [item, ...prev])
  }, [])

  const appContextValue = useMemo(
    () => ({
      activeItem,
      setActiveItem,
      recents,
      addRecent,
      removeRecent,
      onItemClick: handleItemClick,
      onConversationTitleGenerated,
    }),
    [activeItem, recents, addRecent, removeRecent, handleItemClick, onConversationTitleGenerated]
  )

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
                <button
                  type="button"
                  className="md:hidden fixed top-14 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-sm hover:bg-muted transition-colors"
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
                {mobileNavOpen && (
                  <div className="fixed inset-0 z-40 md:hidden" aria-modal="true" role="dialog">
                    <div className="fixed inset-0 bg-black/30" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
                    <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border shadow-lg z-50 overflow-hidden flex flex-col">
                      <LeftSidebar isOverlay onHelpClick={() => { handleHelpClick(); setMobileNavOpen(false) }} onCloseMobileMenu={() => setMobileNavOpen(false)} />
                    </div>
                  </div>
                )}
                <div className="overflow-hidden h-full hidden md:flex md:flex-col">
                  <LeftSidebar onHelpClick={handleHelpClick} />
                </div>

                <div className="flex-1 bg-card overflow-hidden border border-border transition-all duration-200 min-w-0">
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
