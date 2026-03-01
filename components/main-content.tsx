"use client"

import React from "react"
import { DEMO_RECENT_ID, AI_RESPONSE_DELAY_MS } from "@/lib/constants"
import { MOCK_DEMO_MESSAGES, CHAT_SUGGESTION_CARDS, MOCK_WORKSPACES, MOCK_PROJECTS_BY_WORKSPACE } from "@/lib/mock-data"
import type { ChatMessage, Workspace, Project, Assistant, RecentItem } from "@/lib/types"
import type { DemoMessage } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import {
  Star,
  Share2,
  Search,
  Package,
  FolderOpen,
  Paperclip,
  MessageSquarePlus,
  Send,
  ShoppingCart,
  Clock,
  TrendingUp,
  Sofa,
  Bed,
  Utensils,
  Lamp,
  Bath,
  Armchair,
  Home,
  Briefcase,
  Moon,
  Sun,
  LayoutDashboard,
  ChevronLeft,
  Sparkles,
  Check,
  Bookmark,
  Edit3,
  GitBranch,
  Lightbulb,
} from "lucide-react"
import { FilesView } from "./files-view"
import { DiscoverView } from "./discover-view"
import { PlaybookView } from "./playbook-view"
import { useState, useEffect } from "react"
import { SectionLabel } from "@/components/shared/section-label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type AssistantStyleFocus = "creative" | "minimal" | "practical"

interface AssistantOption {
  id: string
  name: string
  tagline: string
  description: string
  traits: string[]
  tone: string
  styleFocus: AssistantStyleFocus
}

interface MainContentProps {
  activeItem: string
  recents?: RecentItem[]
  onItemClick?: (id: string, label: string) => void
  workspaceListKey?: number
  currentWorkspace?: Workspace | null
  currentProject?: Project | null
  onSelectWorkspaceProject?: (workspace: Workspace, project: Project) => void
  onClearWorkspaceProject?: () => void
  showAssistantPicker?: boolean
  onSelectAssistant?: (assistant: Assistant) => void
  selectedAssistant?: Assistant
  /** When user clicks "Edit in chat" from Files view, switch to chat and pre-fill this message. */
  pendingChatMessage?: string | null
  onClearPendingChatMessage?: () => void
  /** Called from Files view when user clicks "Edit in chat"; parent should switch to chat and set pendingChatMessage. */
  onEditInChatFromFiles?: (title: string) => void
  /** Called from Discover view when user clicks a suggestion or "explore next"; parent should switch to chat and set pendingChatMessage. */
  onSendToChatFromDiscover?: (text: string) => void
}

function parseHighlightedContent(text: string) {
  const parts = text.split(/(<hl>.*?<\/hl>)/g)
  return parts.map((p, i) =>
    p.startsWith("<hl>") ? (
      <span key={i} className="bg-primary/15 text-primary px-1 py-0.5 rounded font-semibold text-sm">
        {p.replace(/<\/?hl>/g, "")}
      </span>
    ) : (
      <span key={i}>{p}</span>
    )
  )
}

const MOCK_ASSISTANTS: AssistantOption[] = [
  {
    id: "eva",
    name: "Eva",
    tagline: "[the Assistant]",
    description: "Warm and methodical. Great at breaking down design decisions and keeping your project on track.",
    traits: ["Organized", "Detail-oriented", "Encouraging"],
    tone: "Friendly and professional",
    styleFocus: "practical",
  },
  {
    id: "alex",
    name: "Alex",
    tagline: "[the Minimalist]",
    description: "Clean lines, fewer choices. Focuses on simplicity and intentional design without the fluff.",
    traits: ["Direct", "Minimal", "Technical"],
    tone: "Calm and concise",
    styleFocus: "minimal",
  },
  {
    id: "sam",
    name: "Sam",
    tagline: "[the Creative]",
    description: "Bold ideas and unexpected combinations. Pushes you to try new styles and take design risks.",
    traits: ["Creative", "Bold", "Experimental"],
    tone: "Playful and inspiring",
    styleFocus: "creative",
  },
  {
    id: "maya",
    name: "Maya",
    tagline: "[the Consultant]",
    description: "Budget and timeline first. Helps you prioritize and get the most value from your space.",
    traits: ["Pragmatic", "Budget-savvy", "Strategic"],
    tone: "Confident and practical",
    styleFocus: "practical",
  },
  {
    id: "rio",
    name: "Rio",
    tagline: "[the Curator]",
    description: "Deep knowledge of trends and brands. Surfaces the right pieces and stories for your taste.",
    traits: ["Knowledgeable", "Trend-aware", "Storyteller"],
    tone: "Warm and informative",
    styleFocus: "practical",
  },
]

