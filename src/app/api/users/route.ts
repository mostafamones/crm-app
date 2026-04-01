import bcrypt from "bcryptjs"
import type { Session } from "next-auth"
import { Role as PrismaRole } from "@/generated/prisma"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@/types"

const ROLE_STRINGS = new Set<string>(
  Object.values(PrismaRole) as string[]
)

function requireAdmin(session: Session | null): Response | null {
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

export async function GET() {
  const session = await auth()
  const denied = requireAdmin(session)
  if (denied) return denied

  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })

    return Response.json({ data: users })
  } catch {
    return Response.json({ error: "Failed to load users" }, { status: 500 })
  }
}

type CreateUserBody = {
  name?: unknown
  email?: unknown
  password?: unknown
  role?: unknown
}

export async function POST(req: Request) {
  const session = await auth()
  const denied = requireAdmin(session)
  if (denied) return denied

  let body: CreateUserBody
  try {
    body = (await req.json()) as CreateUserBody
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const name = typeof body.name === "string" ? body.name.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim() : ""
  const password = typeof body.password === "string" ? body.password : ""

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 })
  }
  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 })
  }
  if (password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    )
  }
  if (typeof body.role !== "string" || !ROLE_STRINGS.has(body.role)) {
    return Response.json({ error: "Invalid role" }, { status: 400 })
  }

  const role = body.role as UserRole

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (existing) {
    return Response.json({ error: "Email is already in use" }, { status: 400 })
  }

  const passwordHash = bcrypt.hashSync(password, 10)

  try {
    const created = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        status: "active",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })

    return Response.json({ data: created }, { status: 201 })
  } catch {
    return Response.json({ error: "Failed to create user" }, { status: 500 })
  }
}
