import type { ChatMessage } from "./types"
import type { Workspace, Project } from "./types"
import type { RecentItem } from "./types"
import type { Preference, PreferenceStatus } from "./types"

// Demo chat messages (extended shape for UI)
export type DemoMessage = ChatMessage & {
  id?: number
  sources?: { text: string; field: string }[]
  extraction?: { field: string; value: string }
  type?: "text" | "taskCard" | "feedback"
  taskText?: string
  taskStatus?: "complete" | "pending"
  bookmarked?: boolean
}

export const MOCK_DEMO_MESSAGES: DemoMessage[] = [
  { id: 1, role: "assistant", content: "Good morning! I'm Eva, your design planning assistant. What room are you working on today?" },
  { id: 2, role: "user", content: "I'm thinking about redoing my living room", sources: [{ text: "living room", field: "roomType" }] },
  { id: 3, role: "assistant", content: "Great — I've noted <hl>living room</hl> as your project space. Do you have a style direction in mind?", extraction: { field: "Room Type", value: "Living Room" } },
  { id: 4, role: "user", content: "Something minimalist, warm tones, big comfy sofa", sources: [{ text: "minimalist", field: "style" }, { text: "warm tones", field: "color" }, { text: "sofa", field: "furniture" }] },
  { id: 5, role: "assistant", content: "Capturing <hl>minimalist</hl> as your style and <hl>sofa</hl> as a must-have. Budget range?", extraction: { field: "Style + Furniture", value: "Minimalist, Sofa" } },
  { id: 6, role: "user", content: "Around 4k, nothing farmhouse please." },
  { id: 7, role: "assistant", content: "Got it — <hl>$4,000</hl> budget, avoiding <hl>farmhouse</hl>. I've updated your brief.", extraction: { field: "Budget + Exclusion", value: "$4,000 / −Farmhouse" } },
  { id: 8, role: "assistant", type: "taskCard", content: "", taskText: "Living Room Design Brief — style, budget, furniture captured", taskStatus: "complete", bookmarked: true },
  { id: 9, role: "assistant", type: "feedback", content: "Does this look right? You can adjust the layout or add more furniture." },
]

export const CHAT_SUGGESTION_CARDS = [
  { id: "living-room", title: "Living Room", description: "Redesign your main gathering space." },
  { id: "home-office", title: "Home Office", description: "Create a focused, productive workspace." },
  { id: "bedroom", title: "Bedroom", description: "Design a calm retreat for rest." },
  { id: "open-plan", title: "Open Plan", description: "Combine living, dining, kitchen." },
] as const

export const MOCK_WORKSPACES: Workspace[] = [
  { id: "ws-1", name: "Home Renovation" },
  { id: "ws-2", name: "Office Design" },
  { id: "ws-3", name: "Client Projects" },
]

