import { prisma } from "./db"

/**
 * Persist real token usage and cost for a conversation (used for cost cap and analytics).
 */
export async function recordCost(
  conversationId: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
  costUsd: number
): Promise<void> {
  await prisma.costLog.create({
    data: {
      conversationId,
      model,
      promptTokens,
      completionTokens,
      costUsd,
    },
  })
}

/**
 * Sum all costUsd for a conversation (for checkCostLimit).
 */
export async function getSessionCost(conversationId: string): Promise<number> {
  const result = await prisma.costLog.aggregate({
    where: { conversationId },
    _sum: { costUsd: true },
  })
  return result._sum.costUsd ?? 0
}
