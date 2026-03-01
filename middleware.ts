import NextAuth from "next-auth/middleware"

export default NextAuth

export const config = {
  // Allow unauthenticated: auth, health, and GET /api/conversations (returns empty list when no session)
  matcher: ["/api/((?!auth|health|conversations$|conversations/).*)"],
}
