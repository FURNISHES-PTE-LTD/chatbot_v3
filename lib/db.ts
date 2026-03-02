import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { getEnv } from "@/lib/env"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrisma(): PrismaClient {
  try {
    const env = getEnv()
    const adapter = new PrismaPg({
      connectionString: env.DATABASE_URL,
    })
    return new PrismaClient({ adapter })
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    return new Proxy({} as PrismaClient, {
      get(_, prop) {
        throw err
      },
    }) as PrismaClient
  }
}

export const prisma = globalForPrisma.prisma ?? createPrisma()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
