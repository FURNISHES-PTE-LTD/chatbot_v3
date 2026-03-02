"use client"

import React, { createContext, useContext } from "react"
import type { RecentItem } from "@/lib/types"

interface AppContextValue {
  activeItem: string
  setActiveItem: (id: string) => void
  recents: RecentItem[]
  addRecent: (item: RecentItem) => void
  removeRecent: (id: string) => void
  onItemClick: (id: string, label: string) => void
  onConversationTitleGenerated?: (oldRecentId: string, convoId: string, title: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({
  value,
  children,
}: {
  value: AppContextValue
  children: React.ReactNode
}) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useAppContext must be used within AppProvider")
  return ctx
}
