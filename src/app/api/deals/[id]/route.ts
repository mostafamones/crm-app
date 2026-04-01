import { DealStatus as PrismaDealStatus, Prisma } from "@/generated/prisma"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const ASSIGNED_DETAIL_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const

const OWNER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const

const dealDetailInclude = {
  assignedTo: { select: ASSIGNED_DETAIL_SELECT },
  customer: true,
  lead: {
    include: {
      owner: { select: OWNER_SELECT },
    },
  },
} as const

const DEAL_STATUS_VALUES = new Set<string>(
  Object.values(PrismaDealStatus) as string[]
)

function probabilityForStatus(status: PrismaDealStatus): number {
  switch (status) {
    case PrismaDealStatus.NEW_LEAD:
      return 10
    case PrismaDealStatus.CONTACTED:
      return 30
    case PrismaDealStatus.PROPOSAL:
      return 60
    case PrismaDealStatus.CLOSED_WON:
      return 100
    case PrismaDealStatus.CLOSED_LOST:
      return 0
    default:
      return 0
  }
}

type PatchDealBody = {
  title?: unknown
  amount?: unknown
  status?: unknown
  assignedToId?: unknown
  customerId?: unknown
  expectedCloseDate?: unknown
  leadId?: unknown
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: dealDetailInclude,
    })

    if (!deal) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    if (
      session.user.role === "SALES_REP" &&
      deal.assignedToId !== session.user.id
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    return Response.json({ data: deal })
  } catch {
    return Response.json({ error: "Failed to load deal" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  let body: PatchDealBody
  try {
    body = (await req.json()) as PatchDealBody
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!isPlainObject(body)) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const isManagerOrAdmin =
    session.user.role === "ADMIN" || session.user.role === "SALES_MANAGER"

  if (session.user.role === "SALES_REP") {
    const allowedKeys = new Set(["status"])
    const providedKeys = Object.keys(body).filter(
      (k) => body[k as keyof PatchDealBody] !== undefined
    )
    if (providedKeys.some((k) => !allowedKeys.has(k))) {
      return Response.json(
        { error: "Only status can be updated" },
        { status: 400 }
      )
    }
    if (body.status === undefined) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 })
    }
  }

  try {
    const existing = await prisma.deal.findUnique({
      where: { id },
      select: { id: true, assignedToId: true, status: true },
    })

    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    if (
      session.user.role === "SALES_REP" &&
      existing.assignedToId !== session.user.id
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const data: Prisma.DealUpdateInput = {}

    if (isManagerOrAdmin && body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return Response.json({ error: "Invalid title" }, { status: 400 })
      }
      data.title = body.title.trim()
    }

    if (isManagerOrAdmin && body.amount !== undefined) {
      if (typeof body.amount !== "number" || !Number.isFinite(body.amount)) {
        return Response.json({ error: "Amount must be a number" }, { status: 400 })
      }
      if (body.amount <= 0) {
        return Response.json({ error: "Amount must be positive" }, { status: 400 })
      }
      data.amount = body.amount
    }

    if (body.status !== undefined) {
      if (
        typeof body.status !== "string" ||
        !DEAL_STATUS_VALUES.has(body.status)
      ) {
        return Response.json({ error: "Invalid status" }, { status: 400 })
      }
      const nextStatus = body.status as PrismaDealStatus
      data.status = nextStatus
      data.probability = probabilityForStatus(nextStatus)
    }

    if (isManagerOrAdmin && body.assignedToId !== undefined) {
      if (body.assignedToId === null) {
        return Response.json({ error: "Invalid assignedToId" }, { status: 400 })
      }
      if (typeof body.assignedToId !== "string" || !body.assignedToId.trim()) {
        return Response.json({ error: "Invalid assignedToId" }, { status: 400 })
      }
      const assignee = await prisma.user.findUnique({
        where: { id: body.assignedToId.trim() },
        select: { id: true },
      })
      if (!assignee) {
        return Response.json({ error: "Assignee not found" }, { status: 400 })
      }
      data.assignedTo = { connect: { id: assignee.id } }
    }

    if (isManagerOrAdmin && body.customerId !== undefined) {
      if (body.customerId === null) {
        data.customer = { disconnect: true }
      } else if (typeof body.customerId === "string" && body.customerId.trim()) {
        const customer = await prisma.customer.findUnique({
          where: { id: body.customerId.trim() },
          select: { id: true },
        })
        if (!customer) {
          return Response.json({ error: "Customer not found" }, { status: 400 })
        }
        data.customer = { connect: { id: customer.id } }
      } else {
        return Response.json({ error: "Invalid customerId" }, { status: 400 })
      }
    }

    if (isManagerOrAdmin && body.expectedCloseDate !== undefined) {
      if (body.expectedCloseDate === null) {
        data.expectedCloseDate = null
      } else if (
        typeof body.expectedCloseDate === "string" &&
        body.expectedCloseDate.trim() !== ""
      ) {
        const d = new Date(body.expectedCloseDate)
        if (Number.isNaN(d.getTime())) {
          return Response.json(
            { error: "Invalid expectedCloseDate" },
            { status: 400 }
          )
        }
        data.expectedCloseDate = d
      } else {
        return Response.json(
          { error: "Invalid expectedCloseDate" },
          { status: 400 }
        )
      }
    }

    if (isManagerOrAdmin && body.leadId !== undefined) {
      if (body.leadId === null) {
        data.lead = { disconnect: true }
      } else if (typeof body.leadId === "string" && body.leadId.trim()) {
        const lead = await prisma.lead.findUnique({
          where: { id: body.leadId.trim() },
          select: { id: true, deal: { select: { id: true } } },
        })
        if (!lead) {
          return Response.json({ error: "Lead not found" }, { status: 400 })
        }
        if (lead.deal !== null && lead.deal.id !== id) {
          return Response.json(
            { error: "Lead is already linked to another deal" },
            { status: 400 }
          )
        }
        data.lead = { connect: { id: lead.id } }
      } else {
        return Response.json({ error: "Invalid leadId" }, { status: 400 })
      }
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const updated = await prisma.deal.update({
      where: { id },
      data,
      include: dealDetailInclude,
    })

    return Response.json({ data: updated })
  } catch {
    return Response.json({ error: "Failed to update deal" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role === "SALES_REP") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await context.params

  try {
    const existing = await prisma.deal.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.deal.delete({ where: { id } })

    return Response.json({ message: "Deal deleted" })
  } catch {
    return Response.json({ error: "Failed to delete deal" }, { status: 500 })
  }
}
