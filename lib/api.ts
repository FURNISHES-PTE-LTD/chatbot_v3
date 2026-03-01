/**
 * Lightweight API client and route constants (client-safe).
 */

export const API_ROUTES = {
  config: "/api/config",
  chat: "/api/chat",
  extract: "/api/extract",
  brainstorm: "/api/brainstorm",
  suggestions: "/api/suggestions",
  upload: "/api/upload",
  conversations: "/api/conversations",
  conversation: (id: string) => `/api/conversations/${id}`,
  conversationPreferences: (id: string) => `/api/conversations/${id}/preferences`,
  conversationInsights: (id: string) => `/api/conversations/${id}/insights`,
  conversationRecommendations: (id: string) => `/api/conversations/${id}/recommendations`,
  conversationTitle: (id: string) => `/api/conversations/${id}/title`,
  conversationExport: (id: string, format?: string) =>
    `/api/conversations/${id}/export${format ? `?format=${format}` : ""}`,
  conversationEvents: (id: string) => `/api/conversations/${id}/events`,
  conversationFiles: (id: string) => `/api/conversations/${id}/files`,
  messageFeedback: (messageId: string) => `/api/messages/${messageId}/feedback`,
} as const

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ error: res.statusText, status: res.status }))
    const body = err as { error?: string | { code?: string; message?: string; details?: unknown }; status?: number }
    const message =
      typeof body.error === "object" && body.error?.message
        ? body.error.message
        : typeof body.error === "string"
          ? body.error
          : res.statusText
    const status = body.status ?? res.status
    throw new Error(status >= 500 ? `Server error (${status}): ${message}` : message)
  }
  return res.json() as Promise<T>
}

/** GET request; throws on !res.ok, returns parsed JSON. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path)
  return handleResponse<T>(res)
}

/** POST request with JSON body; throws on !res.ok, returns parsed JSON. */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res)
}

/** PATCH request with JSON body; throws on !res.ok, returns parsed JSON. */
export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res)
}

/** DELETE request with optional JSON body; throws on !res.ok, returns parsed JSON. */
export async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "DELETE",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return handleResponse<T>(res)
}
