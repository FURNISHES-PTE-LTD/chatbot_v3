import { getDomainConfig } from "@/lib/domain/config"
import { getSessionCost } from "./cost-logger"

export async function checkCostLimit(
  conversationId: string
): Promise<{ allowed: boolean; currentCost: number; limit: number }> {
  const config = getDomainConfig()
  const limit = config.rate_limits?.session_cost_limit_usd ?? 2.0
  const currentCost = await getSessionCost(conversationId)
  return { allowed: currentCost < limit, currentCost, limit }
}
