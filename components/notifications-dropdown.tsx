"use client"

import { Bell, X } from "lucide-react"
import { useState } from "react"

interface NotificationsDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationsDropdown({ isOpen, onClose }: NotificationsDropdownProps) {
  const [notifications] = useState([
    {
      id: 1,
      title: "Budget alert",
      message: "You're approaching your budget limit",
      time: "2m ago",
      unread: true,
    },
    {
      id: 2,
      title: "Style suggestion",
      message: "New items match your selected style",
      time: "1h ago",
      unread: true,
    },
    {
      id: 3,
      title: "Project saved",
      message: "Living Room Modern has been saved",
      time: "3h ago",
      unread: false,
    },
  ])

  if (!isOpen) return null

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-card shadow-lg z-50">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <div key={notification.id} className="px-4 py-3 hover:bg-accent/5 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  {notification.unread && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{notification.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-2">
        <button className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">
          Mark all as read
        </button>
      </div>
    </div>
  )
}
