import { forbidden, redirect } from "next/navigation"
import { auth } from "@/auth"
import type { UserRole } from "@/types"

export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  return session
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.user.role)) {
    forbidden()
  }
  return session
}
