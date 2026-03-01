// Playbook node styles
export const NODE_COLORS = {
  start: { bg: "#FFFFFF", border: "#E8E4DE", titleBg: "#F5F0EA", titleC: "#1A1A1A" },
  process: { bg: "#FFFFFF", border: "#E8E4DE", titleBg: "#F5F0EA", titleC: "#1A1A1A" },
  warning: { bg: "#FFFFFF", border: "#C86F4A", titleBg: "#FEF3EE", titleC: "#C86F4A" },
  end: { bg: "#FFFFFF", border: "#4A9D6E", titleBg: "#ECFDF5", titleC: "#047857" },
  knowledge: { bg: "#FFFFFF", border: "#9575CD", titleBg: "#9575CD", titleC: "#FFFFFF" },
} as const

// Status indicator colors
export const STATUS_COLORS = {
  applied: { c: "#4A9D6E", bg: "#ECFDF5" },
  potential: { c: "#C86F4A", bg: "#FEF3EE" },
  inferred: { c: "#9575CD", bg: "#F3E8FF" },
} as const

// File thumbnail palettes
export const FILE_PALETTES = {
  mood: { bg: "#E8D5C4", accent: "#C86F4A" },
  plan: { bg: "#D6E8E0", accent: "#4DB6AC" },
  palette: { bg: "#E8D5C4", accent: "#C17B4A" },
  sofa: { bg: "#D6E0E8", accent: "#5C9AC5" },
  plan2: { bg: "#E8E4DE", accent: "#7A756E" },
} as const

// Preference status dot colors (Tailwind classes)
export const PREFERENCE_STATUS = {
  confirmed: "bg-emerald-500",
  potential: "bg-orange-500",
  inferred: "bg-violet-500",
} as const
