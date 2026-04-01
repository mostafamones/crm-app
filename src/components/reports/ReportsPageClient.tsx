"use client"

import { useCallback, useEffect, useState } from "react"
import ReportsChart from "@/components/reports/ReportsChart"
import ReportsSummary from "@/components/reports/ReportsSummary"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/EmptyState"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertIcon, ReportsIcon } from "@/lib/icons"
import { formatCurrency } from "@/lib/utils"
import type { ReportsData } from "@/types"
import { toast } from "sonner"

function defaultDateRange(): { start: string; end: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return {
    start: `${y}-01-01`,
    end: `${y}-${m}-${d}`,
  }
}

export type ReportsPageClientProps = {
  isAdmin: boolean
}

export default function ReportsPageClient({ isAdmin }: ReportsPageClientProps) {
  const defaults = defaultDateRange()
  const [startDate, setStartDate] = useState(defaults.start)
  const [endDate, setEndDate] = useState(defaults.end)
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      })
      const res = await fetch(`/api/reports?${params.toString()}`)
      const body = (await res.json()) as { data?: ReportsData; error?: string }
      if (!res.ok) {
        const msg = body.error ?? "Failed to load reports"
        setError(msg)
        setData(null)
        toast.error(msg)
        return
      }
      setData(body.data ?? null)
    } catch {
      const msg = "Failed to load reports"
      setError(msg)
      setData(null)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        Sales Reports
      </h1>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="reports-start">Start date</Label>
            <Input
              id="reports-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reports-end">End date</Label>
            <Input
              id="reports-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => void load()}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border bg-card">
          <EmptyState
            icon={
              <AlertIcon className="text-destructive" stroke={1.25} aria-hidden />
            }
            title="Couldn’t load reports"
            description={error}
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => void load()}
                disabled={loading}
              >
                Try again
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <ReportsSummary data={data} loading={loading} />

          <ReportsChart
            dealsByMonth={data?.dealsByMonth ?? []}
            dealsByStage={data?.dealsByStage ?? []}
            loading={loading}
          />

          {isAdmin ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">
                Top performers
              </h2>
              <div className="overflow-x-auto rounded-lg border bg-card">
                {loading ? (
                  <div className="h-40 animate-pulse bg-muted/30" />
                ) : !data || data.topPerformers.length === 0 ? (
                  <EmptyState
                    icon={<ReportsIcon stroke={1.25} aria-hidden />}
                    title="No top performers yet"
                    description="No closed won deals in this date range."
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rep</TableHead>
                        <TableHead className="text-right">Closed deals</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topPerformers.map((row) => (
                        <TableRow key={row.userId}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.closedDeals}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(row.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
