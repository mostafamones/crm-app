"use client"

import { useCallback, useEffect, useState } from "react"
import CustomerForm from "@/components/customers/CustomerForm"
import CustomersTable from "@/components/customers/CustomersTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon, SearchIcon } from "@/lib/icons"
import type { CustomerListApi, UserRole } from "@/types"
import { toast } from "sonner"

export type CustomersPageClientProps = {
  userRole: UserRole
}

export default function CustomersPageClient({
  userRole,
}: CustomersPageClientProps) {
  const [customers, setCustomers] = useState<CustomerListApi[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 300)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      const q = params.toString()
      const url = q ? `/api/customers?${q}` : "/api/customers"
      const res = await fetch(url)
      const body = (await res.json()) as {
        data?: CustomerListApi[]
        error?: string
      }
      if (!res.ok) {
        const msg = body.error ?? "Failed to load customers"
        setLoadError(msg)
        setCustomers([])
        toast.error(msg)
        return
      }
      setCustomers(body.data ?? [])
    } catch {
      const msg = "Failed to load customers"
      setLoadError(msg)
      setCustomers([])
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Customers
        </h1>
        <Button
          type="button"
          className="w-full shrink-0 gap-2 sm:w-auto"
          onClick={() => setAddOpen(true)}
        >
          <PlusIcon className="size-4" aria-hidden />
          Add Customer
        </Button>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="customers-search"
          className="text-xs font-medium uppercase text-muted-foreground"
        >
          Search
        </Label>
        <div className="relative max-w-md">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="customers-search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, company, or email..."
            className="pl-9"
            autoComplete="off"
          />
        </div>
      </div>

      <CustomersTable
        customers={customers}
        onRefresh={loadCustomers}
        userRole={userRole}
        loading={loading}
        loadError={loadError}
        onRetryLoad={() => void loadCustomers()}
      />

      {addOpen ? (
        <CustomerForm
          onSuccess={() => {
            setAddOpen(false)
            void loadCustomers()
          }}
          onClose={() => setAddOpen(false)}
        />
      ) : null}
    </div>
  )
}
