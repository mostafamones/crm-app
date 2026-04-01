"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn, formatCurrency, formatPercentage } from "@/lib/utils"
import type { ReportsData } from "@/types"

export type ReportsSummaryProps = {
  data: ReportsData | null
  loading?: boolean
}

const cardShell = "gap-4 p-6"

export default function ReportsSummary({
  data,
  loading = false,
}: ReportsSummaryProps) {
  if (loading || !data) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className={cn("animate-pulse", cardShell)}>
            <CardHeader className="px-0 pt-0 pb-2">
              <div className="h-4 w-24 rounded bg-muted" />
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="h-10 w-32 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const { totalRevenue, closedWon, closedLost, conversionRate, avgDealSize } =
    data
  const closedTotal = closedWon + closedLost
  const wonPct =
    closedTotal === 0 ? 0 : Math.round((closedWon / closedTotal) * 1000) / 10
  const lostPct =
    closedTotal === 0 ? 0 : Math.round((closedLost / closedTotal) * 1000) / 10

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <Card className={cardShell}>
        <CardHeader className="px-0 pt-0 pb-2">
          <CardTitle className="text-lg font-semibold text-muted-foreground">
            Total revenue
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Closed won deals</p>
        </CardContent>
      </Card>

      <Card className={cardShell}>
        <CardHeader className="px-0 pt-0 pb-2">
          <CardTitle className="text-lg font-semibold text-muted-foreground">
            Deals won vs lost
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-0 pb-0">
          <div className="flex justify-between text-sm">
            <span className="text-emerald-600 dark:text-emerald-400">
              Won {closedWon}
            </span>
            <span className="text-destructive">Lost {closedLost}</span>
          </div>
          {closedTotal > 0 ? (
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="bg-emerald-500 transition-all dark:bg-emerald-600"
                style={{ width: `${wonPct}%` }}
                title={`Won ${wonPct}%`}
              />
              <div
                className="bg-destructive/80"
                style={{ width: `${lostPct}%` }}
                title={`Lost ${lostPct}%`}
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No closed outcomes</p>
          )}
        </CardContent>
      </Card>

      <Card className={cardShell}>
        <CardHeader className="px-0 pt-0 pb-2">
          <CardTitle className="text-lg font-semibold text-muted-foreground">
            Conversion rate
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <p className="text-3xl font-bold tracking-tight tabular-nums">
            {formatPercentage(conversionRate)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Won ÷ all deals in range
          </p>
        </CardContent>
      </Card>

      <Card className={cardShell}>
        <CardHeader className="px-0 pt-0 pb-2">
          <CardTitle className="text-lg font-semibold text-muted-foreground">
            Avg deal size
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <p className="text-3xl font-bold tracking-tight tabular-nums">
            {formatCurrency(avgDealSize)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Per closed won deal
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
