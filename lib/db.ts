import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { getEnv } from "@/lib/env"

getEnv()

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrisma() {
  const { DATABASE_URL } = getEnv()
  const url = DATABASE_URL
  // Schema is currently SQLite. For PostgreSQL: change schema.prisma provider to "postgresql", run migrations, then use new PrismaClient() and set DATABASE_URL.
  const adapter = new PrismaBetterSqlite3({ url })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrisma()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
