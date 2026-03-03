"use client"

import { cn } from "@/lib/core/utils"

interface ChatBubbleProps {
  role: "user" | "assistant"
  children: React.ReactNode
  size?: "sm" | "md"
  className?: string
}

export function ChatBubble({ role, children, size = "md", className }: ChatBubbleProps) {
  const isUser = role === "user"
  return (
    <div
      lang="en"
      className={cn(
        "rounded-lg border border-border bg-muted/30 text-foreground/80 hyphens-auto",
        size === "md" ? "px-3 py-2 text-sm" : "px-2.5 py-1.5 text-xs",
        isUser ? "max-w-[100%] w-fit min-w-[8rem]" : "max-w-[85%] min-w-[18rem]",
        className
      )}
    >
      {children}
    </div>
  )
}
