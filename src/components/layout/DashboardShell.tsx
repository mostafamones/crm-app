"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import Sidebar, { SidebarNav } from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"

export default function DashboardShell({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const closeIfDesktop = () => {
      if (mq.matches) setMobileNavOpen(false)
    }
    mq.addEventListener("change", closeIfDesktop)
    return () => mq.removeEventListener("change", closeIfDesktop)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          showCloseButton
          className="w-64 max-w-[min(16rem,100vw)] border-sidebar-border bg-sidebar-bg p-0 text-foreground lg:hidden [&>button]:text-foreground"
        >
          <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-h-screen flex-col lg:pl-64">
        <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
