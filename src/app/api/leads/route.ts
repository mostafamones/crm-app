import { LeadStatus as PrismaLeadStatus, Prisma } from "@/generated/prisma"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { LeadStatus } from "@/types"

const OWNER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const

const LEAD_STATUS_VALUES = new Set<string>(
  Object.values(PrismaLeadStatus) as string[]
)

function parseLeadStatus(value: string | null): LeadStatus | null {
  if (!value) return null
  if (!LEAD_STATUS_VALUES.has(value)) return null
  return value as LeadStatus
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const statusRaw = searchParams.get("status")
  const searchRaw = searchParams.get("search")

  const statusFilter = parseLeadStatus(statusRaw)
  if (statusRaw && statusFilter === null) {
    return Response.json({ error: "Invalid status value" }, { status: 400 })
  }

  const search =
    typeof searchRaw === "string" && searchRaw.trim() !== ""
      ? searchRaw.trim()
      : null

  const role = session.user.role
  const baseWhere: Prisma.LeadWhereInput =
    role === "SALES_REP" ? { ownerId: session.user.id } : {}

  const where: Prisma.LeadWhereInput = {
    ...baseWhere,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(search ? { name: { contains: search } } : {}),
  }

  try {
    const [rows, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          owner: { select: OWNER_SELECT },
        },
      }),
      prisma.lead.count({ where }),
    ])

    return Response.json({ data: rows, total })
  } catch {
    return Response.json({ error: "Failed to load leads" }, { status: 500 })
  }
}

type CreateLeadBody = {
  name?: unknown
  source?: unknown
  status?: unknown
  lastContactDate?: unknown
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: CreateLeadBody
  try {
    body = (await req.json()) as CreateLeadBody
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const name =
    typeof body.name === "string" ? body.name.trim() : ""
  const source =
    typeof body.source === "string" ? body.source.trim() : ""

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 })
  }
  if (!source) {
    return Response.json({ error: "Source is required" }, { status: 400 })
  }

  let status: PrismaLeadStatus = PrismaLeadStatus.NEW
  if (body.status !== undefined && body.status !== null) {
    if (typeof body.status !== "string" || !LEAD_STATUS_VALUES.has(body.status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 })
    }
    status = body.status as PrismaLeadStatus
  }

  let lastContactDate: Date | undefined
  if (
    body.lastContactDate !== undefined &&
    body.lastContactDate !== null &&
    String(body.lastContactDate).trim() !== ""
  ) {
    if (typeof body.lastContactDate !== "string") {
      return Response.json({ error: "Invalid lastContactDate" }, { status: 400 })
    }
    const d = new Date(body.lastContactDate)
    if (Number.isNaN(d.getTime())) {
      return Response.json({ error: "Invalid lastContactDate" }, { status: 400 })
    }
    lastContactDate = d
  }

  try {
    const created = await prisma.lead.create({
      data: {
        name,
        source,
        status,
        ownerId: session.user.id,
        ...(lastContactDate !== undefined ? { lastContactDate } : {}),
      },
      include: {
        owner: { select: OWNER_SELECT },
      },
    })

    return Response.json({ data: created }, { status: 201 })
  } catch {
    return Response.json({ error: "Failed to create lead" }, { status: 500 })
  }
}
