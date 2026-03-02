"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { apiGet, API_ROUTES } from "@/lib/api"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function SharedProjectPage() {
  const params = useParams()
  const shareId = params?.shareId as string
  const [data, setData] = useState<{ preferences: Record<string, string>; summary: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shareId) return
    apiGet<{ preferences: Record<string, string>; summary: string }>(
      API_ROUTES.shared(shareId)
    )
      .then(setData)
      .catch(() => setError("Link not found or expired"))
  }, [shareId])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  const { preferences, summary } = data
  const entries = Object.entries(preferences).filter(([, v]) => v)

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="text-xl font-semibold">{summary}</h1>
        <p className="text-sm text-muted-foreground">Shared design brief (read-only)</p>
        <div className="grid gap-3">
          {entries.map(([field, value]) => (
            <Card key={field}>
              <CardHeader className="py-2 text-sm font-medium capitalize">
                {field.replace(/([A-Z])/g, " $1").trim()}
              </CardHeader>
              <CardContent className="py-0 pb-3 text-sm text-muted-foreground">
                {value}
              </CardContent>
            </Card>
          ))}
        </div>
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No preferences in this brief yet.</p>
        )}
        <footer className="pt-8 text-center text-xs text-muted-foreground">
          Created with Furnishes
        </footer>
      </div>
    </div>
  )
}
