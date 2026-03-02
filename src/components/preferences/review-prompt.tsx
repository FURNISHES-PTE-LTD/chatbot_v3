"use client"

import { Button } from "@/components/ui/button"

interface ReviewPromptProps {
  preferences: Record<string, string>
  onDismiss: () => void
  onReview: () => void
}

export function ReviewPrompt({ preferences, onDismiss, onReview }: ReviewPromptProps) {
  const count = Object.keys(preferences).filter((k) => preferences[k]).length
  if (count === 0) return null
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
      <p className="text-muted-foreground mb-2">
        You&apos;ve shared quite a bit! Want to review your design brief so far?
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="default" onClick={onReview}>
          Review Preferences
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
