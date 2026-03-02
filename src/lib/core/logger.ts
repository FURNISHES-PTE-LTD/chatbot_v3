import pino from "pino"

type LogLevel = "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  event: string
  conversationId?: string
  latencyMs?: number
  error?: string
  requestId?: string
  [key: string]: unknown
}

const pinoLogger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  formatters: {
    level: (label) => ({ level: label }),
  },
})

/** Structured logger. Pass requestId when available (e.g. from request headers or middleware). */
export function log(entry: LogEntry) {
  const { level, requestId, ...rest } = entry
  const child = requestId ? pinoLogger.child({ requestId }) : pinoLogger
  child[level](rest)
}

/** Create a child logger with a bound requestId for the duration of a request. */
export function withRequestId(requestId: string) {
  return pinoLogger.child({ requestId })
}
