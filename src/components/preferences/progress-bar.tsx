"use client"

import { cn } from "@/lib/core/utils"

interface ProgressBarProps {
  completed: number
  total: number
  className?: string
}

export function ProgressBar({ completed, total, className }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const barColor =
    pct < 50 ? "bg-red-500" : pct < 80 ? "bg-amber-500" : "bg-green-500"
  return (
    <div className={cn("space-y-1", className)}>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        {completed} of {total} fields filled
      </p>
    </div>
  )
}
