"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import type { ChatMessage } from "@/lib/types"
import { AI_RESPONSE_DELAY_MS } from "@/lib/constants"

interface ChatContextValue {
  messagesByKey: Record<string, ChatMessage[]>
  sendMessage: (key: string, userContent: string, assistantReplyOverride?: string) => void
  inputValue: string
  setInputValue: (value: string) => void
  pendingMessage: string | null
  setPendingMessage: (value: string | null) => void
  clearPendingMessage: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

interface ChatProviderProps {
  children: React.ReactNode
  /** When provided, pending message is controlled by parent (e.g. DashboardLayout). */
  pendingMessage?: string | null
  setPendingMessage?: (value: string | null) => void
  onClearPendingMessage?: () => void
}

export function ChatProvider({ children, pendingMessage: controlledPending, setPendingMessage: controlledSetPending, onClearPendingMessage }: ChatProviderProps) {
  const [messagesByKey, setMessagesByKey] = useState<Record<string, ChatMessage[]>>({})
  const [inputValue, setInputValue] = useState("")
  const [internalPending, setInternalPending] = useState<string | null>(null)

  const pendingMessage = controlledPending !== undefined ? controlledPending : internalPending
  const setPendingMessageState = controlledSetPending ?? setInternalPending

  const sendMessage = useCallback((key: string, userContent: string, assistantReplyOverride?: string) => {
    const userMsg: ChatMessage = { role: "user", content: userContent }
    setMessagesByKey((prev) => ({ ...prev, [key]: [...(prev[key] || []), userMsg] }))
    const reply = assistantReplyOverride ?? "Thanks for your message. How can I help with your design or furniture choices today?"
    setTimeout(() => {
      const assistantMsg: ChatMessage = { role: "assistant", content: reply }
      setMessagesByKey((prev) => ({ ...prev, [key]: [...(prev[key] || []), assistantMsg] }))
    }, AI_RESPONSE_DELAY_MS)
  }, [])

  const clearPendingMessage = useCallback(() => {
    if (onClearPendingMessage) onClearPendingMessage()
    else setInternalPending(null)
  }, [onClearPendingMessage])

  const value: ChatContextValue = {
    messagesByKey,
    sendMessage,
    inputValue,
    setInputValue,
    pendingMessage,
    setPendingMessage: setPendingMessageState,
    clearPendingMessage,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider")
  return ctx
}
