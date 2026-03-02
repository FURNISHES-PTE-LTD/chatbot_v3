import path from "node:path"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { getEnv } from "./env"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const CONNECTION_ERROR_CODES = new Set([
  "P1001",
  "P1002",
  "P1017",
  "P1034",
])

function isConnectionError(e: unknown): boolean {
  const err = e as { code?: string; message?: string; name?: string; cause?: unknown }
  if (err?.code && CONNECTION_ERROR_CODES.has(err.code)) return true
  if (err?.name === "PrismaClientInitializationError" || err?.name === "PrismaClientConstructorValidationError") return true
  if (typeof err?.message === "string" && /connect|ECONNREFUSED|timeout|invocation|PrismaClient.*needs to be constructed|Unknown property datasources/i.test(err.message)) return true
  const cause = err?.cause as { code?: string } | undefined
  if (cause?.code === "ECONNREFUSED") return true
  return false
}

const SQLITE_FALLBACK_URL = "file:./prisma/dev.db"

// Try paths that resolve from source (3 up) and from Next server chunk (4 up).
const SQLITE_CLIENT_PATHS = [
  "../../../node_modules/.prisma/client-sqlite",
  "../../../../node_modules/.prisma/client-sqlite",
] as const

function loadSqliteClient(): { PrismaClient: new (opts: { adapter: unknown }) => PrismaClient } {
  for (const p of SQLITE_CLIENT_PATHS) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic path for SQLite client from alternate output
      return require(p)
    } catch {
      continue
    }
  }
  throw new Error(
    "SQLite client not found. Run: npm run db:generate (then npm run db:push:sqlite for fallback DB)."
  )
}

/** Resolve file: URL to absolute path for better-sqlite3. */
function sqliteUrlToPath(fileUrl: string): string {
  const raw = fileUrl.replace(/^file:\/\//, "")
  return path.resolve(process.cwd(), raw)
}

/** Creates SQLite client with Prisma 7 adapter. Uses process.env.DATABASE_URL (set fallback URL before calling when using as fallback). */
function createSqliteClient(): PrismaClient {
  const url = process.env.DATABASE_URL || SQLITE_FALLBACK_URL
  const dbPath = sqliteUrlToPath(url)
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic require to avoid loading native module when using Postgres only
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3") as {
    PrismaBetterSqlite3: new (config: { url: string }) => unknown
  }
  const adapter = new PrismaBetterSqlite3({ url: dbPath })
  const { PrismaClient: SqliteClient } = loadSqliteClient()
  return new SqliteClient({ adapter })
}

function createPrisma(): PrismaClient {
  try {
    const env = getEnv()
    const url = env.DATABASE_URL

    if (url.startsWith("file:")) {
      return createSqliteClient()
    }

    const adapter = new PrismaPg({ connectionString: url })
    const pgClient = new PrismaClient({ adapter })
    let sqliteClient: PrismaClient | null = null

    const getSqlite = (): PrismaClient => {
      if (sqliteClient) return sqliteClient
      process.env.DATABASE_URL = SQLITE_FALLBACK_URL
      sqliteClient = createSqliteClient()
      if (process.env.NODE_ENV === "development") {
        console.warn("[db] PostgreSQL unreachable, using SQLite fallback (prisma/dev.db)")
      }
      return sqliteClient
    }

    return new Proxy(pgClient, {
      get(target, prop: string) {
        const delegate = (target as unknown as Record<string, unknown>)[prop]
        if (typeof delegate === "function") {
          return (...args: unknown[]) => {
            try {
              return (delegate as (...a: unknown[]) => unknown).apply(target, args)
            } catch (e) {
              if (isConnectionError(e)) {
                const sqlite = getSqlite() as unknown as Record<string, unknown>
                const fn = sqlite[prop]
                if (typeof fn === "function") return (fn as (...a: unknown[]) => unknown).apply(sqlite, args)
              }
              throw e
            }
          }
        }
        if (delegate === null || typeof delegate !== "object") return delegate
        return new Proxy(delegate as object, {
          get(_t, method: string) {
            const fn = (delegate as Record<string, unknown>)[method]
            if (typeof fn !== "function") return fn
            return (...args: unknown[]) => {
              try {
                return (fn as (...a: unknown[]) => unknown).apply(delegate, args)
              } catch (e) {
                if (isConnectionError(e)) {
                  const sqlite = getSqlite() as unknown as Record<string, unknown>
                  const sqliteDelegate = sqlite[prop]
                  if (sqliteDelegate && typeof (sqliteDelegate as Record<string, unknown>)[method] === "function") {
                    return ((sqliteDelegate as Record<string, unknown>)[method] as (...a: unknown[]) => unknown).apply(sqliteDelegate, args)
                  }
                }
                throw e
              }
            }
          },
        })
      },
    }) as unknown as PrismaClient
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    return new Proxy({} as PrismaClient, {
      // Proxy get handler signature requires (target, prop); we only throw
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      get(_target, _prop) {
        throw err
      },
    }) as PrismaClient
  }
}

export const prisma = globalForPrisma.prisma ?? createPrisma()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
