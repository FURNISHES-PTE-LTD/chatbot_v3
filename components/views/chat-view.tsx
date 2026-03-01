"use client"

import { useEffect, useState, useRef } from "react"
import { MessageSquarePlus, Send, Paperclip, Lightbulb, Check, Edit3, Home, Briefcase, Moon, Sun, ThumbsUp, ThumbsDown } from "lucide-react"
import { CHAT_SUGGESTION_CARDS } from "@/lib/suggestion-cards"
import { useAppContext } from "@/lib/contexts/app-context"
import { useChatContext } from "@/lib/contexts/chat-context"
import { useCurrentConversation } from "@/lib/contexts/current-conversation-context"
import { parseHighlightedContent } from "@/lib/parse-highlights"
import type { Workspace, Project } from "@/lib/types"
import { cn } from "@/lib/utils"
import { apiPost, apiPatch, API_ROUTES } from "@/lib/api"
import { toast } from "sonner"
import { ChatBubble } from "@/components/chat/chat-bubble"
import { ChatAvatar } from "@/components/chat/chat-avatar"
import { Input } from "@/components/ui/input"

const chatSuggestionCardsWithIcons = CHAT_SUGGESTION_CARDS.map((card) => ({
  ...card,
  icon: card.id === "living-room" ? Home : card.id === "home-office" ? Briefcase : card.id === "bedroom" ? Moon : Sun,
}))

interface ChatViewProps {
  title: string
  currentWorkspace?: Workspace | null
  currentProject?: Project | null
}

