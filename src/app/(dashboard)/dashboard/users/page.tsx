import { redirect } from "next/navigation"
import { auth } from "@/auth"
import UsersPageClient from "@/components/users/UsersPageClient"

export default async function UsersPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return <UsersPageClient currentUserId={session.user.id} />
}
