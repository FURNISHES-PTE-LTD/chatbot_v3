"use client"

import { useState, useEffect, useCallback } from "react"
import { List, Loader2 } from "lucide-react"
import { apiGet, API_ROUTES } from "@/lib/api"

const PAGE_SIZE = 20

interface HistoryViewProps {
  onItemClick: (id: string, label: string) => void
}

export function HistoryView({ onItemClick }: HistoryViewProps) {
  const [conversations, setConversations] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadPage = useCallback((off: number, append: boolean) => {
    if (off === 0) setLoading(true)
    else setLoadingMore(true)
    const url = `${API_ROUTES.conversations}?limit=${PAGE_SIZE}&offset=${off}`
    apiGet<{ conversations: { id: string; title: string }[]; hasMore: boolean }>(url)
      .then((data) => {
        const list = data.conversations ?? []
        setConversations((prev) => (append ? [...prev, ...list] : list))
        setHasMore(data.hasMore ?? false)
        setOffset(off + list.length)
      })
      .catch(() => (off === 0 ? setConversations([]) : null))
      .finally(() => {
        setLoading(false)
        setLoadingMore(false)
      })
  }, [])

  useEffect(() => {
    loadPage(0, false)
  }, [loadPage])

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
      {conversations.length === 0 && !loading ? (
        <p className="text-sm text-muted-foreground">No conversations yet. Start a new chat to see them here.</p>
      ) : (
        <>
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
          {hasMore && (
            <button
              type="button"
              onClick={() => loadPage(offset, true)}
              disabled={loadingMore}
              className="mt-3 w-full py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg disabled:opacity-50"
            >
              {loadingMore ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Load more"}
            </button>
          )}
        </>
      )}
    </div>
  )
}
