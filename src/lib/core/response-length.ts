/**
 * Adaptive response length: short for greetings and simple questions, detailed for recommendation requests.
 */

const GREETING_PATTERNS = /^(hi|hello|hey|howdy|good morning|good afternoon|good evening|hi there|hey there)[\s!.,?]*$/i
const BREVITY_PATTERNS = /\b(just|quick|quickly|brief|short|tl;dr|in short|summarize|summary)\b/i
const RECOMMENDATION_PATTERNS = /\b(recommend|suggestion|suggest|what (should i|can i)|which|options?|ideas?|plan|detail|detailed|explain|tell me more|how do i)\b/i
const YES_NO_PATTERNS = /\b(yes|no|yeah|nope|sure|ok|okay|maybe)\s*[.?!]*$/i

/**
 * Return an instruction string to append to the system prompt for response length.
 */
export function getResponseLengthInstruction(
  message: string,
  _chatHistoryLength: number
): string {
  const trimmed = message.trim()
  if (GREETING_PATTERNS.test(trimmed)) {
    return "Respond in 1-2 short sentences."
  }
  if (BREVITY_PATTERNS.test(trimmed)) {
    return "Respond in 1-2 short sentences."
  }
  if (YES_NO_PATTERNS.test(trimmed) && trimmed.length < 30) {
    return "Respond in 1-2 short sentences."
  }
  if (RECOMMENDATION_PATTERNS.test(trimmed)) {
    return "Provide a detailed answer (2-4 paragraphs) with concrete options and next steps."
  }
  if (/\?$/.test(trimmed)) {
    return "Answer the question; use 1-3 paragraphs if the question is open-ended."
  }
  return "Respond concisely; 1-2 paragraphs unless the user's message clearly asks for detail."
}
