"use client"

import { Home, Star, Share2 } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface MiddleSectionProps {
  activeSection: string
  onNavigate?: (id: string, label: string) => void
}

export function MiddleSection({ activeSection, onNavigate }: MiddleSectionProps) {
  const [isSaved, setIsSaved] = useState(false)

  const handleHomeClick = () => {
    if (onNavigate) {
      onNavigate("home", "Home")
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <button
            onClick={handleHomeClick}
            className="hover:text-primary transition-colors duration-200 cursor-pointer"
          >
            <Home className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </button>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-sm font-medium text-foreground">{activeSection}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSaved(!isSaved)}
            className="flex items-center justify-center h-7 w-7 rounded hover:bg-accent/10 text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
            title={isSaved ? "Unsave" : "Save"}
          >
            <Star className={cn("h-4 w-4", isSaved && "fill-current text-primary")} />
          </button>
          <button
            className="flex items-center justify-center h-7 w-7 rounded hover:bg-accent/10 text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
            title="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground mb-4">{activeSection}</h2>
          <p className="text-muted-foreground">Content for {activeSection} section will be displayed here.</p>
        </div>
      </div>
    </div>
  )
}
