import { Prisma } from "@/generated/prisma"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const DEAL_ASSIGNED_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const

const customerDetailInclude = {
  deals: {
    orderBy: { createdAt: "desc" as const },
    include: {
      assignedTo: { select: DEAL_ASSIGNED_SELECT },
    },
  },
} as const

type PatchCustomerBody = {
  name?: unknown
  companyName?: unknown
  email?: unknown
  phone?: unknown
  address?: unknown
  notes?: unknown
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
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: customerDetailInclude,
    })

    if (!customer) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    return Response.json({ data: customer })
  } catch {
    return Response.json({ error: "Failed to load customer" }, { status: 500 })
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

  let body: PatchCustomerBody
  try {
    body = (await req.json()) as PatchCustomerBody
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!isPlainObject(body)) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  try {
    const existing = await prisma.customer.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    const data: Prisma.CustomerUpdateInput = {}

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return Response.json({ error: "Invalid name" }, { status: 400 })
      }
      data.name = body.name.trim()
    }

    if (body.companyName !== undefined) {
      if (typeof body.companyName !== "string" || !body.companyName.trim()) {
        return Response.json({ error: "Invalid company name" }, { status: 400 })
      }
      data.companyName = body.companyName.trim()
    }

    if (body.email !== undefined) {
      if (typeof body.email !== "string" || !body.email.trim()) {
        return Response.json({ error: "Invalid email" }, { status: 400 })
      }
      data.email = body.email.trim()
    }

    if (body.phone !== undefined) {
      if (body.phone === null) {
        data.phone = null
      } else if (typeof body.phone === "string") {
        data.phone = body.phone.trim() === "" ? null : body.phone.trim()
      } else {
        return Response.json({ error: "Invalid phone" }, { status: 400 })
      }
    }

    if (body.address !== undefined) {
      if (body.address === null) {
        data.address = null
      } else if (typeof body.address === "string") {
        data.address = body.address.trim() === "" ? null : body.address.trim()
      } else {
        return Response.json({ error: "Invalid address" }, { status: 400 })
      }
    }

    if (body.notes !== undefined) {
      if (body.notes === null) {
        data.notes = null
      } else if (typeof body.notes === "string") {
        data.notes = body.notes.trim() === "" ? null : body.notes.trim()
      } else {
        return Response.json({ error: "Invalid notes" }, { status: 400 })
      }
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const updated = await prisma.customer.update({
      where: { id },
      data,
      include: customerDetailInclude,
    })

    return Response.json({ data: updated })
  } catch {
    return Response.json({ error: "Failed to update customer" }, { status: 500 })
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

  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "SALES_MANAGER"
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await context.params

  try {
    const existing = await prisma.customer.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.deal.updateMany({
        where: { customerId: id },
        data: { customerId: null },
      }),
      prisma.customer.delete({ where: { id } }),
    ])

    return Response.json({ message: "Customer deleted" })
  } catch {
    return Response.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
