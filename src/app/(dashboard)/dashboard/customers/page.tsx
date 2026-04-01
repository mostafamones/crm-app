import { redirect } from "next/navigation"
import { auth } from "@/auth"
import CustomersPageClient from "@/components/customers/CustomersPageClient"

export default async function CustomersPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return <CustomersPageClient userRole={session.user.role} />
}
