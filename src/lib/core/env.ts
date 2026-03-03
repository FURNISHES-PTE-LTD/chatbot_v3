import { z } from "zod"

/** Used during Vercel/CI build when DATABASE_URL is not set; db layer must not connect. */
export const BUILD_PLACEHOLDER_DATABASE_URL = "postgresql://build-placeholder"

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .optional()
    .transform((v) => {
      const val = (v ?? "").trim()
      // Vercel/CI build: no real DB needed; use placeholder so validation passes
      if (!val && (process.env.VERCEL === "1" || process.env.CI === "true")) return BUILD_PLACEHOLDER_DATABASE_URL
      return val
    })
    .refine((v) => (v ?? "").length > 0, { message: "DATABASE_URL is required" }),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z
    .string()
    .optional()
    .transform((v) => {
      const isProd = process.env.NODE_ENV === "production"
      if (isProd && (!v || !v.trim())) {
        throw new Error("NEXTAUTH_SECRET is required in production. Set it in your environment.")
      }
      return v?.trim() ? v : "build-placeholder-secret"
    }),
  NEXTAUTH_URL: z
    .string()
    .url()
    .optional()
    .transform((v) => v ?? "http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

export type Env = z.infer<typeof envSchema>

let validated: Env | null = null

export function getEnv(): Env {
  if (validated) return validated
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.flatten().fieldErrors)
    throw new Error("Invalid environment variables")
  }
  validated = result.data
  return validated
}
