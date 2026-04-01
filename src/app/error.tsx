"use client"

import Link from "next/link"
import { EmptyState } from "@/components/ui/EmptyState"
import { Button } from "@/components/ui/button"
import { AlertIcon } from "@/lib/icons"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center p-6">
          <EmptyState
            icon={<AlertIcon stroke={1.25} aria-hidden />}
            title="Something went wrong"
            description={
              error.message ||
              "An unexpected error occurred. You can try again or return home."
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" onClick={() => reset()}>
                  Try again
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard">Go to dashboard</Link>
                </Button>
              </div>
            }
          />
        </div>
      </body>
    </html>
  )
}
