import { createRequire } from "node:module"
import fs from "node:fs"
import path from "node:path"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { BUILD_PLACEHOLDER_DATABASE_URL, getEnv } from "./env"

// SQLite adapter is required only inside createSqliteClient() so Vercel (Postgres) never bundles better-sqlite3

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

/** Sync project root lookup; walks up from cwd looking for prisma/schema.prisma or package.json. */
function getProjectRootSync(): string {
  let dir = path.resolve(process.cwd())
  const root = path.parse(dir).root
  while (dir !== root) {
    if (fs.existsSync(path.join(dir, "prisma", "schema.prisma"))) {
      return dir
    }
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir
    }
    dir = path.dirname(dir)
  }
  return process.cwd()
}

/** Load SQLite Prisma client from project root so resolution works under Turbopack. */
function loadSqliteClient(): { PrismaClient: new (opts: { adapter: unknown }) => PrismaClient } {
  const projectRoot = getProjectRootSync()
  const clientPath = path.join(projectRoot, "node_modules", ".prisma", "client-sqlite")
  if (!fs.existsSync(clientPath)) {
    throw new Error(
      "SQLite client not found. Run: npm run db:generate (then npm run db:push:sqlite for fallback DB)."
    )
  }
  try {
    const req = createRequire(path.join(projectRoot, "package.json"))
    return req(clientPath) as { PrismaClient: new (opts: { adapter: unknown }) => PrismaClient }
  } catch {
    throw new Error(
      "SQLite client not found. Run: npm run db:generate (then npm run db:push:sqlite for fallback DB)."
    )
  }
}

/** Resolve file: URL to absolute path for better-sqlite3. Relative paths use project root (never under .next). */
function sqliteUrlToPath(fileUrl: string): string {
  // Strip file: protocol (file:// or file:) then leading ./ or .\
  const raw = String(fileUrl)
    .trim()
    .replace(/^file:(?:\/\/)?/i, "")
    .replace(/^\.?[\\/]/, "")
    .trim()
  const isRelative = !path.isAbsolute(raw) && !/^file:/i.test(raw)
  const baseDir = isRelative ? getProjectRootSync() : process.cwd()
  let resolved = path.normalize(path.resolve(baseDir, raw))
  // If Turbopack/cwd put us under .next, force DB path to project root's prisma dir
  if (resolved.includes(".next" + path.sep) || resolved.includes(".next/")) {
    const root = getProjectRootSync()
    const rel = raw.split(/[/\\]/).filter(Boolean)
    resolved = path.normalize(path.join(root, ...rel))
  }
  return resolved
}

/** Creates SQLite client with Prisma 7 adapter. Uses process.env.DATABASE_URL (set fallback URL before calling when using as fallback). Lazy-loads adapter so Vercel serverless bundle does not include better-sqlite3 when using Postgres. */
function createSqliteClient(): PrismaClient {
  const url = process.env.DATABASE_URL || SQLITE_FALLBACK_URL
  const dbPath = sqliteUrlToPath(url)
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  // Lazy require so Vercel serverless bundle does not include better-sqlite3 when using Postgres
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3") as typeof import("@prisma/adapter-better-sqlite3") // eslint-disable-line @typescript-eslint/no-require-imports
  const adapter = new PrismaBetterSqlite3({ url: dbPath })
  const { PrismaClient: SqliteClient } = loadSqliteClient()
  return new SqliteClient({ adapter })
}

function createPrisma(): PrismaClient {
  try {
    const env = getEnv()
    const url = env.DATABASE_URL

    // Build placeholder: no DB during Vercel/CI build; throw on first use
    if (url === BUILD_PLACEHOLDER_DATABASE_URL) {
      return new Proxy({} as PrismaClient, {
        // Proxy get(target, prop) signature required; we only throw
        get() {
          throw new Error(
            "Database is not available during build. Set DATABASE_URL in Vercel for runtime."
          )
        },
      }) as PrismaClient
    }

    if (url.startsWith("file:")) {
      return createSqliteClient()
    }

    const adapter = new PrismaPg({ connectionString: url })
    const pgClient = new PrismaClient({ adapter })
    // Skip SQLite fallback on Vercel (serverless has no persistent filesystem for file: DB)
    const useSqliteFallback = process.env.VERCEL !== "1"
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
              if (useSqliteFallback && isConnectionError(e)) {
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
                if (useSqliteFallback && isConnectionError(e)) {
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
