import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user
  const isAuthRoute = nextUrl.pathname.startsWith("/login")
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard")
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")

  if (isApiAuthRoute) return NextResponse.next()

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  if (!isLoggedIn && isDashboardRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)",
  ],
}
