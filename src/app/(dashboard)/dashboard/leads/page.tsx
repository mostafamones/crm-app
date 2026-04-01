import { redirect } from "next/navigation"
import { auth } from "@/auth"
import LeadsPageClient from "@/components/leads/LeadsPageClient"

export default async function LeadsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return <LeadsPageClient userRole={session.user.role} />
}
