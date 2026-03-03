import { prisma } from "./db"

/**
 * Persistent rate limiter using the database (survives deploys and serverless cold starts).
 * Returns true if the request is allowed, false if over limit.
 */
export async function checkRateLimit(
  key: string,
  limit = 30,
  windowMs = 60000
): Promise<boolean> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMs)

  const count = await prisma.rateLimitEvent.count({
    where: {
      key,
      createdAt: { gt: windowStart },
    },
  })

  if (count >= limit) return false

  await prisma.rateLimitEvent.create({
    data: { key },
  })

  return true
}
