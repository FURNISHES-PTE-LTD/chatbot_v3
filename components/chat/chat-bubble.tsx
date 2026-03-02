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
      className={cn(
        "rounded-lg border border-border bg-muted/30 text-foreground/80",
        size === "md" ? "px-3 py-2 text-sm" : "px-2.5 py-1.5 text-xs",
        isUser ? "max-w-[85%] w-fit min-w-[10rem]" : "max-w-[85%]",
        className
      )}
    >
      {children}
    </div>
  )
}
