import { DataTableSkeleton } from "@/components/ui/DataTableSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

/** List-style CRM pages (leads, deals table, customers, users). */
export function DashboardListRouteLoading({ columns = 7 }: { columns?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-full sm:w-52" />
      </div>
      <div className="rounded-lg border bg-card">
        <DataTableSkeleton columns={columns} rows={10} />
      </div>
    </div>
  )
}

/** Dashboard home (KPIs + charts). */
export function DashboardHomeRouteLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

/** Deals page with tabs. */
export function DashboardDealsRouteLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-8 w-64 rounded-lg" />
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-full sm:w-52" />
      </div>
      <div className="rounded-lg border bg-card">
        <DataTableSkeleton columns={7} rows={10} />
      </div>
    </div>
  )
}

/** Reports (summary cards + charts). */
export function DashboardReportsRouteLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-9 w-48" />
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
}
