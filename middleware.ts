import NextAuth from "next-auth/middleware"

export default NextAuth

export const config = {
  matcher: ["/api/((?!auth|health).*)"],
}
