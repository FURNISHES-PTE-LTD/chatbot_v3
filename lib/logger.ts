type LogLevel = "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  event: string
  conversationId?: string
  latencyMs?: number
  error?: string
  [key: string]: unknown
}

export function log(entry: LogEntry) {
  const timestamp = new Date().toISOString()
  const line = JSON.stringify({ timestamp, ...entry })
  if (entry.level === "error") {
    console.error(line)
  } else {
    console.log(line)
  }
}
