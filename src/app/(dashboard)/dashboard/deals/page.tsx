import { redirect } from "next/navigation"
import { auth } from "@/auth"
import DealsPageClient from "@/components/deals/DealsPageClient"

export default async function DealsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <DealsPageClient
      userRole={session.user.role}
      currentUserId={session.user.id}
    />
  )
}
