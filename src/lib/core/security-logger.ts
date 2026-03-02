import pino from "pino"

export type SecurityEventType =
  | "rate_limit"
  | "injection_detected"
  | "moderation_flagged"
  | "auth_failure"
  | "cost_limit_hit"

export interface SecurityEvent {
  type: SecurityEventType
  clientIp?: string
  conversationId?: string
  userId?: string
  details?: string
  timestamp?: string
}

const securityLogger = pino({
  level: "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
}).child({ component: "security" })

export function logSecurityEvent(event: SecurityEvent): void {
  const { type, clientIp, conversationId, userId, details } = event
  securityLogger.warn({
    type,
    clientIp,
    conversationId,
    userId,
    details,
    timestamp: new Date().toISOString(),
  })
}
