"use client"

import React, { createContext, useContext, useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import type { ChatMessage } from "@/lib/types"
import { AI_RESPONSE_DELAY_MS } from "@/lib/constants"
import { useCurrentPreferences } from "@/lib/contexts/current-preferences-context"
import { apiGet, apiPost, API_ROUTES } from "@/lib/api"

interface ChatContextValue {
  messagesByKey: Record<string, ChatMessage[]>
  setMessagesByKey: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>
  sendMessage: (key: string, userContent: string, assistantReplyOverride?: string) => void
  loadConversation: (chatKey: string, dbConversationId: string) => Promise<void>
  inputValue: string
  setInputValue: React.Dispatch<React.SetStateAction<string>>
  pendingMessage: string | null
  setPendingMessage: (value: string | null) => void
  clearPendingMessage: () => void
  isStreamingForKey: (key: string) => boolean
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
  onConversationTitleGenerated?: (oldRecentId: string, convoId: string, title: string) => void
}

export function ChatProvider({ children, pendingMessage: controlledPending, setPendingMessage: controlledSetPending, onClearPendingMessage, onConversationTitleGenerated }: ChatProviderProps) {
  const [messagesByKey, setMessagesByKey] = useState<Record<string, ChatMessage[]>>({})
  const messagesByKeyRef = useRef(messagesByKey)
  messagesByKeyRef.current = messagesByKey
  const abortControllerRef = useRef<AbortController | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [internalPending, setInternalPending] = useState<string | null>(null)
  const [streamingKeys, setStreamingKeys] = useState<Set<string>>(new Set())
  const [conversationIds, setConversationIds] = useState<Record<string, string>>({})
  const { preferences: currentPreferences } = useCurrentPreferences()

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
    setStreamingKeys((prev) => new Set(prev).add(key))

    const userCountAfterThis = (messagesByKeyRef.current[key] || []).filter((m) => m.role === "user").length + 1
    const willBeSecondUserMessage = userCountAfterThis === 2

    const body: { conversationId?: string; message: string; preferences?: Record<string, string> } = {
      message: userContent,
      preferences: currentPreferences && Object.keys(currentPreferences).length > 0 ? currentPreferences : undefined,
    }
    const convoId = conversationIds[key]
    if (convoId) body.conversationId = convoId

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    fetch(API_ROUTES.chat, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
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
        // Only fire extraction and title after successful stream read (avoid on 429/503)
        if (newConvoId) {
          apiPost<{ entities?: { text: string; field: string; confidence: number }[] }>(API_ROUTES.extract, {
            conversationId: newConvoId,
            content: userContent,
          })
            .then((data) => {
              if (!data.entities?.length) return
              data.entities?.forEach((e: { field: string; text: string }) => {
                toast.success(`Captured: ${e.field} → ${e.text}`)
              })
              setMessagesByKey((prev) => {
                const list = prev[key] || []
                const lastUserIdx = list.map((m) => m.role).lastIndexOf("user")
                if (lastUserIdx < 0) return prev
                const copy = [...list]
                copy[lastUserIdx] = { ...copy[lastUserIdx], extractions: data.entities }
                return { ...prev, [key]: copy }
              })
            })
            .catch((err) => console.error("Extraction failed:", err))
        }
        if (willBeSecondUserMessage && newConvoId && onConversationTitleGenerated) {
          apiPost<{ title: string }>(API_ROUTES.conversationTitle(newConvoId), {})
            .then((data) => onConversationTitleGenerated(key, newConvoId!, data.title))
            .catch((err) => console.error("Title generation failed:", err))
        }
        // Attach last message id so UI can show feedback
        if (newConvoId) {
          apiGet<{ messages?: { id: string }[] }>(API_ROUTES.conversation(newConvoId))
            .then((data) => {
              const list = data.messages
              const last = list?.length ? list[list.length - 1] : null
              if (last?.id) {
                setMessagesByKey((prev) => {
                  const msgs = prev[key] || []
                  const lastIdx = msgs.length - 1
                  if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
                    return { ...prev, [key]: [...msgs.slice(0, lastIdx), { ...msgs[lastIdx], id: last.id }] }
                  }
                  return prev
                })
              }
            })
            .catch((err) => console.error("Message ID fetch failed:", err))
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return
        const isNetwork = err instanceof TypeError && (err.message?.includes("fetch") ?? true)
        const msg = isNetwork
          ? "I can't reach the server right now. Check your connection and try again."
          : "Something went wrong. Please try again."
        toast.error(msg)
        setMessagesByKey((prev) => {
          const list = prev[key] || []
          const last = list[list.length - 1]
          if (last?.role === "assistant") {
            return { ...prev, [key]: [...list.slice(0, -1), { ...last, content: msg }] }
          }
          return { ...prev, [key]: [...list, { role: "assistant", content: msg }] }
        })
      })
      .finally(() => setStreamingKeys((prev) => { const next = new Set(prev); next.delete(key); return next }))
  }, [conversationIds, onConversationTitleGenerated, currentPreferences])

  const loadConversation = useCallback(async (chatKey: string, dbConversationId: string) => {
    try {
      const data = await apiGet<{ messages?: { id: string; role: string; content: string; extractions?: unknown }[] }>(API_ROUTES.conversation(dbConversationId))
      const msgs: ChatMessage[] = (data.messages || []).map(
        (m: { id: string; role: string; content: string; extractions?: unknown }) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          extractions: m.extractions as ChatMessage["extractions"],
        }),
      )
      setMessagesByKey((prev) => ({ ...prev, [chatKey]: msgs }))
      setConversationIds((prev) => ({ ...prev, [chatKey]: dbConversationId }))
    } catch {
      toast.error("Failed to load conversation")
    }
  }, [])

  const clearPendingMessage = useCallback(() => {
    if (onClearPendingMessage) onClearPendingMessage()
    else setInternalPending(null)
  }, [onClearPendingMessage])

  const value: ChatContextValue = {
    messagesByKey,
    setMessagesByKey,
    sendMessage,
    loadConversation,
    inputValue,
    setInputValue,
    pendingMessage,
    setPendingMessage: setPendingMessageState,
    clearPendingMessage,
    isStreamingForKey: (k) => streamingKeys.has(k),
    isStreaming: streamingKeys.size > 0,
    conversationIds,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider")
  return ctx
}
