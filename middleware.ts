import NextAuth from "next-auth/middleware"

export default NextAuth

export const config = {
  // Only allow unauthenticated: auth, health, and GET /api/config
  matcher: ["/api/((?!auth|health|config$).*)"],
}
