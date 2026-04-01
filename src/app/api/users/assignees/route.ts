import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * Active users for deal assignment (managers/admins).
 * Separate from GET /api/users, which is admin-only full listing.
 */
export async function GET() {
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

  try {
    const users = await prisma.user.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    })

    return Response.json({ data: users })
  } catch {
    return Response.json({ error: "Failed to load users" }, { status: 500 })
  }
}
