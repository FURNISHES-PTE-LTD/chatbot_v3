"use client"

import { cn } from "@/lib/core/utils"

interface SectionLabelProps {
  children: React.ReactNode
  className?: string
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        "text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60",
        className
      )}
    >
      {children}
    </p>
  )
}