export function ChatView({ title, currentWorkspace = null, currentProject = null }: ChatViewProps) {
  const { activeItem } = useAppContext()
  const {
    messagesByKey,
    setMessagesByKey,
    sendMessage,
    loadConversation,
    inputValue,
    setInputValue,
    pendingMessage,
    clearPendingMessage,
    isStreamingForKey,
    isStreaming,
    conversationIds,
  } = useChatContext()
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatKey =
    currentWorkspace && currentProject
      ? `${currentWorkspace.id}-${currentProject.id}`
      : activeItem.startsWith("recent-") || activeItem.startsWith("convo-")
        ? activeItem
        : "default"
  const isStreamingThisChat = isStreamingForKey(chatKey)
  const { setConversationId } = useCurrentConversation()

  const chatMessages = messagesByKey[chatKey] || []
  const messagesToShow = chatMessages
  const currentConvoId = conversationIds[chatKey] ?? (chatKey.startsWith("convo-") ? chatKey.replace("convo-", "") : null)
  const [feedbackSent, setFeedbackSent] = useState<Record<string, "positive" | "negative">>({})
  const [adjustState, setAdjustState] = useState<{ messageIndex: number; field: string; value: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [suggestions, setSuggestions] = useState<string[]>([
    "Mood image",
    "Floorplan",
    "Color palette",
    "Cozy living room",
    "Small bedroom",
    "Minimalist tips",
    "Lighting ideas",
  ])

  useEffect(() => {
    if ((activeItem === "new-chat" || activeItem.startsWith("recent-") || activeItem.startsWith("convo-")) && pendingMessage) {
      setInputValue(pendingMessage)
      clearPendingMessage()
    }
  }, [pendingMessage, activeItem, setInputValue, clearPendingMessage])

  useEffect(() => {
    if (chatKey.startsWith("convo-") && chatMessages.length === 0) {
      const dbId = chatKey.replace("convo-", "")
      loadConversation(chatKey, dbId)
    }
  }, [chatKey, chatMessages.length, loadConversation])

  useEffect(() => {
    const id =
      conversationIds[chatKey] ??
      (chatKey.startsWith("convo-") ? chatKey.replace("convo-", "") : null)
    setConversationId(id)
  }, [chatKey, conversationIds, setConversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messagesToShow.length, messagesToShow[messagesToShow.length - 1]?.content])

  useEffect(() => {
    if (!isStreaming && currentConvoId && chatMessages.length > 2) {
      const timer = setTimeout(() => {
        apiPost<{ suggestions?: string[] }>(API_ROUTES.suggestions, { conversationId: currentConvoId })
          .then((data) => data.suggestions?.length && setSuggestions(data.suggestions))
          .catch((err) => console.error("Suggestions fetch failed", err))
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isStreaming, currentConvoId])

  const handleSendChatMessage = () => {
    if (!inputValue.trim()) return
    sendMessage(chatKey, inputValue.trim())
    setInputValue("")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    const formData = new FormData()
    formData.append("file", file)
    if (currentConvoId) formData.append("conversationId", currentConvoId)
    try {
      const res = await fetch(API_ROUTES.upload, { method: "POST", body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setInputValue((prev) => prev + (prev ? " " : "") + `[Upload failed: ${(err as { error?: string }).error ?? "unknown"}]`)
        return
      }
      const data = (await res.json()) as { url?: string; filename?: string }
      if (data.url) {
        setInputValue((prev) => (prev ? `${prev} ` : "") + `I've attached an image: ${data.url}`)
      }
    } catch {
      setInputValue((prev) => prev + (prev ? " " : "") + "[Upload failed]")
    }
  }

  const handleSuggestionClick = (card: (typeof chatSuggestionCardsWithIcons)[0]) => {
    const userContent = `I'd like help with ${card.title}. ${card.description}`
    const assistantReply = `Great choice! Let's work on your ${card.title.toLowerCase()}. Tell me more about your space, style preferences, or any specific challenges you're facing.`
    sendMessage(chatKey, userContent, assistantReply)
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {messagesToShow.length === 0 ? (
          activeItem === "new-chat" || activeItem.startsWith("recent-") ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="mb-4">
                <ChatAvatar role="assistant" initial="E" size="lg" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">How can I help you today?</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Tell me about your space and I'll organize your ideas into a design brief.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                {chatSuggestionCardsWithIcons.map((card) => {
                  const Icon = card.icon
                  return (
                    <button
                      type="button"
                      key={card.id}
                      onClick={() => handleSuggestionClick(card)}
                      className="flex flex-col items-start gap-1.5 rounded-lg border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{card.title}</span>
                      <span className="text-xs text-muted-foreground">{card.description}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[280px] text-center px-4">
              <MessageSquarePlus className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-base font-semibold text-foreground mb-2">{title}</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Ask about your design, furniture, or get recommendations. Type a message below to start.
              </p>
            </div>
          )
        ) : (
          messagesToShow.map((msg, i) => {
            const isUser = msg.role === "user"
            const messageId = (msg as { id?: string }).id
            const hasFeedback = messageId && !isUser
            const sent = messageId ? feedbackSent[messageId] : null
            return (
              <div
                key={messageId ?? i}
                className={cn(
                  "flex gap-2.5",
                  isUser ? "flex-row-reverse" : "",
                )}
              >
                <ChatAvatar role={isUser ? "user" : "assistant"} initial={isUser ? "Y" : "E"} size="md" />
                <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
                  <ChatBubble role={isUser ? "user" : "assistant"} size="md">
                    {isUser ? msg.content : parseHighlightedContent(msg.content)}
                  </ChatBubble>
                  {!isUser && (() => {
                    let prevUser: (typeof messagesToShow)[number] | undefined
                    for (let j = i - 1; j >= 0; j--) {
                      if (messagesToShow[j].role === "user") {
                        prevUser = messagesToShow[j]
                        break
                      }
                    }
                    const prevExtractions = prevUser && "extractions" in prevUser ? (prevUser as { extractions?: { field: string; text: string }[] }).extractions : undefined
                    if (!prevExtractions?.length) return null
                    const capturedLabel = prevExtractions.map((e) => `${e.field}: ${e.text}`).join(", ")
                    return (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100 text-xs text-orange-700 font-medium w-fit">
                        <Check className="w-3 h-3 text-orange-500" /> <span className="text-orange-600 font-normal">Captured:</span> {capturedLabel}
                      </div>
                    )
                  })()}
                  {hasFeedback && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (!messageId || sent) return
                          apiPost(API_ROUTES.messageFeedback(messageId), { rating: "positive" }).then(() => setFeedbackSent((prev) => ({ ...prev, [messageId]: "positive" }))).catch(() => toast.error("Failed to send feedback"))
                        }}
                        className={cn(
                          "p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50",
                          sent === "positive" && "text-primary",
                        )}
                        disabled={!!sent}
                        title="Good response"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!messageId || sent) return
                          apiPost(API_ROUTES.messageFeedback(messageId), { rating: "negative" }).then(() => setFeedbackSent((prev) => ({ ...prev, [messageId]: "negative" }))).catch(() => toast.error("Failed to send feedback"))
                        }}
                        className={cn(
                          "p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50",
                          sent === "negative" && "text-primary",
                        )}
                        disabled={!!sent}
                        title="Bad response"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {isUser && (msg.extractions?.length ? (
                    <div className="flex flex-col gap-1.5 items-end">
                      <div className="flex gap-1 flex-wrap justify-end">
                        {msg.extractions.map((e, j) => (
                          <span key={j} className="text-[10px] text-primary bg-primary/5 rounded px-1.5 py-0.5 font-medium border border-primary/10">
                            ↗ {e.text}
                          </span>
                        ))}
                      </div>
                      {(msg.extractions?.some((e) => e.needsConfirmation)) && currentConvoId && (() => {
                        const first = msg.extractions?.find((e) => e.needsConfirmation && e.confirmMessage)
                        if (!first) return null
                        const isAdjusting = adjustState?.messageIndex === i && adjustState?.field === first.field
                        return (
                          <div className="flex flex-col gap-1.5 items-end">
                            <p className="text-[10px] text-muted-foreground max-w-[85%]">{first.confirmMessage}</p>
                            {isAdjusting ? (
                              <div className="flex flex-col gap-1.5 items-end w-full max-w-[85%]">
                                <Input
                                  value={adjustState.value}
                                  onChange={(e) => setAdjustState((prev) => prev ? { ...prev, value: e.target.value } : null)}
                                  className="h-8 text-xs"
                                  placeholder={first.text}
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!currentConvoId || !adjustState || adjustState.value.trim() === "") {
                                        setAdjustState(null)
                                        return
                                      }
                                      await apiPatch(API_ROUTES.conversationPreferences(currentConvoId), {
                                        field: adjustState.field,
                                        value: adjustState.value.trim(),
                                      })
                                      setMessagesByKey((prev) => {
                                        const list = prev[chatKey] || []
                                        if (i >= list.length) return prev
                                        const copy = [...list]
                                        const extractions = (copy[i] as { extractions?: typeof msg.extractions }).extractions?.map((ex) =>
                                          ex.field === adjustState.field ? { ...ex, needsConfirmation: false, text: adjustState.value.trim() } : { ...ex, needsConfirmation: false }
                                        ) ?? []
                                        ;(copy[i] as { extractions?: typeof msg.extractions }).extractions = extractions
                                        return { ...prev, [chatKey]: copy }
                                      })
                                      toast.success(`Preference updated: ${adjustState.field}`)
                                      setAdjustState(null)
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition-colors cursor-pointer"
                                  >
                                    <Check className="w-3 h-3" /> Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAdjustState(null)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!currentConvoId) return
                                    for (const e of msg.extractions ?? []) {
                                      await apiPatch(API_ROUTES.conversationPreferences(currentConvoId), { field: e.field, value: e.text })
                                    }
                                    setMessagesByKey((prev) => {
                                      const list = prev[chatKey] || []
                                      if (i >= list.length) return prev
                                      const copy = [...list]
                                      const extractions = (copy[i] as { extractions?: typeof msg.extractions }).extractions?.map((ex) => ({ ...ex, needsConfirmation: false })) ?? []
                                      ;(copy[i] as { extractions?: typeof msg.extractions }).extractions = extractions
                                      return { ...prev, [chatKey]: copy }
                                    })
                                    toast.success("Preferences confirmed")
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition-colors cursor-pointer"
                                >
                                  <Check className="w-3 h-3" /> Looks good
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAdjustState({ messageIndex: i, field: first.field, value: first.text })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" /> Adjust
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  ) : null)}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="shrink-0 flex flex-col gap-1.5 pt-1.5 border-t border-border -mx-6 px-6">
        {isStreamingThisChat && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <ChatAvatar role="assistant" initial="E" size="sm" />
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        )}
        <p className="text-xs font-medium flex items-center gap-2">
          <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-primary">Quick suggestions</span>
          <span className="text-foreground">for your project:</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((label) => (
            <button
              type="button"
              key={label}
              onClick={() => setInputValue(label)}
              className="rounded-full border border-border bg-transparent px-2.5 py-1 text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-accent/15 hover:text-primary cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5 transition-all duration-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 mt-2">
          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept="image/*"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-0.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            title="Attach image"
          >
            <Paperclip className="h-4 w-4 shrink-0" />
          </button>
          <Input
            placeholder="Ask about your design..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChatMessage()}
            className="min-h-7 min-w-0 flex-1 border-0 bg-transparent shadow-none rounded-none px-2 text-sm text-muted-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-transparent dark:bg-transparent dark:text-muted-foreground"
          />
          <button
            type="button"
            onClick={handleSendChatMessage}
            disabled={!inputValue.trim() || isStreamingThisChat}
            className="shrink-0 rounded-md p-2 bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
