import { DealStatus as PrismaDealStatus, Prisma } from "@/generated/prisma"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const ACTIVE_DEAL_WHERE = {
  status: {
    notIn: [PrismaDealStatus.CLOSED_WON, PrismaDealStatus.CLOSED_LOST],
  },
} satisfies Prisma.DealWhereInput

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const searchRaw = searchParams.get("search")
  const search =
    typeof searchRaw === "string" && searchRaw.trim() !== ""
      ? searchRaw.trim()
      : null

  const where: Prisma.CustomerWhereInput = search
    ? {
        OR: [
          { name: { contains: search } },
          { companyName: { contains: search } },
          { email: { contains: search } },
        ],
      }
    : {}

  try {
    const rows = await prisma.customer.findMany({
      where,
      orderBy: { companyName: "asc" },
      include: {
        deals: {
          where: ACTIVE_DEAL_WHERE,
          select: { id: true },
        },
      },
    })

    const data = rows.map(({ deals, ...customer }) => ({
      ...customer,
      activeDealsCount: deals.length,
    }))

    return Response.json({ data })
  } catch {
    return Response.json({ error: "Failed to load customers" }, { status: 500 })
  }
}

type CreateCustomerBody = {
  name?: unknown
  companyName?: unknown
  email?: unknown
  phone?: unknown
  address?: unknown
  notes?: unknown
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: CreateCustomerBody
  try {
    body = (await req.json()) as CreateCustomerBody
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const name = typeof body.name === "string" ? body.name.trim() : ""
  const companyName =
    typeof body.companyName === "string" ? body.companyName.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim() : ""

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 })
  }
  if (!companyName) {
    return Response.json({ error: "Company name is required" }, { status: 400 })
  }
  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 })
  }

  const phone =
    body.phone === undefined || body.phone === null
      ? null
      : typeof body.phone === "string" && body.phone.trim() !== ""
        ? body.phone.trim()
        : null

  const address =
    body.address === undefined || body.address === null
      ? null
      : typeof body.address === "string" && body.address.trim() !== ""
        ? body.address.trim()
        : null

  const notes =
    body.notes === undefined || body.notes === null
      ? null
      : typeof body.notes === "string" && body.notes.trim() !== ""
        ? body.notes.trim()
        : null

  try {
    const created = await prisma.customer.create({
      data: {
        name,
        companyName,
        email,
        phone,
        address,
        notes,
      },
      include: {
        deals: {
          where: ACTIVE_DEAL_WHERE,
          select: { id: true },
        },
      },
    })

    const { deals, ...rest } = created
    return Response.json(
      {
        data: {
          ...rest,
          activeDealsCount: deals.length,
        },
      },
      { status: 201 }
    )
  } catch {
    return Response.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
