import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { UserRole } from "@/types"

type TokenWithAppClaims = {
  id?: string
  role?: UserRole
}

type UserWithRole = {
  id: string
  role: UserRole
}

// This is a LIGHTWEIGHT config with NO Prisma import.
// Used by middleware for JWT verification only.
export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Intentionally empty. Real authorization happens in `src/auth.ts`.
      async authorize() {
        return null
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as UserWithRole
        const t = token as unknown as TokenWithAppClaims
        t.id = u.id
        t.role = u.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const t = token as unknown as TokenWithAppClaims
        if (t.id) session.user.id = t.id
        if (t.role) session.user.role = t.role
      }
      return session
    },
    authorized({ request, auth }) {
      const p = request.nextUrl.pathname
      if (p.startsWith("/api/auth")) return true
      if (p.startsWith("/login")) return true
      return !!auth?.user
    },
  },
}

