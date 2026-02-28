"use client"

import type React from "react"
import { Home } from "lucide-react"

export function DashboardNavbar({
  currentSection,
  currentSubsection,
  currentIcon: CurrentIcon = Home,
}: {
  currentSection: string
  currentSubsection?: string
  currentIcon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <header className="flex h-12 items-center border-b border-border bg-card">
      <div className="flex h-12 w-52 shrink-0 items-center gap-2 px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/15 transition-all duration-300 hover:bg-primary/25 hover:scale-110">
          <span className="text-xs font-medium text-primary">S</span>
        </div>
        <span className="text-sm font-medium text-foreground">SaaSApp</span>
      </div>

      <div className="h-12 w-px shrink-0 bg-border" />

      <div className="flex flex-1 items-center gap-2 px-4">
        <CurrentIcon className="h-4 w-4 text-primary transition-all duration-300" />
        <span className="text-xs font-medium text-foreground capitalize">{currentSection.replace(/-/g, " ")}</span>
        {currentSubsection && (
          <>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs text-muted-foreground">{currentSubsection}</span>
          </>
        )}
      </div>

      <div className="h-12 w-px shrink-0 bg-border" />

      <div className="h-12 w-14 shrink-0" />
    </header>
  )
}