const ASSISTANT_STYLE_OPTIONS: { value: AssistantStyleFocus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "creative", label: "Creative" },
  { value: "minimal", label: "Minimal" },
  { value: "practical", label: "Practical" },
]

const ALL_TRAITS = Array.from(
  new Set(MOCK_ASSISTANTS.flatMap((a) => a.traits)),
).sort()

const chatSuggestionCardsWithIcons = CHAT_SUGGESTION_CARDS.map((card) => ({
  ...card,
  icon: card.id === "living-room" ? Home : card.id === "home-office" ? Briefcase : card.id === "bedroom" ? Moon : Sun,
}))

export function MainContent({
  activeItem,
  recents = [],
  onItemClick,
  workspaceListKey = 0,
  currentWorkspace = null,
  currentProject = null,
  onSelectWorkspaceProject,
  onClearWorkspaceProject,
  showAssistantPicker = false,
  onSelectAssistant,
  selectedAssistant,
  pendingChatMessage = null,
  onClearPendingChatMessage,
  onEditInChatFromFiles,
  onSendToChatFromDiscover,
}: MainContentProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [chatMessagesByKey, setChatMessagesByKey] = useState<Record<string, ChatMessage[]>>({})
  const [chatInputValue, setChatInputValue] = useState("")
  const [selectedWorkspaceForView, setSelectedWorkspaceForView] = useState<Workspace | null>(null)

  useEffect(() => {
    setSelectedWorkspaceForView(null)
  }, [workspaceListKey])

  // When switching to chat with a pending message (e.g. from "Edit in chat" in Files view), pre-fill input
  const isChatViewForPending = activeItem === "new-chat" || activeItem.startsWith("recent-")
  useEffect(() => {
    if (isChatViewForPending && pendingChatMessage && onClearPendingChatMessage) {
      setChatInputValue(pendingChatMessage)
      onClearPendingChatMessage()
    }
  }, [pendingChatMessage, isChatViewForPending, onClearPendingChatMessage])

  const chatKey =
    currentWorkspace && currentProject
      ? `${currentWorkspace.id}-${currentProject.id}`
      : activeItem.startsWith("recent-")
        ? activeItem
        : "default"
  const chatMessages = chatMessagesByKey[chatKey] || []
  const isDemoChat = activeItem === DEMO_RECENT_ID
  const messagesToShow: (ChatMessage | DemoMessage)[] = isDemoChat ? MOCK_DEMO_MESSAGES : chatMessages
  const [assistantPickerStyleFilter, setAssistantPickerStyleFilter] = useState<AssistantStyleFocus | "">("")
  const [assistantPickerTraits, setAssistantPickerTraits] = useState<string[]>([])

  const isChatView = activeItem === "new-chat" || activeItem.startsWith("recent-")

  const filteredAssistants = MOCK_ASSISTANTS.filter((a) => {
    if (assistantPickerStyleFilter && a.styleFocus !== assistantPickerStyleFilter) return false
    if (assistantPickerTraits.length > 0) {
      const hasTrait = assistantPickerTraits.some((t) => a.traits.includes(t))
      if (!hasTrait) return false
    }
    return true
  })

  const toggleAssistantTrait = (trait: string) => {
    setAssistantPickerTraits((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait],
    )
  }

  const handleSendChatMessage = () => {
    if (!chatInputValue.trim()) return
    if (isDemoChat) return
    const key = chatKey
    const userMsg: ChatMessage = { role: "user", content: chatInputValue.trim() }
    setChatMessagesByKey((prev) => ({ ...prev, [key]: [...(prev[key] || []), userMsg] }))
    setChatInputValue("")
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: "Thanks for your message. How can I help with your design or furniture choices today?",
      }
      setChatMessagesByKey((prev) => ({ ...prev, [key]: [...(prev[key] || []), assistantMsg] }))
    }, AI_RESPONSE_DELAY_MS)
  }

  const handleSuggestionClick = (card: (typeof chatSuggestionCardsWithIcons)[0]) => {
    const key = chatKey
    const userMsg: ChatMessage = { role: "user", content: `I'd like help with ${card.title}. ${card.description}` }
    setChatMessagesByKey((prev) => ({ ...prev, [key]: [...(prev[key] || []), userMsg] }))
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: `Great choice! Let's work on your ${card.title.toLowerCase()}. Tell me more about your space, style preferences, or any specific challenges you're facing.`,
      }
      setChatMessagesByKey((prev) => ({ ...prev, [key]: [...(prev[key] || []), assistantMsg] }))
    }, AI_RESPONSE_DELAY_MS)
  }

  const getActiveIcon = () => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      "new-chat": MessageSquarePlus,
      search: Search,
      files: FolderOpen,
      discover: Sparkles,
      playbook: GitBranch,
      workspace: LayoutDashboard,
      cart: ShoppingCart,
      project: Home,
      community: TrendingUp,
      customize: Armchair,
      settings: Star,
    }
    const IconComponent =
      currentWorkspace && currentProject
        ? LayoutDashboard
        : activeItem.startsWith("recent-")
          ? Clock
          : iconMap[activeItem] || Package
    return <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
  }

  const getBreadcrumbText = () => {
    if (currentWorkspace && currentProject) {
      return `${currentWorkspace.name} / ${currentProject.name}`
    }
    if (activeItem.startsWith("recent-") && recents.length > 0) {
      const found = recents.find((r) => r.id === activeItem)
      if (found) return found.label
    }
    if (activeItem === "new-chat") return "+ New Chat"
    if (activeItem === "workspace") return "Workspace"
    if (activeItem === "playbook") return "Playbook"

    // Convert kebab-case to Title Case
    return activeItem
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const renderChatView = (title: string) => (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {messagesToShow.length === 0 ? (
          activeItem === "new-chat" || activeItem.startsWith("recent-") ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 text-center">
              <Avatar className="h-14 w-14 bg-primary mb-4">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">E</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-foreground mb-2">How can I help you today?</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Tell me about your space and I'll organize your ideas into a design brief.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                {chatSuggestionCardsWithIcons.map((card) => {
                  const Icon = card.icon
                  return (
                    <button
                      key={card.id}
                      type="button"
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
                  <Avatar className="h-7 w-7 shrink-0 bg-primary">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">E</AvatarFallback>
                  </Avatar>
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
                  <Avatar className="h-7 w-7 shrink-0 bg-primary">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">E</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <div className="rounded-lg border border-border px-3 py-2 text-sm bg-muted text-foreground">
                      {demoMsg.content}
                    </div>
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
                <Avatar
                  className={cn(
                    "h-7 w-7 shrink-0",
                    isUser ? "bg-accent" : "bg-primary",
                  )}
                >
                  <AvatarFallback className={isUser ? "bg-accent text-accent-foreground text-[10px]" : "bg-primary text-primary-foreground text-[10px]"}>
                    {isUser ? "U" : "E"}
                  </AvatarFallback>
                </Avatar>
                <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      isUser
                        ? "rounded-lg border border-border bg-muted/30 text-foreground/80 max-w-[85%] w-fit min-w-[10rem]"
                        : "rounded-lg border border-border bg-muted/30 text-foreground/80 max-w-[85%]",
                    )}
                  >
                    {isUser ? msg.content : parseHighlightedContent(msg.content)}
                  </div>
                  {!isUser && demoMsg.extraction && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100 text-xs text-orange-700 font-medium w-fit">
                      <Check className="w-3 h-3 text-orange-500" /> <span className="text-orange-600 font-normal">Captured:</span> {demoMsg.extraction.value}
                    </div>
                  )}
                  {isUser && demoMsg.sources && demoMsg.sources.length > 0 && (
                    <div className="flex gap-1 flex-wrap justify-end">
                      {demoMsg.sources.map((s, j) => (
                        <span key={j} className="text-[10px] text-primary bg-primary/5 rounded px-1.5 py-0.5 font-medium border border-primary/10">
                          ↗ {s.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
      <div className="shrink-0 flex flex-col gap-1.5 pt-1.5 border-t border-border -mx-6 px-6">
        <p className="text-xs font-medium flex items-center gap-2">
          <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-primary">Quick suggestions</span>
          <span className="text-foreground">for your project:</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "Mood image",
            "Floorplan",
            "Color palette",
            "Cozy living room",
            "Small bedroom",
            "Minimalist tips",
            "Lighting ideas",
          ].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setChatInputValue(label)}
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
            value={chatInputValue}
            onChange={(e) => setChatInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChatMessage()}
            className="min-h-7 min-w-0 flex-1 border-0 bg-transparent shadow-none rounded-none px-2 text-sm text-muted-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-transparent dark:bg-transparent dark:text-muted-foreground"
          />
          <button
            type="button"
            onClick={handleSendChatMessage}
            disabled={!chatInputValue.trim()}
            className="shrink-0 rounded-md p-2 bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    if (isChatView) {
      return renderChatView(getBreadcrumbText())
    }

    if (activeItem === "workspace") {
      if (selectedWorkspaceForView) {
        const projects = MOCK_PROJECTS_BY_WORKSPACE[selectedWorkspaceForView.id] ?? []
        const projectChatKey =
          currentWorkspace?.id === selectedWorkspaceForView.id && currentProject
            ? `${selectedWorkspaceForView.id}-${currentProject.id}`
            : null
        const projectChatMessages = projectChatKey ? (chatMessagesByKey[projectChatKey] || []) : []
        const hasProjectSelected = Boolean(currentProject && currentWorkspace?.id === selectedWorkspaceForView.id)

        if (hasProjectSelected) {
          return (
            <div>
              <button
                type="button"
                onClick={() => onClearWorkspaceProject?.()}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to projects
              </button>
              <h2 className="text-sm font-semibold text-foreground mb-3">Chat history — {currentProject!.name}</h2>
              {projectChatMessages.length === 0 ? (
                <p className="text-xs text-muted-foreground">No messages yet. Open + New Chat to start a conversation in this project.</p>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-card p-3">
                  {projectChatMessages.map((msg, i) => (
                    <div key={i} className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "")}>
                      <Avatar className={cn("h-6 w-6 shrink-0", msg.role === "user" ? "bg-accent" : "bg-primary")}>
                        <AvatarFallback className={msg.role === "user" ? "bg-accent text-accent-foreground text-[10px]" : "bg-primary text-primary-foreground text-[10px]"}>
                          {msg.role === "user" ? "U" : "E"}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn("rounded-lg px-2.5 py-1.5 text-xs", msg.role === "user" ? "rounded-lg border border-border bg-muted/30 text-foreground/80 max-w-[85%] w-fit min-w-[10rem]" : "rounded-lg border border-border bg-muted/30 text-foreground/80 max-w-[85%]")}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        }

        return (
          <div>
            <button
              type="button"
              onClick={() => setSelectedWorkspaceForView(null)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to workspaces
            </button>
            <h1 className="text-base font-semibold text-foreground mb-1">{selectedWorkspaceForView.name}</h1>
            <p className="text-xs text-muted-foreground mb-4">Select a project to set as current</p>
            <div className="space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onSelectWorkspaceProject?.(selectedWorkspaceForView, project)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-all duration-200 cursor-pointer hover:border-primary/50 hover:bg-primary/5",
                    currentWorkspace?.id === selectedWorkspaceForView.id && currentProject?.id === project.id &&
                      "border-primary bg-primary/10",
                  )}
                >
                  <LayoutDashboard className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground">{project.name}</span>
                  {currentWorkspace?.id === selectedWorkspaceForView.id && currentProject?.id === project.id && (
                    <span className="ml-auto text-xs text-primary font-medium">Current</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )
      }
      return (
        <div>
          <h1 className="text-base font-semibold text-foreground mb-4">Workspace</h1>
          <p className="text-xs text-muted-foreground mb-4">Choose a workspace to view its projects. The selected workspace and project are shown in the bar above.</p>
          <div className="space-y-2">
            {MOCK_WORKSPACES.map((workspace: Workspace) => (
              <button
                key={workspace.id}
                type="button"
                onClick={() => {
                  onClearWorkspaceProject?.()
                  setSelectedWorkspaceForView(workspace)
                }}
                className="w-full flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-all duration-200 cursor-pointer hover:border-primary/50 hover:bg-primary/5"
              >
                <LayoutDashboard className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-foreground">{workspace.name}</span>
                <ChevronLeft className="h-4 w-4 ml-auto rotate-180 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (activeItem === "search") {
      return (
        <div>
          <h1 className="text-base font-semibold text-foreground mb-4">Search</h1>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for furniture, rooms, styles..."
                className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recent Searches
              </h3>
              <div className="space-y-2">
                {[
                  "Modern living room sofa",
                  "Scandinavian dining table",
                  "Minimalist bedroom set",
                  "Industrial office desk",
                ].map((search, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-4 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 text-sm text-foreground transition-all duration-200 cursor-pointer"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Trending Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Mid-century modern", "Velvet sofa", "Accent chairs", "Console table", "Area rugs"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all duration-200 cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (activeItem === "files") {
      return <FilesView onEditInChat={onEditInChatFromFiles} />
    }

    if (activeItem === "discover") {
      return <DiscoverView onSendToChat={onSendToChatFromDiscover} />
    }

    if (activeItem === "playbook") {
      return (
        <div className="flex flex-col h-full min-h-0 -m-6">
          <PlaybookView />
        </div>
      )
    }

    if (activeItem === "cart") {
      return (
        <div className="rounded border border-border bg-card p-4">
          <h1 className="text-base font-semibold text-foreground">Shopping Cart</h1>
          <p className="mb-4 text-xs text-muted-foreground">Review your selected items</p>
          <div className="space-y-3">
            <div className="rounded border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Your cart is empty</p>
            </div>
          </div>
        </div>
      )
    }

    switch (activeItem) {
      case "project":
        return (
          <div>
            <h1 className="text-base font-semibold text-foreground">Project</h1>
            <p className="mb-4 text-xs text-muted-foreground">Manage your design projects</p>
            <div className="rounded border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Your workspace for managing multiple design projects</p>
            </div>
          </div>
        )

      case "community":
        return (
          <div>
            <h1 className="text-base font-semibold text-foreground">Community</h1>
            <p className="mb-4 text-xs text-muted-foreground">Explore shared designs and templates</p>
            <div className="grid gap-3 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded border border-border bg-card p-3">
                  <div className="mb-2 h-32 rounded bg-secondary/30" />
                  <h4 className="text-xs font-medium">Shared Design {i}</h4>
                  <p className="text-[10px] text-muted-foreground">by Designer {i}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case "customize":
        return (
          <div>
            <h1 className="text-base font-semibold text-foreground">Customize</h1>
            <p className="mb-4 text-xs text-muted-foreground">Adjust your preferences and settings</p>
            <div className="space-y-3">
              <div className="rounded border border-border bg-card p-4">
                <h4 className="mb-2 text-xs font-medium">Measurement Units</h4>
                <div className="flex gap-2">
                  {["Metric", "Imperial"].map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      className="rounded bg-secondary/50 px-3 py-1.5 text-xs transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded border border-border bg-card p-4">
                <h4 className="mb-2 text-xs font-medium">Default Budget</h4>
                <input
                  type="number"
                  placeholder="Set default"
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        )

      case "settings":
        return (
          <div className="h-full overflow-y-auto p-6">
            <h1 className="text-xl font-semibold text-foreground mb-6">Settings</h1>

            <div className="max-w-3xl space-y-6">
              {/* Appearance Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Appearance</h3>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Theme</p>
                      <p className="text-xs text-muted-foreground">Choose your interface theme</p>
                    </div>
                    <select className="px-3 py-2 rounded-lg border border-border bg-background text-sm cursor-pointer">
                      <option>Light</option>
                      <option>Dark</option>
                      <option>System</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Compact mode</p>
                      <p className="text-xs text-muted-foreground">Reduce spacing for denser layouts</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              {/* Notifications Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Notifications</h3>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Email notifications</p>
                      <p className="text-xs text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Push notifications</p>
                      <p className="text-xs text-muted-foreground">Browser push notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Project updates</p>
                      <p className="text-xs text-muted-foreground">Get notified about project changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              {/* Assistant Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Assistant</h3>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Auto-suggestions</p>
                      <p className="text-xs text-muted-foreground">Get AI-powered recommendations</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Voice responses</p>
                      <p className="text-xs text-muted-foreground">Enable voice assistant</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Assistant character</p>
                      <p className="text-xs text-muted-foreground">Choose your AI assistant</p>
                    </div>
                    <select className="px-3 py-2 rounded-lg border border-border bg-background text-sm cursor-pointer">
                      <option>Eva</option>
                      <option>Alex</option>
                      <option>Sam</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Privacy & Security Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">
                  Privacy & Security
                </h3>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Analytics tracking</p>
                      <p className="text-xs text-muted-foreground">Help improve our service</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Auto-save projects</p>
                      <p className="text-xs text-muted-foreground">Automatically save your work</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div>
            <h1 className="text-base font-semibold text-foreground">Saved Plans</h1>
            <p className="text-xs text-muted-foreground">Select a section to get started</p>
          </div>
        )
    }
  }

  const renderAssistantPicker = () => (
    <div className="flex flex-col h-full">
      <div className="flex h-10 items-center px-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs font-medium text-foreground border-b-2 border-primary pb-0.5">
            Choose AI Assistant
          </span>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto bg-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <p className="text-sm text-muted-foreground mb-4 max-w-xl">
          Each assistant has a different style and focus. Use the filters below to narrow your choice—more creative,
          more minimal, or more practical.
        </p>

        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel>Style</SectionLabel>
            {ASSISTANT_STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value || "all"}
                type="button"
                onClick={() => setAssistantPickerStyleFilter(opt.value as AssistantStyleFocus | "")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer",
                  (opt.value === "" && !assistantPickerStyleFilter) || assistantPickerStyleFilter === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel>Traits</SectionLabel>
            {ALL_TRAITS.map((trait) => (
              <button
                key={trait}
                type="button"
                onClick={() => toggleAssistantTrait(trait)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 cursor-pointer",
                  assistantPickerTraits.includes(trait)
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent",
                )}
              >
                {trait}
              </button>
            ))}
          </div>
          {(assistantPickerStyleFilter || assistantPickerTraits.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setAssistantPickerStyleFilter("")
                setAssistantPickerTraits([])
              }}
              className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAssistants.length === 0 ? (
            <p className="col-span-full text-sm text-muted-foreground py-8 text-center">
              No assistants match the current filters. Try clearing some filters.
            </p>
          ) : (
            filteredAssistants.map((assistant) => (
            <button
              key={assistant.id}
              type="button"
              onClick={() => onSelectAssistant?.({ id: assistant.id, name: assistant.name, tagline: assistant.tagline })}
              className={cn(
                "flex flex-col items-start gap-3 rounded-lg border bg-card p-4 text-left transition-all duration-200 cursor-pointer",
                selectedAssistant?.id === assistant.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/50 hover:bg-primary/5",
              )}
            >
              <div className="flex w-full items-center gap-3">
                <Avatar className="h-10 w-10 bg-primary shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {assistant.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{assistant.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{assistant.tagline}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{assistant.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {assistant.traits.map((trait) => (
                  <span
                    key={trait}
                    className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/80"
                  >
                    {trait}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/80 italic">Tone: {assistant.tone}</p>
            </button>
            ))
          )}
        </div>
      </main>
    </div>
  )

  return (
    <div data-tutorial="main-content" className="h-full overflow-hidden flex flex-col">
      {showAssistantPicker ? (
        renderAssistantPicker()
      ) : (
        <>
          <div className="flex h-10 items-center justify-between px-3 border-b border-border">
            <div className="flex items-center gap-2">
              {activeItem === "workspace" && !selectedWorkspaceForView ? (
                <>
                  {getActiveIcon()}
                  <span className="text-xs text-muted-foreground">/</span>
                  <span className="text-xs font-medium text-foreground border-b-2 border-primary pb-0.5">
                    Workspace
                  </span>
                </>
              ) : currentWorkspace && currentProject ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWorkspaceForView(null)
                      onItemClick?.("workspace", "Workspace")
                    }}
                    className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                    title="All workspaces"
                  >
                    {getActiveIcon()}
                  </button>
                  <span className="text-xs text-muted-foreground">/</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWorkspaceForView(null)
                      onItemClick?.("workspace", "Workspace")
                    }}
                    className="text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                    title="Workspace"
                  >
                    Workspace
                  </button>
                  <span className="text-xs text-muted-foreground">/</span>
                  <button
                    type="button"
                    onClick={() => setSelectedWorkspaceForView(currentWorkspace)}
                    className="text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                    title={`${currentWorkspace.name} projects`}
                  >
                    {currentWorkspace.name}
                  </button>
                  <span className="text-xs text-muted-foreground">/</span>
                  <span className="text-xs font-medium text-foreground border-b-2 border-primary pb-0.5">
                    {currentProject.name}
                  </span>
                </>
              ) : activeItem === "workspace" && selectedWorkspaceForView ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkspaceForView(null)
                        onItemClick?.("workspace", "Workspace")
                      }}
                      className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                      title="All workspaces"
                    >
                      {getActiveIcon()}
                    </button>
                    <span className="text-xs text-muted-foreground">/</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkspaceForView(null)
                        onItemClick?.("workspace", "Workspace")
                      }}
                      className="text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                      title="Workspace"
                    >
                      Workspace
                    </button>
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-xs font-medium text-foreground border-b-2 border-primary pb-0.5">
                      {selectedWorkspaceForView.name}
                    </span>
                  </>
              ) : (
                <>
                  {getActiveIcon()}
                  <span className="text-xs text-muted-foreground">/</span>
                  <span className="text-xs font-medium text-foreground capitalize border-b-2 border-primary pb-0.5">
                    {getBreadcrumbText()}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSaved(!isSaved)}
                className="flex items-center justify-center h-7 w-7 rounded hover:bg-accent/10 text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
                title={isSaved ? "Unsave" : "Save"}
              >
                <Star className={cn("h-3.5 w-3.5", isSaved && "fill-current text-primary")} />
              </button>
              <button
                type="button"
                className="flex items-center justify-center h-7 w-7 rounded hover:bg-accent/10 text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
                title="Share"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <main className="flex-1 overflow-y-auto bg-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {renderContent()}
          </main>
        </>
      )}
    </div>
  )
}
