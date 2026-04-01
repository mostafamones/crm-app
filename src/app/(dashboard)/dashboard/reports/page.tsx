import { redirect } from "next/navigation"
import { auth } from "@/auth"
import ReportsPageClient from "@/components/reports/ReportsPageClient"

export default async function ReportsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role === "SALES_REP") {
    redirect("/dashboard")
  }

  return <ReportsPageClient isAdmin={session.user.role === "ADMIN"} />
}
