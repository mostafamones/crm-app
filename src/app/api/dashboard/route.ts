import { DealStatus, Prisma } from "@/generated/prisma"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { DashboardKPIs, DashboardRecentDeal, DealStatusBreakdown } from "@/types"

const ALL_DEAL_STATUSES: DealStatus[] = [
  DealStatus.NEW_LEAD,
  DealStatus.CONTACTED,
  DealStatus.PROPOSAL,
  DealStatus.CLOSED_WON,
  DealStatus.CLOSED_LOST,
]

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: userId, role } = session.user

  const isRepOnly = role === "SALES_REP"

  const dealWhere: Prisma.DealWhereInput = isRepOnly
    ? { assignedToId: userId }
    : {}

  const leadWhere: Prisma.LeadWhereInput = isRepOnly
    ? { ownerId: userId }
    : {}

  try {
    const [
      totalLeads,
      totalDeals,
      closedWon,
      closedLost,
      dealsInPipeline,
      revenueAgg,
      cntNewLead,
      cntContacted,
      cntProposal,
      recentRows,
    ] = await prisma.$transaction([
      prisma.lead.count({ where: leadWhere }),
      prisma.deal.count({ where: dealWhere }),
      prisma.deal.count({
        where: { ...dealWhere, status: DealStatus.CLOSED_WON },
      }),
      prisma.deal.count({
        where: { ...dealWhere, status: DealStatus.CLOSED_LOST },
      }),
      prisma.deal.count({
        where: {
          ...dealWhere,
          status: {
            notIn: [DealStatus.CLOSED_WON, DealStatus.CLOSED_LOST],
          },
        },
      }),
      prisma.deal.aggregate({
        where: { ...dealWhere, status: DealStatus.CLOSED_WON },
        _sum: { amount: true },
      }),
      prisma.deal.count({
        where: { ...dealWhere, status: DealStatus.NEW_LEAD },
      }),
      prisma.deal.count({
        where: { ...dealWhere, status: DealStatus.CONTACTED },
      }),
      prisma.deal.count({
        where: { ...dealWhere, status: DealStatus.PROPOSAL },
      }),
      prisma.deal.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        where: dealWhere,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              companyName: true,
              email: true,
            },
          },
        },
      }),
    ])

    const stageCountMap: Record<DealStatus, number> = {
      [DealStatus.NEW_LEAD]: cntNewLead,
      [DealStatus.CONTACTED]: cntContacted,
      [DealStatus.PROPOSAL]: cntProposal,
      [DealStatus.CLOSED_WON]: closedWon,
      [DealStatus.CLOSED_LOST]: closedLost,
    }

    const dealsByStage: DealStatusBreakdown[] = ALL_DEAL_STATUSES.map(
      (status) => ({
        status,
        count: stageCountMap[status],
      })
    )

    const conversionRate =
      totalDeals === 0
        ? 0
        : Math.round((closedWon / totalDeals) * 1000) / 10

    const totalRevenue = revenueAgg._sum.amount ?? 0

    const recentDeals: DashboardRecentDeal[] = recentRows.map((d) => ({
      id: d.id,
      title: d.title,
      amount: d.amount,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
      expectedCloseDate: d.expectedCloseDate
        ? d.expectedCloseDate.toISOString()
        : null,
      assignedToId: d.assignedToId,
      assignedTo: {
        id: d.assignedTo.id,
        name: d.assignedTo.name,
        email: d.assignedTo.email,
        role: d.assignedTo.role,
      },
      customer: d.customer
        ? {
            id: d.customer.id,
            name: d.customer.name,
            companyName: d.customer.companyName,
            email: d.customer.email,
          }
        : null,
    }))

    const payload: DashboardKPIs = {
      totalLeads,
      totalDeals,
      closedWon,
      closedLost,
      conversionRate,
      totalRevenue,
      dealsInPipeline,
      dealsByStage,
      recentDeals,
    }

    return Response.json({ data: payload })
  } catch {
    return Response.json({ error: "Failed to load dashboard" }, { status: 500 })
  }
}
