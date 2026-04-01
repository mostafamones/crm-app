"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { EmptyState } from "@/components/ui/EmptyState"
import { Button } from "@/components/ui/button"
import { AlertIcon } from "@/lib/icons"

export default function DashboardLoadErrorPanel() {
  const notified = useRef(false)
  useEffect(() => {
    if (notified.current) return
    notified.current = true
    toast.error("Unable to load dashboard metrics.")
  }, [])

  return (
    <EmptyState
      icon={<AlertIcon className="text-destructive" stroke={1.25} aria-hidden />}
      title="Couldn’t load metrics"
      description="Please refresh the page or try again in a moment."
      action={
        <Button asChild>
          <Link href="/dashboard">Retry</Link>
        </Button>
      }
    />
  )
}
