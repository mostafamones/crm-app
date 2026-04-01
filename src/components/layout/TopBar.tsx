"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import RoleGuard from "@/components/layout/RoleGuard"
import { BellIcon, ChevronRightIcon, MenuIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"

const segmentTitle: Record<string, string> = {
  dashboard: "Dashboard",
  leads: "Leads",
  deals: "Deals",
  customers: "Customers",
  reports: "Reports",
  users: "Users",
}

function titleFromPathname(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean)
  if (parts.length === 0) return "Dashboard"
  const last = parts[parts.length - 1]
  return segmentTitle[last] ?? last.charAt(0).toUpperCase() + last.slice(1)
}

export type TopBarProps = {
  onOpenMobileNav?: () => void
}

export default function TopBar({ onOpenMobileNav }: TopBarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const parts = pathname.split("/").filter(Boolean)
  const isNested = parts.length > 1
  const pageTitle = titleFromPathname(pathname)

  const initials =
    session?.user?.name
      ?.split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?"

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-18 shrink-0 items-center justify-between gap-4 py-3",
        "border-b border-border bg-topbar-bg/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-topbar-bg/80",
        "md:px-6"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {onOpenMobileNav ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground lg:hidden"
            aria-label="Open menu"
            onClick={onOpenMobileNav}
          >
            <MenuIcon size={22} aria-hidden />
          </Button>
        ) : null}
        {isNested ? (
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 flex-wrap items-center gap-1 text-base text-muted-foreground"
          >
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <ChevronRightIcon size={14} className="shrink-0 opacity-70" aria-hidden />
            <span
              className="text-2xl font-bold tracking-tight text-foreground"
              aria-current="page"
            >
              {pageTitle}
            </span>
          </nav>
        ) : (
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {pageTitle}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <RoleGuard roles={["ADMIN", "SALES_MANAGER"]}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            aria-label="Notifications"
          >
            <BellIcon size={20} />
          </Button>
        </RoleGuard>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card py-1 pl-1 pr-2 shadow-card">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[140px] truncate text-sm font-medium text-foreground sm:inline">
            {session?.user?.name ?? "—"}
          </span>
        </div>
      </div>
    </header>
  )
}
