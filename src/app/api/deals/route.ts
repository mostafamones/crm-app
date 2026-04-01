import { DealStatus as PrismaDealStatus, Prisma } from "@/generated/prisma"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { DealStatus } from "@/types"

const ASSIGNED_LIST_SELECT = {
  id: true,
  name: true,
  role: true,
} as const

const CUSTOMER_LIST_SELECT = {
  id: true,
  name: true,
  companyName: true,
} as const

const dealListInclude = {
  assignedTo: { select: ASSIGNED_LIST_SELECT },
  customer: { select: CUSTOMER_LIST_SELECT },
} as const

const DEAL_STATUS_VALUES = new Set<string>(
  Object.values(PrismaDealStatus) as string[]
)

function parseDealStatus(value: string | null): DealStatus | null {
  if (!value) return null
  if (!DEAL_STATUS_VALUES.has(value)) return null
  return value as DealStatus
}

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

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const statusRaw = searchParams.get("status")
  const searchRaw = searchParams.get("search")

  const statusFilter = parseDealStatus(statusRaw)
  if (statusRaw && statusFilter === null) {
    return Response.json({ error: "Invalid status value" }, { status: 400 })
  }

  const search =
    typeof searchRaw === "string" && searchRaw.trim() !== ""
      ? searchRaw.trim()
      : null

  const role = session.user.role
  const baseWhere: Prisma.DealWhereInput =
    role === "SALES_REP" ? { assignedToId: session.user.id } : {}

  const where: Prisma.DealWhereInput = {
    ...baseWhere,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(search ? { title: { contains: search } } : {}),
  }

  try {
    const [rows, total] = await prisma.$transaction([
      prisma.deal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: dealListInclude,
      }),
      prisma.deal.count({ where }),
    ])

    return Response.json({ data: rows, total })
  } catch {
    return Response.json({ error: "Failed to load deals" }, { status: 500 })
  }
}

type CreateDealBody = {
  title?: unknown
  amount?: unknown
  status?: unknown
  assignedToId?: unknown
  customerId?: unknown
  expectedCloseDate?: unknown
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: CreateDealBody
  try {
    body = (await req.json()) as CreateDealBody
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const title =
    typeof body.title === "string" ? body.title.trim() : ""
  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 })
  }

  if (typeof body.amount !== "number" || !Number.isFinite(body.amount)) {
    return Response.json({ error: "Amount must be a number" }, { status: 400 })
  }
  if (body.amount <= 0) {
    return Response.json({ error: "Amount must be positive" }, { status: 400 })
  }

  let status: PrismaDealStatus = PrismaDealStatus.NEW_LEAD
  if (body.status !== undefined && body.status !== null) {
    if (typeof body.status !== "string" || !DEAL_STATUS_VALUES.has(body.status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 })
    }
    status = body.status as PrismaDealStatus
  }

  const probability = probabilityForStatus(status)

  let assignedToId: string
  if (session.user.role === "SALES_REP") {
    assignedToId = session.user.id
  } else {
    if (
      body.assignedToId !== undefined &&
      body.assignedToId !== null &&
      String(body.assignedToId).trim() !== ""
    ) {
      if (typeof body.assignedToId !== "string") {
        return Response.json({ error: "Invalid assignedToId" }, { status: 400 })
      }
      assignedToId = body.assignedToId.trim()
    } else {
      assignedToId = session.user.id
    }

    const assignee = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: { id: true },
    })
    if (!assignee) {
      return Response.json({ error: "Assignee not found" }, { status: 400 })
    }
  }

  let customerId: string | undefined
  if (
    body.customerId !== undefined &&
    body.customerId !== null &&
    String(body.customerId).trim() !== ""
  ) {
    if (typeof body.customerId !== "string") {
      return Response.json({ error: "Invalid customerId" }, { status: 400 })
    }
    const cid = body.customerId.trim()
    const customer = await prisma.customer.findUnique({
      where: { id: cid },
      select: { id: true },
    })
    if (!customer) {
      return Response.json({ error: "Customer not found" }, { status: 400 })
    }
    customerId = customer.id
  }

  let expectedCloseDate: Date | undefined
  if (
    body.expectedCloseDate !== undefined &&
    body.expectedCloseDate !== null &&
    String(body.expectedCloseDate).trim() !== ""
  ) {
    if (typeof body.expectedCloseDate !== "string") {
      return Response.json({ error: "Invalid expectedCloseDate" }, { status: 400 })
    }
    const d = new Date(body.expectedCloseDate)
    if (Number.isNaN(d.getTime())) {
      return Response.json({ error: "Invalid expectedCloseDate" }, { status: 400 })
    }
    expectedCloseDate = d
  }

  try {
    const created = await prisma.deal.create({
      data: {
        title,
        amount: body.amount,
        status,
        probability,
        assignedToId,
        ...(customerId !== undefined ? { customerId } : {}),
        ...(expectedCloseDate !== undefined ? { expectedCloseDate } : {}),
      },
      include: dealListInclude,
    })

    return Response.json({ data: created }, { status: 201 })
  } catch {
    return Response.json({ error: "Failed to create deal" }, { status: 500 })
  }
}
