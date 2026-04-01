"use client"

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import type { ReportsMonthRow, ReportsStageRow } from "@/types"

const STAGE_LABEL: Record<string, string> = {
  NEW_LEAD: "New lead",
  CONTACTED: "Contacted",
  PROPOSAL: "Proposal",
  CLOSED_WON: "Closed won",
  CLOSED_LOST: "Closed lost",
}

/** Aligns with agents.md deal status colors (hex for Recharts). */
const STAGE_COLOR: Record<string, string> = {
  NEW_LEAD: "#64748b",
  CONTACTED: "#3b82f6",
  PROPOSAL: "#f59e0b",
  CLOSED_WON: "#22c55e",
  CLOSED_LOST: "#ef4444",
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number)
  if (!y || !m) return ym
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  })
}

type ComposedRow = {
  monthKey: string
  monthLabel: string
  count: number
  revenue: number
}

type PieRow = {
  name: string
  stage: string
  value: number
  fill: string
}

export type ReportsChartProps = {
  dealsByMonth: ReportsMonthRow[]
  dealsByStage: ReportsStageRow[]
  loading?: boolean
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; dataKey?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border bg-background/95 px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="text-muted-foreground">
          {p.name === "revenue" || p.dataKey === "revenue"
            ? `Revenue: ${formatCurrency(p.value ?? 0)}`
            : `${p.name}: ${p.value ?? 0}`}
        </p>
      ))}
    </div>
  )
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; payload?: PieRow }>
}) {
  if (!active || !payload?.[0]) return null
  const row = payload[0].payload as PieRow | undefined
  if (!row) return null
  return (
    <div className="rounded-md border bg-background/95 px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{row.name}</p>
      <p className="text-muted-foreground">Deals: {row.value}</p>
    </div>
  )
}

export default function ReportsChart({
  dealsByMonth,
  dealsByStage,
  loading = false,
}: ReportsChartProps) {
  const composedData: ComposedRow[] = dealsByMonth.map((row) => ({
    monthKey: row.month,
    monthLabel: formatMonthLabel(row.month),
    count: row.count,
    revenue: row.revenue,
  }))

  const pieData: PieRow[] = dealsByStage.map((row) => ({
    name: STAGE_LABEL[row.stage] ?? row.stage,
    stage: row.stage,
    value: row.count,
    fill: STAGE_COLOR[row.stage] ?? "#94a3b8",
  }))

  const pieTotal = pieData.reduce((s, d) => s + d.value, 0)

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[320px] animate-pulse rounded-xl bg-muted/40" />
        <div className="h-[320px] animate-pulse rounded-xl bg-muted/40" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Deals by month
        </h3>
        {composedData.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No data in this range.
          </p>
        ) : (
          <div className="h-[min(360px,55vh)] w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={composedData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                  width={40}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                  }
                  width={48}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="count"
                  name="Deal count"
                  fill="hsl(221.2 83.2% 53.3%)"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="hsl(142 76% 36%)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Deals by stage
        </h3>
        {pieTotal === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No deals in this range.
          </p>
        ) : (
          <div className="h-[min(360px,55vh)] w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={100}
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.stage} fill={entry.fill} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
