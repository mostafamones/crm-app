"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { dealStatusLabel } from "@/lib/deal-status"
import type { DealStatusBreakdown } from "@/types"

const BAR_COLORS = [
  "#3b82f6",
  "#60a5fa",
  "#f59e0b",
  "#34d399",
  "#f87171",
]

type ChartRow = {
  name: string
  count: number
  fill: string
}

function buildChartData(rows: DealStatusBreakdown[]): ChartRow[] {
  return rows.map((row, i) => ({
    name: dealStatusLabel(row.status),
    count: row.count,
    fill: BAR_COLORS[i % BAR_COLORS.length] ?? "#64748b",
  }))
}

export default function SalesFunnelChart({
  dealsByStage,
}: {
  dealsByStage: DealStatusBreakdown[]
}) {
  const data = buildChartData(dealsByStage)

  return (
    <Card className="gap-4 border-border p-6 shadow-card">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-semibold">Sales funnel</CardTitle>
        <CardDescription>Deal count by pipeline stage</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-0">
        <div className="h-[min(360px,50vh)] w-full min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/60"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={56}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--foreground))",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value) => [
                  typeof value === "number" ? value : Number(value ?? 0),
                  "Deals",
                ]}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {data.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
