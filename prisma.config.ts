import { defineConfig } from "prisma/config"

/**
 * DATABASE_URL: set in .env.local.
 * - PostgreSQL: postgresql://eva:eva_local@localhost:5432/eva_dev (use db:generate / db:push)
 * - SQLite: file:./prisma/dev.db (use db:generate:sqlite / db:push:sqlite)
 * Fallback below is for local dev only; set DATABASE_URL in CI and production.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://eva:eva_local@localhost:5432/eva_dev",
  },
})
