"use client"

import type { ComponentType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  CustomersIcon,
  DashboardIcon,
  DealsIcon,
  LayoutGridIcon,
  LeadsIcon,
  LogoutIcon,
  ReportsIcon,
  UsersIcon,
} from "@/lib/icons"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import RoleGuard from "@/components/layout/RoleGuard"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types"

type NavItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string; size?: number }>
  roles: UserRole[]
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: DashboardIcon,
    roles: ["ADMIN", "SALES_MANAGER", "SALES_REP"],
  },
  {
    href: "/dashboard/leads",
    label: "Leads",
    icon: LeadsIcon,
    roles: ["ADMIN", "SALES_MANAGER", "SALES_REP"],
  },
  {
    href: "/dashboard/deals",
    label: "Deals",
    icon: DealsIcon,
    roles: ["ADMIN", "SALES_MANAGER", "SALES_REP"],
  },
  {
    href: "/dashboard/customers",
    label: "Customers",
    icon: CustomersIcon,
    roles: ["ADMIN", "SALES_MANAGER", "SALES_REP"],
  },
  {
    href: "/dashboard/reports",
    label: "Reports",
    icon: ReportsIcon,
    roles: ["ADMIN", "SALES_MANAGER"],
  },
  {
    href: "/dashboard/users",
    label: "Users",
    icon: UsersIcon,
    roles: ["ADMIN"],
  },
]

function roleLabel(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "Admin"
    case "SALES_MANAGER":
      return "Manager"
    case "SALES_REP":
      return "Rep"
    default:
      return role
  }
}

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/dashboard/"
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export type SidebarNavProps = {
  /** Called after a nav link is chosen (e.g. close mobile sheet). */
  onNavigate?: () => void
  className?: string
}

export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const role = session?.user?.role

  const initials =
    session?.user?.name
      ?.split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?"

  return (
    <div
      className={cn(
        "flex h-full flex-col border-sidebar-border bg-sidebar-bg text-foreground",
        className
      )}
    >
      <div className="flex h-18 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-secondary ring-1 ring-border">
          <LayoutGridIcon className="text-primary" size={20} aria-hidden />
        </div>
        <span className="font-semibold tracking-tight text-foreground">
          CRM System
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isNavActive(pathname, item.href)
          return (
            <RoleGuard key={item.href} roles={item.roles}>
              <Link
                href={item.href}
                onClick={() => onNavigate?.()}
                className={cn(
                  "flex items-center gap-3 rounded-r-lg border-l-2 border-transparent py-2.5 pl-3 pr-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-hover hover:text-foreground",
                  active &&
                    "border-primary bg-primary/10 text-primary"
                )}
              >
                <Icon size={18} className="shrink-0 opacity-90" aria-hidden />
                {item.label}
              </Link>
            </RoleGuard>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {status === "loading" ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted/40" />
        ) : session?.user ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-9 border border-border">
                <AvatarFallback className="bg-muted text-xs font-medium text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {session.user.name}
                </p>
                {role ? (
                  <Badge
                    variant="secondary"
                    className="mt-1 border-border bg-secondary text-[10px] text-secondary-foreground"
                  >
                    {roleLabel(role)}
                  </Badge>
                ) : null}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full border-border bg-secondary/50 text-foreground hover:bg-secondary"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogoutIcon size={16} aria-hidden />
              Log out
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/** Fixed sidebar for `lg` and up; hidden on smaller viewports (use `Sheet` + `SidebarNav`). */
export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-sidebar-border bg-sidebar-bg text-foreground lg:flex lg:flex-col">
      <SidebarNav />
    </aside>
  )
}
