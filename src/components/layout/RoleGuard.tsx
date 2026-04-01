"use client"

import type { ReactNode } from "react"
import { useSession } from "next-auth/react"
import type { UserRole } from "@/types"

export type RoleGuardProps = {
  roles: UserRole[]
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Renders `children` only when the signed-in user's role is in `roles`.
 * While the session is loading, renders nothing (or `fallback` if you pass a loading UI).
 */
export default function RoleGuard({
  roles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <>{fallback}</>
  }

  const role = session?.user?.role
  if (!role || !roles.includes(role)) {
    return null
  }

  return <>{children}</>
}
