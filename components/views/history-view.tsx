"use client"

import { useState, useEffect } from "react"
import { List, Loader2 } from "lucide-react"
import { apiGet, API_ROUTES } from "@/lib/api"

interface HistoryViewProps {
  onItemClick: (id: string, label: string) => void
}

export function HistoryView({ onItemClick }: HistoryViewProps) {
  const [conversations, setConversations] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiGet<{ id: string; title: string }[]>(API_ROUTES.conversations)
      .then((list) => setConversations(Array.isArray(list) ? list : []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
        <List className="w-4 h-4" />
        Conversation history
      </h1>
      <p className="text-sm text-muted-foreground mb-4">Open a past conversation from the list below.</p>
      {conversations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No conversations yet. Start a new chat to see them here.</p>
      ) : (
        <ul className="space-y-1">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onItemClick(`convo-${c.id}`, c.title)}
                className="w-full text-left px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
              >
                {c.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
