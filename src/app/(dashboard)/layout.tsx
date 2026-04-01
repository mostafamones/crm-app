import DashboardShell from "@/components/layout/DashboardShell"
import { requireAuth } from "@/lib/auth"

/**
 * `DashboardShell` hosts Sidebar (desktop), mobile `Sheet` nav, and `TopBar`.
 * `SessionProvider` is provided once in the root layout (`AuthSessionProvider`).
 */
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await requireAuth()

  return <DashboardShell>{children}</DashboardShell>
}
