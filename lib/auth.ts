import type { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import * as bcrypt from "bcrypt"
import { prisma } from "@/lib/db"

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email) return null
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      })
      const dbUser = user as { password?: string | null } | null
      if (dbUser?.password) {
        const ok = await bcrypt.compare(credentials.password, dbUser.password)
        if (!ok) return null
        return { id: user!.id, email: user!.email ?? undefined, name: user!.name ?? undefined }
      }
      // Demo fallback (remove when real credentials are required)
      if (
        credentials.email === "demo@example.com" &&
        credentials.password === "demo"
      ) {
        const created = await prisma.user.upsert({
          where: { email: "demo@example.com" },
          create: {
            email: "demo@example.com",
            name: "Demo User",
          },
          update: {},
        })
        return { id: created.id, email: created.email ?? undefined, name: created.name ?? undefined }
      }
      return null
    },
  }),
]
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        const role = (dbUser as { role?: string } | null)?.role ?? "user"
        ;(token as { role?: string }).role = role
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        (session.user as { id?: string }).id = token.sub ?? (token as { id?: string }).id
        ;(session.user as { role?: string }).role = (token as { role?: string }).role ?? "user"
      }
      return session
    },
  },
}
