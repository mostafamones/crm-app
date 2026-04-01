import Link from "next/link"
import { EmptyState } from "@/components/ui/EmptyState"
import { Button } from "@/components/ui/button"
import { LayoutGridIcon } from "@/lib/icons"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <EmptyState
        icon={<LayoutGridIcon className="text-muted-foreground" stroke={1.25} aria-hidden />}
        title="Page not found"
        description="The page you’re looking for doesn’t exist or was moved."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
    </div>
  )
}
