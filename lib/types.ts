// Navigation & routing
export type ViewId =
  | "new-chat"
  | "search"
  | "workspace"
  | "files"
  | "discover"
  | "playbook"
  | "cart"
  | "settings"
  | "community"
  | "customize"
  | "landing"

// Domain entities
export interface Workspace {
  id: string
  name: string
}

export interface Project {
  id: string
  name: string
}

export interface Assistant {
  id: string
  name: string
  tagline: string
  tone?: string
  focus?: string[]
}

export interface RecentItem {
  id: string
  label: string
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  extractions?: { text: string; field: string; confidence: number }[]
}

export interface FileItem {
  id: string
  title: string
  desc: string
  type: string
  tags: string[]
  time: string
}

// Preference types (for right sidebar + discover page)
export type PreferenceStatus = "confirmed" | "potential" | "inferred"

export interface Preference {
  id: string
  label: string
  type?: string
  confidence: number
  status: PreferenceStatus
  connections: string[]
  suggestions: { text: string; type: string }[]
}
