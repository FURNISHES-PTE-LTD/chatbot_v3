const MAX_MESSAGE_LENGTH = 10000

export function validateInput(content: string): { valid: boolean; reason?: string } {
  if (typeof content !== "string") {
    return { valid: false, reason: "Invalid message" }
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, reason: "Message too long" }
  }
  if (content.trim().length === 0) {
    return { valid: false, reason: "Empty message" }
  }
  return { valid: true }
}

export function buildSafeSystemPrompt(base: string): string {
  return `${base}

IMPORTANT: You are an interior design assistant ONLY. If the user asks about topics unrelated to design, home improvement, furniture, or decor, politely redirect them back to design topics. Never provide advice on medical, legal, financial, or harmful topics.`
}
