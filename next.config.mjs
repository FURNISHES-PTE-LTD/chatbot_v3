import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pino", "better-sqlite3", "@prisma/adapter-better-sqlite3"],
  // Keep serverless bundles under Vercel 250 MB: exclude SQLite, pnpm store, and repo metadata
  experimental: {
    outputFileTracingExcludes: {
      "*": [
        ".pnpm-store/**",
        "node_modules/.pnpm-store/**",
        "**/node_modules/better-sqlite3/**",
        "**/node_modules/@prisma/adapter-better-sqlite3/**",
        "**/node_modules/.prisma/client-sqlite/**",
        "**/node_modules/.pnpm/*better-sqlite3*/**",
        "**/node_modules/.pnpm/*+better-sqlite3*/**",
        ".git/**",
        "**/.git/**",
        "package-lock.json",
      ],
    },
  },
  images: {
    // Use next/image optimization. Add remotePatterns for external domains as needed.
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "0" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ]
  },
}

const sentryOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
}

export default withSentryConfig(nextConfig, sentryOptions)
