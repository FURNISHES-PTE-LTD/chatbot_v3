"use client"

import { useEffect, useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/core/utils"

const AUTO_DISMISS_SECONDS = 60

export interface ProposalItem {
  field: string
  value: string
  confidence: number
  changeId: string
}

interface ConfirmationBannerProps {
  proposals: ProposalItem[]
  onAccept: (changeId: string) => void
  onReject: (changeId: string) => void
  onAutoDismiss?: () => void
  className?: string
}

export function ConfirmationBanner({ proposals, onAccept, onReject, onAutoDismiss, className }: ConfirmationBannerProps) {
  const [countdown, setCountdown] = useState<number | null>(onAutoDismiss ? AUTO_DISMISS_SECONDS : null)

  useEffect(() => {
    if (proposals.length === 0 || !onAutoDismiss || countdown === null) return
    if (countdown <= 0) {
      onAutoDismiss()
      setCountdown(null)
      return
    }
    const t = setInterval(() => {
      setCountdown((c) => (c === null ? null : c - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [proposals.length, onAutoDismiss, countdown])

  useEffect(() => {
    if (proposals.length > 0 && onAutoDismiss) setCountdown(AUTO_DISMISS_SECONDS)
  }, [proposals.length, onAutoDismiss])

  if (proposals.length === 0) return null
  return (
    <div
      className={cn(
        "rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-3",
        className
      )}
    >
      <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
        Detected preferences — confirm or reject:
        {countdown !== null && countdown > 0 && (
          <span className="ml-2 text-amber-600 dark:text-amber-400 font-normal">
            (Auto-dismiss in {countdown}s)
          </span>
        )}
      </p>
      <ul className="space-y-2">
        {proposals.map((p) => (
          <li
            key={p.changeId}
            className="flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <span className="text-amber-800 dark:text-amber-200">
              <strong>{p.field}</strong>: {p.value}
              <span className="ml-1 text-amber-600 dark:text-amber-400">
                ({Math.round(p.confidence * 100)}%)
              </span>
            </span>
            <span className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-green-300 bg-green-50 hover:bg-green-100 dark:border-green-700 dark:bg-green-950/50"
                onClick={() => onAccept(p.changeId)}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-muted-foreground"
                onClick={() => onReject(p.changeId)}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Reject
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
