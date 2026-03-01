import { PrismaClient } from "@prisma/client"
import { getEnv } from "@/lib/env"

getEnv()

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrisma() {
  getEnv() // ensure env validated; Prisma reads DATABASE_URL from prisma.config.ts / env
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrisma()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
