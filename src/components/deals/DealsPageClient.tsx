"use client"

import { useCallback, useEffect, useState } from "react"
import DealForm from "@/components/deals/DealForm"
import DealsPipeline from "@/components/deals/DealsPipeline"
import DealsTable from "@/components/deals/DealsTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusIcon, SearchIcon } from "@/lib/icons"
import { toast } from "sonner"
import type {
  CustomerApi,
  DealApi,
  DealStatus,
  UserListItem,
  UserRole,
} from "@/types"

const STATUS_FILTER_OPTIONS: Array<{ value: "all" | DealStatus; label: string }> =
  [
    { value: "all", label: "All stages" },
    { value: "NEW_LEAD", label: "New lead" },
    { value: "CONTACTED", label: "Contacted" },
    { value: "PROPOSAL", label: "Proposal" },
    { value: "CLOSED_WON", label: "Closed won" },
    { value: "CLOSED_LOST", label: "Closed lost" },
  ]

export type DealsPageClientProps = {
  userRole: UserRole
  currentUserId: string
}

export default function DealsPageClient({
  userRole,
  currentUserId,
}: DealsPageClientProps) {
  const [deals, setDeals] = useState<DealApi[]>([])
  const [users, setUsers] = useState<UserListItem[]>([])
  const [customers, setCustomers] = useState<CustomerApi[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | DealStatus>("all")
  const [view, setView] = useState<"table" | "pipeline">("table")
  const [addOpen, setAddOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<DealApi | null>(null)

  const canLoadUsers =
    userRole === "ADMIN" || userRole === "SALES_MANAGER"

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 300)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const loadDeals = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (statusFilter !== "all") params.set("status", statusFilter)
      const q = params.toString()
      const url = q ? `/api/deals?${q}` : "/api/deals"
      const res = await fetch(url)
      const body = (await res.json()) as {
        data?: DealApi[]
        error?: string
      }
      if (!res.ok) {
        const msg = body.error ?? "Failed to load deals"
        setLoadError(msg)
        setDeals([])
        toast.error(msg)
        return
      }
      setDeals(body.data ?? [])
    } catch {
      const msg = "Failed to load deals"
      setLoadError(msg)
      setDeals([])
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter])

  const loadMeta = useCallback(async () => {
    try {
      const customersRes = await fetch("/api/customers")
      if (customersRes.ok) {
        const cBody = (await customersRes.json()) as {
          data?: CustomerApi[]
        }
        setCustomers(cBody.data ?? [])
      } else {
        setCustomers([])
        toast.error("Couldn’t load customers for deal form")
      }

      if (canLoadUsers) {
        const usersRes = await fetch("/api/users/assignees")
        if (usersRes.ok) {
          const uBody = (await usersRes.json()) as { data?: UserListItem[] }
          setUsers(uBody.data ?? [])
        } else {
          setUsers([])
          toast.error("Couldn’t load assignees")
        }
      } else {
        setUsers([])
      }
    } catch {
      setCustomers([])
      setUsers([])
      toast.error("Couldn’t load deal form options")
    }
  }, [canLoadUsers])

  useEffect(() => {
    void loadDeals()
  }, [loadDeals])

  useEffect(() => {
    void loadMeta()
  }, [loadMeta])

  function handleFormSuccess() {
    setAddOpen(false)
    setEditingDeal(null)
    void loadDeals()
  }

  function handleFormClose() {
    setAddOpen(false)
    setEditingDeal(null)
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Deals
        </h1>
        <Button
          type="button"
          className="w-full shrink-0 gap-2 sm:w-auto"
          onClick={() => {
            setEditingDeal(null)
            setAddOpen(true)
          }}
        >
          <PlusIcon className="size-4" aria-hidden />
          Add Deal
        </Button>
      </div>

      <Tabs
        value={view}
        onValueChange={(v) => setView(v as "table" | "pipeline")}
        className="flex flex-col gap-6"
      >
        <TabsList variant="line" className="w-full justify-start sm:w-auto">
          <TabsTrigger value="table">Table view</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline view</TabsTrigger>
        </TabsList>

        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Label
              htmlFor="deals-search"
              className="text-xs font-medium uppercase text-muted-foreground"
            >
              Search
            </Label>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="deals-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title..."
                className="pl-9"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="w-full space-y-2 sm:w-52">
            <Label
              htmlFor="deals-status"
              className="text-xs font-medium uppercase text-muted-foreground"
            >
              Status
            </Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "all" | DealStatus)}
            >
              <SelectTrigger id="deals-status" className="w-full">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="table" className="mt-0">
          <DealsTable
            deals={deals}
            onRefresh={loadDeals}
            userRole={userRole}
            onEdit={(d) => {
              setAddOpen(false)
              setEditingDeal(d)
            }}
            loading={loading}
            loadError={loadError}
            onRetryLoad={() => void loadDeals()}
          />
        </TabsContent>

        <TabsContent value="pipeline" className="mt-0">
          <DealsPipeline
            deals={deals}
            onDealClick={(d) => {
              setAddOpen(false)
              setEditingDeal(d)
            }}
            loading={loading}
            loadError={loadError}
            onRetryLoad={() => void loadDeals()}
          />
        </TabsContent>
      </Tabs>

      {addOpen || editingDeal ? (
        <DealForm
          key={editingDeal?.id ?? "new"}
          deal={editingDeal ?? undefined}
          users={users}
          customers={customers}
          currentUserId={currentUserId}
          userRole={userRole}
          onSuccess={handleFormSuccess}
          onClose={handleFormClose}
        />
      ) : null}
    </div>
  )
}
