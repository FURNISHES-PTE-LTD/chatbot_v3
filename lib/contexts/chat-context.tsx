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
  isStreaming: boolean
  conversationIds: Record<string, string>
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
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationIds, setConversationIds] = useState<Record<string, string>>({})

  const pendingMessage = controlledPending !== undefined ? controlledPending : internalPending
  const setPendingMessageState = controlledSetPending ?? setInternalPending

  const sendMessage = useCallback((key: string, userContent: string, assistantReplyOverride?: string) => {
    const userMsg: ChatMessage = { role: "user", content: userContent }
    setMessagesByKey((prev) => ({ ...prev, [key]: [...(prev[key] || []), userMsg] }))

    if (assistantReplyOverride !== undefined) {
      setTimeout(() => {
        const assistantMsg: ChatMessage = { role: "assistant", content: assistantReplyOverride }
        setMessagesByKey((prev) => ({ ...prev, [key]: [...(prev[key] || []), assistantMsg] }))
      }, AI_RESPONSE_DELAY_MS)
      return
    }

    const placeholder: ChatMessage = { role: "assistant", content: "" }
    setMessagesByKey((prev) => ({ ...prev, [key]: [...(prev[key] || []), placeholder] }))
    setIsStreaming(true)

    const body: { conversationId?: string; message: string; preferences?: Record<string, string> } = {
      message: userContent,
    }
    const convoId = conversationIds[key]
    if (convoId) body.conversationId = convoId

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (response) => {
        const newConvoId = response.headers.get("X-Conversation-Id")
        if (newConvoId) {
          setConversationIds((prev) => ({ ...prev, [key]: newConvoId }))
        }
        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: response.statusText }))
          const errText = (err as { error?: string }).error ?? "Something went wrong. Try again."
          setMessagesByKey((prev) => {
            const list = prev[key] || []
            const last = list[list.length - 1]
            if (last?.role === "assistant") {
              return { ...prev, [key]: [...list.slice(0, -1), { ...last, content: errText }] }
            }
            return { ...prev, [key]: [...list, { role: "assistant", content: errText }] }
          })
          return
        }
        const reader = response.body?.getReader()
        if (!reader) {
          setMessagesByKey((prev) => {
            const list = prev[key] || []
            const last = list[list.length - 1]
            if (last?.role === "assistant") {
              return { ...prev, [key]: [...list.slice(0, -1), { ...last, content: "No response stream." }] }
            }
            return { ...prev, [key]: [...list, { role: "assistant", content: "No response stream." }] }
          })
          return
        }
        const decoder = new TextDecoder()
        let acc = ""
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          acc += decoder.decode(value, { stream: true })
          const content = acc
          setMessagesByKey((prev) => {
            const list = prev[key] || []
            const last = list[list.length - 1]
            if (last?.role === "assistant") {
              return { ...prev, [key]: [...list.slice(0, -1), { ...last, content }] }
            }
            return { ...prev, [key]: [...list, { role: "assistant", content }] }
          })
        }
      })
      .catch(() => {
        setMessagesByKey((prev) => {
          const list = prev[key] || []
          const last = list[list.length - 1]
          if (last?.role === "assistant") {
            return { ...prev, [key]: [...list.slice(0, -1), { ...last, content: "Network error. Please try again." }] }
          }
          return { ...prev, [key]: [...list, { role: "assistant", content: "Network error. Please try again." }] }
        })
      })
      .finally(() => setIsStreaming(false))
  }, [conversationIds])

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
    isStreaming,
    conversationIds,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider")
  return ctx
}
