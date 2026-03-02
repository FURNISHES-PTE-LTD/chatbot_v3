import type { ViewId } from "@/lib/types"

// Navigation
export const VIEW_IDS: Record<string, ViewId> = {
  NEW_CHAT: "new-chat",
  SEARCH: "search",
  WORKSPACE: "workspace",
  FILES: "files",
  DISCOVER: "discover",
  PLAYBOOK: "playbook",
  CART: "cart",
  SETTINGS: "settings",
  COMMUNITY: "community",
  CUSTOMIZE: "customize",
  LANDING: "landing",
} as const

// Timing
export const TYPING_SPEED_MS = 90
export const AI_RESPONSE_DELAY_MS = 400
export const MOBILE_BREAKPOINT = 768

// Defaults
export const DEFAULT_WORKSPACE = { id: "ws-1", name: "Home Renovation" }
export const DEFAULT_PROJECT = { id: "proj-1a", name: "Living Room" }
export const DEFAULT_ASSISTANT = { id: "eva", name: "Eva", tagline: "[the Assistant]" }
