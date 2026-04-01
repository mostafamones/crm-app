"use client"

import { useCallback, useEffect, useState } from "react"
import LeadForm from "@/components/leads/LeadForm"
import LeadsTable from "@/components/leads/LeadsTable"
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
import { PlusIcon, SearchIcon } from "@/lib/icons"
import type { LeadApi, LeadStatus, UserRole } from "@/types"
import { toast } from "sonner"

const STATUS_FILTER_OPTIONS: Array<{ value: "all" | LeadStatus; label: string }> =
  [
    { value: "all", label: "All statuses" },
    { value: "NEW", label: "New" },
    { value: "CONTACTED", label: "Contacted" },
    { value: "QUALIFIED", label: "Qualified" },
    { value: "LOST", label: "Lost" },
  ]

export type LeadsPageClientProps = {
  userRole: UserRole
}

export default function LeadsPageClient({ userRole }: LeadsPageClientProps) {
  const [leads, setLeads] = useState<LeadApi[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all")
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 300)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const loadLeads = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (statusFilter !== "all") params.set("status", statusFilter)
      const q = params.toString()
      const url = q ? `/api/leads?${q}` : "/api/leads"
      const res = await fetch(url)
      const body = (await res.json()) as {
        data?: LeadApi[]
        error?: string
      }
      if (!res.ok) {
        const msg = body.error ?? "Failed to load leads"
        setLoadError(msg)
        setLeads([])
        toast.error(msg)
        return
      }
      setLeads(body.data ?? [])
    } catch {
      const msg = "Failed to load leads"
      setLoadError(msg)
      setLeads([])
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    void loadLeads()
  }, [loadLeads])

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Leads
        </h1>
        <Button
          type="button"
          className="w-full shrink-0 gap-2 sm:w-auto"
          onClick={() => setAddOpen(true)}
        >
          <PlusIcon className="size-4" aria-hidden />
          Add Lead
        </Button>
      </div>

      <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="leads-search" className="text-xs font-medium uppercase text-muted-foreground">
            Search
          </Label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="leads-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name..."
              className="pl-9"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="w-full space-y-2 sm:w-52">
          <Label htmlFor="leads-status" className="text-xs font-medium uppercase text-muted-foreground">
            Status
          </Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as "all" | LeadStatus)}
          >
            <SelectTrigger id="leads-status" className="w-full">
              <SelectValue placeholder="Filter by status" />
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

      <LeadsTable
        leads={leads}
        onRefresh={loadLeads}
        userRole={userRole}
        loading={loading}
        loadError={loadError}
        onRetryLoad={() => void loadLeads()}
      />

      {addOpen ? (
        <LeadForm
          onSuccess={() => {
            setAddOpen(false)
            void loadLeads()
          }}
          onClose={() => setAddOpen(false)}
        />
      ) : null}
    </div>
  )
}
