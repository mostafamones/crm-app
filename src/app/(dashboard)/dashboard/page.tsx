import { headers } from "next/headers"
import { auth } from "@/auth"
import DashboardLoadErrorPanel from "@/components/dashboard/DashboardLoadErrorPanel"
import KPICard from "@/components/dashboard/KPICard"
import RecentDeals from "@/components/dashboard/RecentDeals"
import SalesFunnelChart from "@/components/dashboard/SalesFunnelChart"
import { Badge } from "@/components/ui/badge"
import {
  DealsIcon,
  LeadsIcon,
  RevenueIcon,
  TrendingUpIcon,
} from "@/lib/icons"
import { formatCurrency, formatPercentage, getAppBaseUrl } from "@/lib/utils"
import type { DashboardKPIs } from "@/types"

async function fetchDashboardKPIs(): Promise<DashboardKPIs | null> {
  const hdrs = await headers()
  const cookie = hdrs.get("cookie") ?? ""
  const res = await fetch(`${getAppBaseUrl()}/api/dashboard`, {
    headers: { cookie },
    cache: "no-store",
  })
  if (!res.ok) return null
  const body = (await res.json()) as { data: DashboardKPIs }
  return body.data
}

function roleBadgeLabel(
  role: "ADMIN" | "SALES_MANAGER" | "SALES_REP"
): string {
  switch (role) {
    case "ADMIN":
      return "Admin"
    case "SALES_MANAGER":
      return "Manager"
    case "SALES_REP":
      return "Rep"
    default:
      return role
  }
}

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user
  if (!user) {
    return null
  }

  const data = await fetchDashboardKPIs()

  if (!data) {
    return (
      <div className="rounded-lg border bg-card p-6 ring-1 ring-foreground/10">
        <DashboardLoadErrorPanel />
      </div>
    )
  }

  const hour = new Date().getHours()
  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening"

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {greeting}, {user.name}
        </h2>
        <Badge variant="secondary" className="font-normal">
          {roleBadgeLabel(user.role)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Leads"
          value={data.totalLeads}
          icon={LeadsIcon}
          color="blue"
        />
        <KPICard
          title="Total Deals"
          value={data.totalDeals}
          subtitle={`${formatPercentage(data.conversionRate)} conversion`}
          icon={DealsIcon}
          color="amber"
        />
        <KPICard
          title="Closed Won"
          value={data.closedWon}
          icon={TrendingUpIcon}
          color="green"
        />
        <KPICard
          title="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          subtitle="Closed won deals"
          icon={RevenueIcon}
          color="green"
        />
      </div>

      <SalesFunnelChart dealsByStage={data.dealsByStage} />

      <RecentDeals deals={data.recentDeals} />
    </div>
  )
}
