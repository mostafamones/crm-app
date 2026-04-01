import type { Session } from "next-auth"
import { Prisma, Role as PrismaRole } from "@/generated/prisma"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

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

type PatchUserBody = {
  name?: unknown
  email?: unknown
  role?: unknown
  status?: unknown
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const denied = requireAdmin(session)
  if (denied) return denied

  const { id } = await context.params

  let body: PatchUserBody
  try {
    body = (await req.json()) as PatchUserBody
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!isPlainObject(body)) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    })

    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    const data: Prisma.UserUpdateInput = {}

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return Response.json({ error: "Invalid name" }, { status: 400 })
      }
      data.name = body.name.trim()
    }

    if (body.email !== undefined) {
      if (typeof body.email !== "string" || !body.email.trim()) {
        return Response.json({ error: "Invalid email" }, { status: 400 })
      }
      const nextEmail = body.email.trim()
      if (nextEmail !== existing.email) {
        const taken = await prisma.user.findUnique({
          where: { email: nextEmail },
          select: { id: true },
        })
        if (taken) {
          return Response.json({ error: "Email is already in use" }, { status: 400 })
        }
      }
      data.email = nextEmail
    }

    if (body.role !== undefined) {
      if (typeof body.role !== "string" || !ROLE_STRINGS.has(body.role)) {
        return Response.json({ error: "Invalid role" }, { status: 400 })
      }
      data.role = body.role as PrismaRole
    }

    if (body.status !== undefined) {
      const s = typeof body.status === "string" ? body.status.trim() : ""
      if (s !== "active" && s !== "inactive") {
        return Response.json({ error: "Invalid status" }, { status: 400 })
      }
      data.status = s
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })

    return Response.json({ data: updated })
  } catch {
    return Response.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const denied = requireAdmin(session)
  if (denied) return denied
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sessionUserId = session.user.id
  const { id } = await context.params

  if (id === sessionUserId) {
    return Response.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    )
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        _count: { select: { leads: true, deals: true } },
      },
    })

    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    if (existing._count.leads > 0 || existing._count.deals > 0) {
      return Response.json(
        {
          error:
            "Cannot delete a user who owns leads or deals. Deactivate the account instead.",
        },
        { status: 400 }
      )
    }

    await prisma.user.delete({ where: { id } })

    return Response.json({ message: "User deleted" })
  } catch {
    return Response.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
