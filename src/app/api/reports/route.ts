import { DealStatus } from "@/generated/prisma"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { ReportsData, ReportsMonthRow, ReportsStageRow } from "@/types"

const ALL_STAGES: DealStatus[] = [
  DealStatus.NEW_LEAD,
  DealStatus.CONTACTED,
  DealStatus.PROPOSAL,
  DealStatus.CLOSED_WON,
  DealStatus.CLOSED_LOST,
]

function parseDateParam(value: string | null): Date | null {
  if (!value || !value.trim()) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0))
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null
  }
  return dt
}

function endOfDayUtc(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999)
  )
}

function defaultYearToDateRange(): { start: Date; end: Date } {
  const now = new Date()
  const end = endOfDayUtc(now)
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0))
  return { start, end }
}

function monthKeyFromDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

function monthKeysBetween(start: Date, end: Date): string[] {
  const keys: string[] = []
  let y = start.getUTCFullYear()
  let m = start.getUTCMonth()
  const endY = end.getUTCFullYear()
  const endM = end.getUTCMonth()
  for (;;) {
    keys.push(`${y}-${String(m + 1).padStart(2, "0")}`)
    if (y === endY && m === endM) break
    m += 1
    if (m > 11) {
      m = 0
      y += 1
    }
  }
  return keys
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role === "SALES_REP") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const startRaw = searchParams.get("startDate")
  const endRaw = searchParams.get("endDate")

  let rangeStart: Date
  let rangeEnd: Date

  const startTrim = startRaw?.trim() ?? ""
  const endTrim = endRaw?.trim() ?? ""

  if (!startTrim && !endTrim) {
    const d = defaultYearToDateRange()
    rangeStart = d.start
    rangeEnd = d.end
  } else if (startTrim && endTrim) {
    const s = parseDateParam(startTrim)
    const e = parseDateParam(endTrim)
    if (!s || !e) {
      return Response.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      )
    }
    rangeStart = new Date(
      Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate(), 0, 0, 0, 0)
    )
    rangeEnd = endOfDayUtc(e)
    if (rangeStart.getTime() > rangeEnd.getTime()) {
      return Response.json(
        { error: "startDate must be before or equal to endDate" },
        { status: 400 }
      )
    }
  } else {
    return Response.json(
      {
        error:
          "Provide both startDate and endDate (YYYY-MM-DD), or omit both for year-to-date",
      },
      { status: 400 }
    )
  }

  try {
    const deals = await prisma.deal.findMany({
      where: {
        createdAt: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      select: {
        createdAt: true,
        status: true,
        amount: true,
        assignedToId: true,
      },
    })

    const totalDeals = deals.length
    let closedWon = 0
    let closedLost = 0
    let totalRevenue = 0

    const stageAgg = new Map<DealStatus, { count: number; value: number }>()
    for (const s of ALL_STAGES) {
      stageAgg.set(s, { count: 0, value: 0 })
    }

    const wonByUser = new Map<
      string,
      { closedDeals: number; revenue: number }
    >()

    for (const d of deals) {
      if (d.status === DealStatus.CLOSED_WON) {
        closedWon += 1
        totalRevenue += d.amount
        const cur = wonByUser.get(d.assignedToId) ?? {
          closedDeals: 0,
          revenue: 0,
        }
        cur.closedDeals += 1
        cur.revenue += d.amount
        wonByUser.set(d.assignedToId, cur)
      } else if (d.status === DealStatus.CLOSED_LOST) {
        closedLost += 1
      }

      const st = stageAgg.get(d.status)
      if (st) {
        st.count += 1
        st.value += d.amount
      }
    }

    const conversionRate =
      totalDeals === 0
        ? 0
        : Math.round((closedWon / totalDeals) * 1000) / 10

    const avgDealSize =
      closedWon === 0 ? 0 : Math.round((totalRevenue / closedWon) * 100) / 100

    const dealsByStage: ReportsStageRow[] = ALL_STAGES.map((status) => {
      const row = stageAgg.get(status) ?? { count: 0, value: 0 }
      return {
        stage: status,
        count: row.count,
        value: Math.round(row.value * 100) / 100,
      }
    })

    const monthKeys = monthKeysBetween(rangeStart, rangeEnd)
    const monthMap = new Map<string, { count: number; revenue: number }>()
    for (const k of monthKeys) {
      monthMap.set(k, { count: 0, revenue: 0 })
    }

    for (const d of deals) {
      const k = monthKeyFromDate(d.createdAt)
      const bucket = monthMap.get(k)
      if (!bucket) continue
      bucket.count += 1
      if (d.status === DealStatus.CLOSED_WON) {
        bucket.revenue += d.amount
      }
    }

    const dealsByMonth: ReportsMonthRow[] = monthKeys.map((month) => {
      const row = monthMap.get(month) ?? { count: 0, revenue: 0 }
      return {
        month,
        count: row.count,
        revenue: Math.round(row.revenue * 100) / 100,
      }
    })

    const performerIds = [...wonByUser.keys()]
    const users =
      performerIds.length === 0
        ? []
        : await prisma.user.findMany({
            where: { id: { in: performerIds } },
            select: { id: true, name: true },
          })
    const nameById = new Map(users.map((u) => [u.id, u.name]))

    const topPerformers = [...wonByUser.entries()]
      .map(([userId, v]) => ({
        userId,
        name: nameById.get(userId) ?? "Unknown",
        closedDeals: v.closedDeals,
        revenue: Math.round(v.revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    const payload: ReportsData = {
      totalDeals,
      closedWon,
      closedLost,
      conversionRate,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgDealSize,
      dealsByStage,
      dealsByMonth,
      topPerformers,
    }

    return Response.json({ data: payload })
  } catch {
    return Response.json({ error: "Failed to load reports" }, { status: 500 })
  }
}
