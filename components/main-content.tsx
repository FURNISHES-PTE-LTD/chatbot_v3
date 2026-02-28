"use client"

import { cn } from "@/lib/utils"
import {
  Star,
  Share2,
  Search,
  Package,
  BookmarkCheck,
  LayoutGrid,
  Palette,
  DollarSign,
  CheckCircle,
  FileText,
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
} from "lucide-react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export type AssistantStyleFocus = "creative" | "minimal" | "practical"

export interface AssistantOption {
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
  recents?: { id: string; label: string }[]
  onItemClick?: (id: string, label: string) => void
  workspaceListKey?: number
  currentWorkspace?: { id: string; name: string } | null
  currentProject?: { id: string; name: string } | null
  onSelectWorkspaceProject?: (workspace: { id: string; name: string }, project: { id: string; name: string }) => void
  onClearWorkspaceProject?: () => void
  showAssistantPicker?: boolean
  onSelectAssistant?: (assistant: { id: string; name: string; tagline: string }) => void
  onCloseAssistantPicker?: () => void
  selectedAssistant?: { id: string; name: string; tagline: string }
}

type ChatMessage = { role: "user" | "assistant"; content: string }

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

const MOCK_WORKSPACES = [
  { id: "ws-1", name: "Home Renovation" },
  { id: "ws-2", name: "Office Design" },
  { id: "ws-3", name: "Client Projects" },
]

