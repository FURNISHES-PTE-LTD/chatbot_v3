import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required").optional(),
  NEXTAUTH_SECRET: z
    .string()
    .min(1)
    .optional()
    .transform((v) => v ?? "build-placeholder-secret"),
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
