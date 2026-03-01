import type { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.email === "demo@example.com" &&
          credentials?.password === "demo"
        ) {
          const user = await prisma.user.upsert({
            where: { email: "demo@example.com" },
            create: {
              email: "demo@example.com",
              name: "Demo User",
            },
            update: {},
          })
          return { id: user.id, email: user.email ?? undefined, name: user.name ?? undefined }
        }
        return null
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.id = user.id
      return token
    },
    session: async ({ session, token }) => {
      if (session?.user) (session.user as { id?: string }).id = token.sub ?? (token as { id?: string }).id
      return session
    },
  },
}