export const MOCK_PROJECTS_BY_WORKSPACE: Record<string, Project[]> = {
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

export const DEFAULT_RECENTS: RecentItem[] = [
  { id: "recent-living-room", label: "Living Room Redesign" },
  { id: "recent-sofa-ideas", label: "Sofa ideas & layout" },
  { id: "recent-color-palette", label: "Color palette exploration" },
]

export const KEY_INSIGHTS = [
  "Modern minimalist style for 400 sq ft space",
  "South-facing windows - consider UV-resistant fabrics",
  "Low-profile sectional as main seating anchor",
  "Warm white and cream base with terracotta accents",
  "Natural materials: linen, oak, travertine, brass",
]

export const TOPICS = [
  "Furniture Selection",
  "Color Palette",
  "Space Planning",
  "Materials",
]

export const RECOMMENDATIONS = [
  { id: "rec-1", label: 'Select sectional dimensions around 95" x 85"' },
  { id: "rec-2", label: "Choose UV-resistant linen or bouclé" },
  { id: "rec-3", label: "Add sculptural accent chairs in rust" },
  { id: "rec-4", label: "Consider floating media console" },
]

export const EXPLORE_NEXT = [
  "Tell Eva about lighting preferences",
  "Mention materials you love",
  "Describe how you use the room day-to-day",
]

export const PREFERENCES: Preference[] = [
  {
    id: "minimalist",
    label: "Minimalist",
    type: "style",
    confidence: 92,
    status: "confirmed",
    connections: ["Clean lines", "Neutral palettes", "Functional furniture"],
    suggestions: [
      { text: "Japandi style — blends minimalist + warm wood", type: "explore" },
      { text: "Hidden storage solutions", type: "furniture" },
    ],
  },
  {
    id: "warm",
    label: "Warm Tones",
    type: "color",
    confidence: 72,
    status: "potential",
    connections: ["Terracotta", "Sand", "Cream"],
    suggestions: [
      { text: "Pair with natural wood furniture", type: "idea" },
      { text: "Warm LED lighting for evenings", type: "explore" },
    ],
  },
  {
    id: "sofa",
    label: "Sofa",
    type: "furniture",
    confidence: 96,
    status: "confirmed",
    connections: ["L-shape", "Boucle fabric", "Low-profile"],
    suggestions: [
      { text: "Modular sofa for layout flexibility", type: "furniture" },
      { text: "Boucle or linen for warmth", type: "explore" },
    ],
  },
  {
    id: "cozy",
    label: "Cozy",
    type: "vibe",
    confidence: 68,
    status: "inferred",
    connections: ["Soft textures", "Warm lighting", "Layered textiles"],
    suggestions: [
      { text: "Floor lamp with warm diffused light", type: "furniture" },
      { text: "Layer cushions in varied textures", type: "idea" },
    ],
  },
]

export const FILES_DATA = [
  { id: "f1", type: "image", title: "Cozy Minimalist Living Room", desc: "Mood board — warm tones, clean lines", time: "10:15 AM", thumb: "mood", tags: ["Mood", "Style"] },
  { id: "f2", type: "floorplan", title: "Living Room Layout v1", desc: "4m × 5m · Sofa on long wall · Table center", time: "10:16 AM", thumb: "plan", tags: ["Floorplan", "Layout"] },
  { id: "f3", type: "image", title: "Warm Tone Palette", desc: "Terracotta, sand, cream, muted ochre", time: "Yesterday", thumb: "palette", tags: ["Color", "Palette"] },
  { id: "f4", type: "image", title: "Boucle Sofa Reference", desc: "Low-profile modular sofa in cream", time: "Yesterday", thumb: "sofa", tags: ["Furniture", "Reference"] },
  { id: "f5", type: "floorplan", title: "Office Layout Draft", desc: "3m × 4m · L-desk · Bookshelf", time: "3 days ago", thumb: "plan2", tags: ["Floorplan", "Office"] },
] as const

// Playbook workflow mock data
export type WfNode = { id: string; x: number; y: number; w: number; title: string; body: string; type: string; icon: string }
export type WfEdge = { id: string; from: string; to: string; label?: string }

export const INIT_WF_NODES: WfNode[] = [
  { id: "start", x: 340, y: 40, w: 300, title: "START", body: "Say hello to the user. Introduce yourself as Eva, part of the Furnishes design team.", type: "start", icon: "🏠" },
  { id: "detect", x: 340, y: 210, w: 300, title: "DETECT INTENT", body: "Extract room type, style keywords, and furniture mentions from user input.", type: "process", icon: "🔍" },
  { id: "collect", x: 160, y: 400, w: 280, title: "COLLECT PREFERENCES", body: "Ask about style, budget, color theme, must-have furniture, and layout preferences.", type: "process", icon: "📋" },
  { id: "clarify", x: 560, y: 400, w: 280, title: "CLARIFY INTENT", body: "Ask user to confirm or correct the detected room type and preferences.", type: "warning", icon: "❓" },
  { id: "brief", x: 160, y: 590, w: 280, title: "GENERATE BRIEF", body: "Compile all extracted data into a structured design brief. Show task card.", type: "process", icon: "📄" },
  { id: "review", x: 340, y: 760, w: 300, title: "REVIEW & CONFIRM", body: "Present the complete brief. Ask for confirmation or adjustments.", type: "end", icon: "✅" },
  { id: "kb", x: 720, y: 40, w: 260, title: "KNOWLEDGE BASE", body: "Reference product catalog and style guides when user asks questions.", type: "knowledge", icon: "📚" },
]

export const INIT_WF_EDGES: WfEdge[] = [
  { id: "e1", from: "start", to: "detect" },
  { id: "e2", from: "detect", to: "collect", label: "USER IS CLEAR" },
  { id: "e3", from: "detect", to: "clarify", label: "USER IS UNCLEAR" },
  { id: "e4", from: "clarify", to: "collect", label: "CORRECTED" },
  { id: "e5", from: "collect", to: "brief", label: "ALL CAPTURED" },
  { id: "e6", from: "brief", to: "review", label: "BRIEF READY" },
]

type TraceEntry =
  | { time: string; text: string; action?: string }
  | { time: string; userQuote: string; changes?: { field: string; after: string; confidence: number; action: string }[]; reasoning?: string }

export const NODE_TRACES: Record<string, { entries: TraceEntry[] }> = {
  start: { entries: [{ time: "10:12 AM", text: "Eva greeted user and asked about room type.", action: "Sent welcome" }] },
  detect: { entries: [{ time: "10:13 AM", userQuote: "redoing my living room", changes: [{ field: "Room Type", after: "Living Room", confidence: 95, action: "applied" }], reasoning: "'Living room' matched room dictionary at 95%." }] },
  collect: {
    entries: [
      { time: "10:14 AM", userQuote: "minimalist, warm tones, big comfy sofa", changes: [{ field: "Style", after: "Minimalist", confidence: 92, action: "applied" }, { field: "Color", after: "Warm tones", confidence: 72, action: "potential" }, { field: "Furniture", after: "Sofa", confidence: 96, action: "applied" }], reasoning: "'Minimalist' exact match (92%). 'Warm tones' ambiguous — flagged (72%). 'Sofa' exact match (96%)." },
      { time: "10:15 AM", userQuote: "Around 4k, nothing farmhouse", changes: [{ field: "Budget", after: "$4,000", confidence: 88, action: "applied" }, { field: "Exclusion", after: "Farmhouse", confidence: 94, action: "applied" }], reasoning: "'4k' → $4,000 via regex (88%). 'Nothing farmhouse' = negation → exclusion (94%)." },
    ],
  },
  clarify: { entries: [] },
  brief: { entries: [{ time: "10:16 AM", text: "Brief compiled. Task card generated.", action: "Brief ready" }] },
  review: { entries: [{ time: "10:17 AM", text: "Awaiting user confirmation.", action: "Feedback sent" }] },
  kb: { entries: [] },
}
