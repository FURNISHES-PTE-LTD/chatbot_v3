"use client"

import { cn } from "@/lib/core/utils"

interface IconButtonProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  onClick?: () => void
  active?: boolean
  size?: "sm" | "md"
  className?: string
}

export function IconButton({
  icon: Icon,
  title,
  onClick,
  active,
  size = "md",
  className,
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "flex items-center justify-center rounded text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
        size === "md" ? "h-7 w-7 hover:bg-accent/10" : "h-6 w-6 hover:bg-accent/10",
        active && "text-primary",
        className
      )}
    >
      <Icon className={cn(size === "md" ? "h-4 w-4" : "h-3.5 w-3.5")} />
    </button>
  )
}
