import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET

/** Edge-safe: avoids bundling Prisma with `auth as middleware` + Credentials DB lookup. */
export async function middleware(request: NextRequest) {
  if (!secret) {
    throw new Error("Missing AUTH_SECRET or NEXTAUTH_SECRET")
  }

  const { pathname } = request.nextUrl

  if (!pathname.startsWith("/dashboard") && pathname !== "/login") {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret })
  const isLoggedIn = !!token

  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.nextUrl))
  }

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
