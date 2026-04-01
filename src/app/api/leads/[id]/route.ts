import { LeadStatus as PrismaLeadStatus, Prisma } from "@/generated/prisma"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const OWNER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const

const DEAL_ASSIGNED_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const

const LEAD_STATUS_VALUES = new Set<string>(
  Object.values(PrismaLeadStatus) as string[]
)

const leadIncludeDetail = {
  owner: { select: OWNER_SELECT },
  deal: {
    include: {
      assignedTo: { select: DEAL_ASSIGNED_SELECT },
      customer: true,
    },
  },
} as const

function canEditLead(
  role: "ADMIN" | "SALES_MANAGER" | "SALES_REP",
  leadOwnerId: string,
  sessionUserId: string
): boolean {
  if (role === "SALES_REP") {
    return leadOwnerId === sessionUserId
  }
  return true
}

type PatchLeadBody = {
  name?: unknown
  source?: unknown
  status?: unknown
  lastContactDate?: unknown
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
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: leadIncludeDetail,
    })

    if (!lead) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    if (
      session.user.role === "SALES_REP" &&
      lead.ownerId !== session.user.id
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    return Response.json({ data: lead })
  } catch {
    return Response.json({ error: "Failed to load lead" }, { status: 500 })
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

  let body: PatchLeadBody
  try {
    body = (await req.json()) as PatchLeadBody
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  try {
    const existing = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    })

    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    if (!canEditLead(session.user.role, existing.ownerId, session.user.id)) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const data: Prisma.LeadUpdateInput = {}

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return Response.json({ error: "Invalid name" }, { status: 400 })
      }
      data.name = body.name.trim()
    }

    if (body.source !== undefined) {
      if (typeof body.source !== "string" || !body.source.trim()) {
        return Response.json({ error: "Invalid source" }, { status: 400 })
      }
      data.source = body.source.trim()
    }

    if (body.status !== undefined) {
      if (
        typeof body.status !== "string" ||
        !LEAD_STATUS_VALUES.has(body.status)
      ) {
        return Response.json({ error: "Invalid status" }, { status: 400 })
      }
      data.status = body.status as PrismaLeadStatus
    }

    if (body.lastContactDate !== undefined) {
      if (body.lastContactDate === null) {
        data.lastContactDate = null
      } else if (
        typeof body.lastContactDate === "string" &&
        body.lastContactDate.trim() !== ""
      ) {
        const d = new Date(body.lastContactDate)
        if (Number.isNaN(d.getTime())) {
          return Response.json(
            { error: "Invalid lastContactDate" },
            { status: 400 }
          )
        }
        data.lastContactDate = d
      } else {
        return Response.json(
          { error: "Invalid lastContactDate" },
          { status: 400 }
        )
      }
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const updated = await prisma.lead.update({
      where: { id },
      data,
      include: {
        owner: { select: OWNER_SELECT },
      },
    })

    return Response.json({ data: updated })
  } catch {
    return Response.json({ error: "Failed to update lead" }, { status: 500 })
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
    const existing = await prisma.lead.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.deal.updateMany({
        where: { leadId: id },
        data: { leadId: null },
      }),
      prisma.lead.delete({ where: { id } }),
    ])

    return Response.json({ message: "Lead deleted" })
  } catch {
    return Response.json({ error: "Failed to delete lead" }, { status: 500 })
  }
}