const MOCK_PROJECTS_BY_WORKSPACE: Record<string, { id: string; name: string }[]> = {
  "ws-1": [
    { id: "proj-1a", name: "Living Room" },
    { id: "proj-1b", name: "Kitchen & Dining" },
    { id: "proj-1c", name: "Master Bedroom" },
  ],
  "ws-2": [
    { id: "proj-2a", name: "Reception Area" },
    { id: "proj-2b", name: "Conference Rooms" },
  ],
  "ws-3": [
    { id: "proj-3a", name: "Boutique Store" },
    { id: "proj-3b", name: "Restaurant Fit-out" },
  ],
}

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
}: MainContentProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({})
  const [chatMessagesByKey, setChatMessagesByKey] = useState<Record<string, ChatMessage[]>>({})
  const [chatInputValue, setChatInputValue] = useState("")
  const [selectedWorkspaceForView, setSelectedWorkspaceForView] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    setSelectedWorkspaceForView(null)
  }, [workspaceListKey])

  const chatKey =
    currentWorkspace && currentProject
      ? `${currentWorkspace.id}-${currentProject.id}`
      : activeItem.startsWith("recent-")
        ? activeItem
        : "default"
  const chatMessages = chatMessagesByKey[chatKey] || []
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
    }, 400)
  }

  const chatSuggestionCards = [
    {
      id: "living-room",
      title: "Living Room",
      description: "Redesign your main gathering space.",
      icon: Home,
    },
    {
      id: "home-office",
      title: "Home Office",
      description: "Create a focused, productive workspace.",
      icon: Briefcase,
    },
    {
      id: "bedroom",
      title: "Bedroom",
      description: "Design a calm retreat for rest.",
      icon: Moon,
    },
    {
      id: "open-plan",
      title: "Open Plan",
      description: "Combine living, dining, kitchen.",
      icon: Sun,
    },
  ]

  const handleSuggestionClick = (card: (typeof chatSuggestionCards)[0]) => {
    const key = chatKey
    const userMsg: ChatMessage = { role: "user", content: `I'd like help with ${card.title}. ${card.description}` }
    setChatMessagesByKey((prev) => ({ ...prev, [key]: [...(prev[key] || []), userMsg] }))
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: `Great choice! Let's work on your ${card.title.toLowerCase()}. Tell me more about your space, style preferences, or any specific challenges you're facing.`,
      }
      setChatMessagesByKey((prev) => ({ ...prev, [key]: [...(prev[key] || []), assistantMsg] }))
    }, 400)
  }

  const roomOptions = [
    { id: "living", label: "Living Room", icon: Sofa },
    { id: "dining", label: "Dining Room", icon: Utensils },
    { id: "bedroom", label: "Bedroom", icon: Bed },
    { id: "office", label: "Office", icon: Lamp },
    { id: "kitchen", label: "Kitchen", icon: Utensils },
    { id: "bathroom", label: "Bathroom", icon: Bath },
    { id: "nursery", label: "Nursery", icon: Home },
    { id: "reading", label: "Reading Room", icon: Armchair },
  ]

  const getActiveIcon = () => {
    const iconMap: Record<string, any> = {
      "new-chat": MessageSquarePlus,
      search: Search,
      files: FolderOpen,
      workspace: LayoutDashboard,
      explore: Package,
      "explore-trending": Package,
      "explore-collections": Package,
      "explore-others": Package,
      "saved-plans": BookmarkCheck,
      "room-planner": LayoutGrid,
      style: Palette,
      budget: DollarSign,
      validate: CheckCircle,
      "room-report": FileText,
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
          : iconMap[activeItem] || BookmarkCheck
    return <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
  }

  const getBreadcrumbText = () => {
    if (currentWorkspace && currentProject) {
      return `${currentWorkspace.name} / ${currentProject.name}`
    }
    if (activeItem === "explore-trending") return "Explore / Trending"
    if (activeItem === "explore-collections") return "Explore / Collections"
    if (activeItem === "explore-others") return "Explore / Others"
    if (activeItem.startsWith("recent-") && recents.length > 0) {
      const found = recents.find((r) => r.id === activeItem)
      if (found) return found.label
    }
    if (activeItem === "new-chat") return "+ New Chat"
    if (activeItem === "workspace") return "Workspace"

    // Convert kebab-case to Title Case
    return activeItem
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const handleRoomToggle = (roomId: string) => {
    if (selectedRooms.includes(roomId)) {
      setSelectedRooms(selectedRooms.filter((id) => id !== roomId))
      const newCounts = { ...roomCounts }
      delete newCounts[roomId]
      setRoomCounts(newCounts)
    } else {
      setSelectedRooms([...selectedRooms, roomId])
      setRoomCounts({ ...roomCounts, [roomId]: 1 })
    }
  }

  const handleRoomCountChange = (roomId: string, delta: number) => {
    const currentCount = roomCounts[roomId] || 1
    const newCount = Math.max(1, currentCount + delta)
    setRoomCounts({ ...roomCounts, [roomId]: newCount })
  }

  const renderChatView = (title: string) => (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {chatMessages.length === 0 ? (
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
                {chatSuggestionCards.map((card) => {
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
          chatMessages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2.5",
                msg.role === "user" ? "flex-row-reverse" : "",
              )}
            >
              <Avatar
                className={cn(
                  "h-7 w-7 shrink-0",
                  msg.role === "user" ? "bg-accent" : "bg-primary",
                )}
              >
                <AvatarFallback className={msg.role === "user" ? "bg-accent text-accent-foreground text-[10px]" : "bg-primary text-primary-foreground text-[10px]"}>
                  {msg.role === "user" ? "U" : "E"}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "rounded-lg px-3 py-2 max-w-[85%] text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="shrink-0 flex flex-col gap-3 mt-16">
        <div className="flex flex-wrap gap-2">
          {[
            "Show me a mood image",
            "Generate a floorplan",
            "Suggest a color palette",
          ].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setChatInputValue(label)}
              className="rounded-full border border-border bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent/15 hover:text-primary cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 transition-all duration-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
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
        const projects = MOCK_PROJECTS_BY_WORKSPACE[selectedWorkspaceForView.id] || []
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
                        <AvatarFallback className={msg.role === "user" ? "bg-accent text-accent-foreground text-[9px]" : "bg-primary text-primary-foreground text-[9px]"}>
                          {msg.role === "user" ? "U" : "E"}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn("rounded-lg px-2.5 py-1.5 max-w-[85%] text-xs", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
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
            {MOCK_WORKSPACES.map((workspace) => (
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
      return (
        <div>
          <h1 className="text-base font-semibold text-foreground mb-4">Files</h1>
          <p className="mb-4 text-xs text-muted-foreground">Your project files and uploads</p>
          <div className="space-y-2">
            <div className="rounded border border-border bg-card p-4 flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">No files yet</p>
                <p className="text-xs text-muted-foreground">Upload floor plans, images, or documents to get started.</p>
              </div>
            </div>
          </div>
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

    if (activeItem === "explore-trending" || activeItem === "explore-collections" || activeItem === "explore-others") {
      return (
        <div>
          <h1 className="text-base font-semibold text-foreground">{getBreadcrumbText()}</h1>
          <p className="mb-4 text-xs text-muted-foreground">Browse curated collections</p>
          <div className="grid gap-3 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded border border-border bg-card p-3">
                <div className="mb-2 h-32 rounded bg-secondary/30" />
                <h4 className="text-xs font-medium">Product {i}</h4>
                <p className="text-[10px] text-muted-foreground">$299.00</p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    switch (activeItem) {
      case "saved-plans":
        return (
          <div className="rounded border border-border bg-card p-4">
            <h1 className="text-base font-semibold text-foreground">Saved Plans</h1>
            <p className="mb-4 text-xs text-muted-foreground">View and manage your saved design plans</p>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { name: "Living Room Modern", date: "Dec 15, 2024", status: "In Progress" },
                { name: "Bedroom Retreat", date: "Dec 10, 2024", status: "Completed" },
                { name: "Office Workspace", date: "Dec 5, 2024", status: "Draft" },
              ].map((plan) => (
                <div key={plan.name} className="rounded border border-border bg-background p-4">
                  <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-[10px] text-muted-foreground">{plan.date}</p>
                  <span className="mt-2 inline-block rounded bg-secondary px-2 py-0.5 text-[10px] font-medium">
                    {plan.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )

      case "explore":
        return (
          <div>
            <h1 className="text-base font-semibold text-foreground">Explore</h1>
            <p className="mb-4 text-xs text-muted-foreground">Browse products and curated room kits</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {["Living Room", "Bedroom", "Kitchen", "Office", "Bathroom"].map((room) => (
                <button
                  key={room}
                  className="rounded bg-secondary/50 px-3 py-1.5 text-xs transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
                >
                  {room}
                </button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded border border-border bg-card p-3">
                  <div className="mb-2 h-32 rounded bg-secondary/30" />
                  <h4 className="text-xs font-medium">Product {i}</h4>
                  <p className="text-[10px] text-muted-foreground">$299.00</p>
                </div>
              ))}
            </div>
          </div>
        )

      case "style":
        return (
          <div>
            <h1 className="text-base font-semibold text-foreground">Style</h1>
            <p className="mb-4 text-xs text-muted-foreground">Capture your design preferences</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">Choose Your Approach</h3>
                <div className="space-y-2">
                  <button className="w-full rounded border border-primary bg-primary/10 p-3 text-left transition-all duration-300 hover:bg-primary/20">
                    <p className="text-xs font-medium text-primary">Known Style</p>
                    <p className="text-[10px] text-muted-foreground">I know what I like</p>
                  </button>
                  <button className="w-full rounded border border-border p-3 text-left transition-all duration-300 hover:bg-secondary/30">
                    <p className="text-xs font-medium">Discovery Mode</p>
                    <p className="text-[10px] text-muted-foreground">Help me find my style</p>
                  </button>
                </div>
              </div>
              <div className="rounded border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">Style Library</h3>
                <div className="grid grid-cols-2 gap-2">
                  {["Modern", "Traditional", "Scandinavian", "Industrial", "Minimalist", "Bohemian"].map((style) => (
                    <button
                      key={style}
                      className="rounded bg-secondary/50 p-2 text-xs transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "budget":
        return (
          <div>
            <h1 className="text-base font-semibold text-foreground">Budget</h1>
            <p className="mb-4 text-xs text-muted-foreground">Set your spending target and allocation</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">Total Budget</h3>
                <input
                  type="number"
                  placeholder="Enter amount"
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                />
                <div className="mt-3 space-y-2">
                  <p className="text-[10px] text-muted-foreground">Budget Strictness</p>
                  {["Hard Cap", "Soft Cap", "Explore First"].map((option) => (
                    <button
                      key={option}
                      className="block w-full rounded border border-primary bg-primary/10 p-3 text-left transition-all duration-300 hover:bg-primary/20"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">Category Priority</h3>
                <div className="space-y-2">
                  {["Seating & Sofa", "Storage & Media", "Lighting", "Decor & Styling"].map((category) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-xs">{category}</span>
                      <span className="text-[10px] text-muted-foreground">25%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "room-planner":
        return (
          <div>
            <h1 className="text-base font-semibold text-foreground">Room Planner</h1>
            <p className="mb-4 text-xs text-muted-foreground">Design and arrange your space</p>
            <div className="rounded border border-border bg-card p-4">
              <div className="mb-4 h-96 rounded bg-secondary/20 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Interactive Room Canvas</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {["Sofa", "Chair", "Table", "Lamp", "Rug", "Shelf", "Desk", "Bed"].map((item) => (
                  <button
                    key={item}
                    className="rounded bg-secondary/50 p-2 text-xs transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case "validate":
        return (
          <div>
            <h1 className="text-base font-semibold text-foreground">Validate</h1>
            <p className="mb-4 text-xs text-muted-foreground">Check your design decisions</p>
            <div className="space-y-3">
              {[
                { title: "Space Clearance", status: "pass", message: "All furniture has adequate clearance" },
                { title: "Budget Check", status: "warning", message: "Slightly over budget in seating category" },
                { title: "Delivery Timeline", status: "pass", message: "All items available for delivery" },
                { title: "Style Consistency", status: "pass", message: "Design follows selected style guidelines" },
              ].map((check) => (
                <div key={check.title} className="rounded border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium">{check.title}</h4>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-medium",
                        check.status === "pass" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent",
                      )}
                    >
                      {check.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{check.message}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case "room-report":
        return (
          <div>
            <h1 className="text-base font-semibold text-foreground">Room Report</h1>
            <p className="mb-4 text-xs text-muted-foreground">Summary of your design plan</p>
            <div className="rounded border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold">Design Summary</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Selected Style</p>
                  <p className="text-xs font-medium">Modern Minimalist</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total Budget</p>
                  <p className="text-xs font-medium">$5,000</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Items Placed</p>
                  <p className="text-xs font-medium">12 furniture pieces</p>
                </div>
                <button className="mt-4 w-full rounded bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90">
                  Download Report
                </button>
              </div>
            </div>
          </div>
        )

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
                      className="rounded bg-secondary/50 px-3 py-1.5 text-xs transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
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
                    <button className="w-11 h-6 rounded-full bg-muted relative transition-colors hover:bg-muted/80 cursor-pointer">
                      <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-background transition-transform" />
                    </button>
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
                    <button className="w-11 h-6 rounded-full bg-primary relative transition-colors hover:bg-primary/90 cursor-pointer">
                      <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition-transform" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Push notifications</p>
                      <p className="text-xs text-muted-foreground">Browser push notifications</p>
                    </div>
                    <button className="w-11 h-6 rounded-full bg-primary relative transition-colors hover:bg-primary/90 cursor-pointer">
                      <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition-transform" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Project updates</p>
                      <p className="text-xs text-muted-foreground">Get notified about project changes</p>
                    </div>
                    <button className="w-11 h-6 rounded-full bg-primary relative transition-colors hover:bg-primary/90 cursor-pointer">
                      <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition-transform" />
                    </button>
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
                    <button className="w-11 h-6 rounded-full bg-primary relative transition-colors hover:bg-primary/90 cursor-pointer">
                      <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition-transform" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Voice responses</p>
                      <p className="text-xs text-muted-foreground">Enable voice assistant</p>
                    </div>
                    <button className="w-11 h-6 rounded-full bg-muted relative transition-colors hover:bg-muted/80 cursor-pointer">
                      <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-background transition-transform" />
                    </button>
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
                    <button className="w-11 h-6 rounded-full bg-primary relative transition-colors hover:bg-primary/90 cursor-pointer">
                      <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition-transform" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Auto-save projects</p>
                      <p className="text-xs text-muted-foreground">Automatically save your work</p>
                    </div>
                    <button className="w-11 h-6 rounded-full bg-primary relative transition-colors hover:bg-primary/90 cursor-pointer">
                      <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition-transform" />
                    </button>
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
      <main className="flex-1 overflow-y-auto bg-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <p className="text-sm text-muted-foreground mb-4 max-w-xl">
          Each assistant has a different style and focus. Use the filters below to narrow your choice—more creative,
          more minimal, or more practical.
        </p>

        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Style
            </span>
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
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Traits
            </span>
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
                onClick={() => setIsSaved(!isSaved)}
                className="flex items-center justify-center h-7 w-7 rounded hover:bg-accent/10 text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
                title={isSaved ? "Unsave" : "Save"}
              >
                <Star className={cn("h-3.5 w-3.5", isSaved && "fill-current text-primary")} />
              </button>
              <button
                className="flex items-center justify-center h-7 w-7 rounded hover:bg-accent/10 text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
                title="Share"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <main className="flex-1 overflow-y-auto bg-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderContent()}
          </main>
        </>
      )}
    </div>
  )
}
