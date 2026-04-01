import type { ComponentType } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingDownIcon, TrendingUpIcon } from "@/lib/icons"

type IconProps = { className?: string; size?: number }

export type KPICardProps = {
  title: string
  value: string | number
  subtitle?: string
  icon: ComponentType<IconProps>
  trend?: "up" | "down" | "neutral"
  color?: "blue" | "green" | "red" | "amber"
}

const colorStyles: Record<
  NonNullable<KPICardProps["color"]>,
  { circle: string; icon: string }
> = {
  blue: {
    circle: "bg-blue-500/15 text-blue-400",
    icon: "text-blue-400",
  },
  green: {
    circle: "bg-emerald-500/15 text-emerald-400",
    icon: "text-emerald-400",
  },
  red: {
    circle: "bg-red-500/15 text-red-400",
    icon: "text-red-400",
  },
  amber: {
    circle: "bg-amber-500/15 text-amber-400",
    icon: "text-amber-400",
  },
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "blue",
}: KPICardProps) {
  const palette = colorStyles[color]

  return (
    <Card className="gap-4 border-border p-6 shadow-card">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-0 pt-0 pb-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-full",
            palette.circle
          )}
        >
          <Icon size={20} className={palette.icon} aria-hidden />
        </div>
      </CardHeader>
      <CardContent className="space-y-1 px-0 pb-0">
        <div className="flex flex-wrap items-end gap-2">
          <p className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {value}
          </p>
          {trend ? (
            <span
              className={cn(
                "mb-1 flex items-center text-xs font-medium",
                trend === "up" && "text-emerald-400",
                trend === "down" && "text-red-400",
                trend === "neutral" && "text-muted-foreground"
              )}
              aria-hidden
            >
              {trend === "up" ? (
                <TrendingUpIcon size={14} />
              ) : trend === "down" ? (
                <TrendingDownIcon size={14} />
              ) : (
                <span className="inline-block size-1.5 rounded-full bg-muted-foreground" />
              )}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
