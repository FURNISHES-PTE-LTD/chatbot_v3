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
  conversationPreferencesConfirm: (id: string) => `/api/conversations/${id}/preferences/confirm`,
  conversationPreferencesReject: (id: string) => `/api/conversations/${id}/preferences/reject`,
  conversationShare: (id: string) => `/api/conversations/${id}/share`,
  shared: (shareId: string) => `/api/shared/${shareId}`,
  conversationInsights: (id: string) => `/api/conversations/${id}/insights`,
  conversationRecommendations: (id: string) => `/api/conversations/${id}/recommendations`,
  conversationTitle: (id: string) => `/api/conversations/${id}/title`,
  conversationExport: (id: string, format?: string, includeMessages = true) => {
    const params = new URLSearchParams()
    if (format) params.set("format", format)
    if (!includeMessages) params.set("include_messages", "false")
    const qs = params.toString()
    return `/api/conversations/${id}/export${qs ? `?${qs}` : ""}`
  },
  conversationEvents: (id: string) => `/api/conversations/${id}/events`,
  conversationFiles: (id: string) => `/api/conversations/${id}/files`,
  messageFeedback: (messageId: string) => `/api/messages/${messageId}/feedback`,
  message: (messageId: string) => `/api/messages/${messageId}`,
} as const

async function handleResponse<T>(res: Response, url?: string): Promise<T> {
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
    const hint = url ? ` (${url})` : ""
    const fallback =
      status >= 500 && message === "Internal Server Error"
        ? " Check server logs and env (e.g. DATABASE_URL, OPENAI_API_KEY)."
        : ""
    throw new Error(
      status >= 500 ? `Server error (${status}): ${message}${hint}${fallback}` : message
    )
  }
  return res.json() as Promise<T>
}

/** GET request; throws on !res.ok, returns parsed JSON. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path)
  return handleResponse<T>(res, path)
}

/** POST request with JSON body; throws on !res.ok, returns parsed JSON. */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res, path)
}

/** PATCH request with JSON body; throws on !res.ok, returns parsed JSON. */
export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res, path)
}

/** DELETE request with optional JSON body; throws on !res.ok, returns parsed JSON. */
export async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "DELETE",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return handleResponse<T>(res, path)
}
