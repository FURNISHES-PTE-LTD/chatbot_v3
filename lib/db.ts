import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { getEnv } from "@/lib/env"

getEnv()

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrisma() {
  const { DATABASE_URL } = getEnv()
  const url = DATABASE_URL
  // PostgreSQL: use default client (no adapter). Ensure schema.prisma provider is "postgresql" and run migrations.
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    return new PrismaClient({ datasourceUrl: url })
  }
  // SQLite: use file URL with adapter
  const adapter = new PrismaBetterSqlite3({ url })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrisma()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
