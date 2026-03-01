/**
 * Single source of truth for field ids and labels. Server-only (uses getDomainConfig).
 */
import { getDomainConfig } from "@/lib/domain-config"

const DEFAULT_FIELD_IDS = ["roomType", "style", "budget", "color", "furniture", "exclusion"] as const

const FALLBACK_LABELS: Record<string, string> = {
  roomType: "room type",
  style: "design style",
  designStyle: "design style",
  budget: "budget",
  budgetRange: "budget",
  color: "color",
  colorTheme: "colors",
  furniture: "furniture",
  furnitureLayout: "layout",
  exclusion: "exclusion",
}

/** Return field ids from domain config, or default list. */
export function getFieldIds(): string[] {
  const fields = getDomainConfig().fields
  if (fields?.length) return fields.map((f) => f.id)
  return [...DEFAULT_FIELD_IDS]
}

/** Return human-readable label for a field id (from config or fallback). */
export function getFieldLabel(fieldId: string): string {
  const field = getDomainConfig().fields?.find((f) => f.id === fieldId)
  if (field?.label) return field.label
  return FALLBACK_LABELS[fieldId] ?? fieldId
}
