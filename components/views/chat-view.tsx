"use client"

import { useEffect, useState } from "react"
import { MessageSquarePlus, Send, Paperclip, Lightbulb, Check, Bookmark, Edit3, Home, Briefcase, Moon, Sun } from "lucide-react"
import { DEMO_RECENT_ID } from "@/lib/constants"
import { MOCK_DEMO_MESSAGES, CHAT_SUGGESTION_CARDS } from "@/lib/mock-data"
import type { DemoMessage } from "@/lib/mock-data"
import { useAppContext } from "@/lib/contexts/app-context"
import { useChatContext } from "@/lib/contexts/chat-context"
import { useCurrentConversation } from "@/lib/contexts/current-conversation-context"
import { parseHighlightedContent } from "@/lib/parse-highlights"
import type { Workspace, Project } from "@/lib/types"
import { cn } from "@/lib/utils"
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
    sendMessage,
    loadConversation,
    inputValue,
    setInputValue,
    pendingMessage,
    clearPendingMessage,
    isStreaming,
    conversationIds,
  } = useChatContext()
  const { setConversationId } = useCurrentConversation()

  const chatKey =
    currentWorkspace && currentProject
      ? `${currentWorkspace.id}-${currentProject.id}`
      : activeItem.startsWith("recent-") || activeItem.startsWith("convo-")
        ? activeItem
        : "default"
  const chatMessages = messagesByKey[chatKey] || []
  const isDemoChat = activeItem === DEMO_RECENT_ID
  const messagesToShow = isDemoChat ? MOCK_DEMO_MESSAGES : chatMessages
  const currentConvoId = conversationIds[chatKey] ?? (chatKey.startsWith("convo-") ? chatKey.replace("convo-", "") : null)
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
    if (currentConvoId && chatMessages.length > 2) {
      fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: currentConvoId }),
      })
        .then((r) => r.json())
        .then((data: { suggestions?: string[] }) => data.suggestions?.length && setSuggestions(data.suggestions))
        .catch(() => {})
    }
  }, [currentConvoId, chatMessages.length])

  const handleSendChatMessage = () => {
    if (!inputValue.trim()) return
    if (isDemoChat) return
    sendMessage(chatKey, inputValue.trim())
    setInputValue("")
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
            const demoMsg = msg as DemoMessage
            if (demoMsg.type === "taskCard") {
              return (
                <div key={demoMsg.id ?? i} className="flex gap-2.5">
                  <ChatAvatar role="assistant" initial="E" size="md" />
                  <div className="rounded-lg px-3 py-2 max-w-[85%] text-sm bg-card border border-border flex items-start gap-2.5">
                    <div className={cn("w-5 h-5 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center", demoMsg.taskStatus === "complete" ? "bg-orange-100" : "bg-primary/10")}>
                      <Check className={cn("w-3 h-3", demoMsg.taskStatus === "complete" ? "text-orange-600" : "text-primary")} />
                    </div>
                    <span className="flex-1 text-foreground leading-relaxed">{demoMsg.taskText}</span>
                    <button type="button" className="p-0 bg-transparent border-none cursor-pointer mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors">
                      <Bookmark className={cn("w-4 h-4", demoMsg.bookmarked && "fill-primary text-primary")} />
                    </button>
                  </div>
                </div>
              )
            }
            if (demoMsg.type === "feedback") {
              return (
                <div key={demoMsg.id ?? i} className="flex gap-2.5">
                  <ChatAvatar role="assistant" initial="E" size="md" />
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <ChatBubble role="assistant" size="md">
                      {demoMsg.content}
                    </ChatBubble>
                    <div className="flex gap-2">
                      <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition-colors cursor-pointer">
                        <Check className="w-3 h-3" /> Looks good
                      </button>
                      <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground text-xs font-medium hover:bg-muted transition-colors cursor-pointer">
                        <Edit3 className="w-3 h-3" /> Adjust
                      </button>
                    </div>
                  </div>
                </div>
              )
            }
            const isUser = msg.role === "user"
            return (
              <div
                key={demoMsg.id ?? i}
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
                  {!isUser && demoMsg.extraction && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100 text-xs text-orange-700 font-medium w-fit">
                      <Check className="w-3 h-3 text-orange-500" /> <span className="text-orange-600 font-normal">Captured:</span> {demoMsg.extraction.value}
                    </div>
                  )}
                  {isUser && (msg.extractions?.length ? (
                    <div className="flex gap-1 flex-wrap justify-end">
                      {msg.extractions.map((e, j) => (
                        <span key={j} className="text-[10px] text-primary bg-primary/5 rounded px-1.5 py-0.5 font-medium border border-primary/10">
                          ↗ {e.text}
                        </span>
                      ))}
                    </div>
                  ) : (demoMsg as DemoMessage).sources?.length ? (
                    <div className="flex gap-1 flex-wrap justify-end">
                      {(demoMsg as DemoMessage).sources!.map((s, j) => (
                        <span key={j} className="text-[10px] text-primary bg-primary/5 rounded px-1.5 py-0.5 font-medium border border-primary/10">
                          ↗ {s.text}
                        </span>
                      ))}
                    </div>
                  ) : null)}
                </div>
              </div>
            )
          })
        )}
      </div>
      <div className="shrink-0 flex flex-col gap-1.5 pt-1.5 border-t border-border -mx-6 px-6">
        {isStreaming && (
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
          <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
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
            disabled={!inputValue.trim() || isStreaming}
            className="shrink-0 rounded-md p-2 bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="h-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
