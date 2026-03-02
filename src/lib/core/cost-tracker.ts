import { prisma } from "./db"
import { getDomainConfig } from "@/lib/domain/config"

export async function checkCostLimit(
  conversationId: string
): Promise<{ allowed: boolean; currentCost: number; limit: number }> {
  const config = getDomainConfig()
  const limit = config.rate_limits?.session_cost_limit_usd ?? 2.0
  const messageCount = await prisma.message.count({ where: { conversationId } })
  const estimatedCost = messageCount * 0.001
  return { allowed: estimatedCost < limit, currentCost: estimatedCost, limit }
}
