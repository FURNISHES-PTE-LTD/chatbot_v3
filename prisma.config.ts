import { defineConfig } from "prisma/config"

/**
 * DATABASE_URL fallback is for local dev only.
 * Set DATABASE_URL in CI and production (e.g. in .env or environment).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://eva:eva_local@localhost:5432/eva_dev",
  },
})
