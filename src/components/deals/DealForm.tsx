"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LoadingIcon } from "@/lib/icons"
import { dialogContentResponsiveClassName } from "@/lib/dialog-content-classes"
import { formatPercentage } from "@/lib/utils"
import { toast } from "sonner"
import type {
  CustomerApi,
  DealApi,
  DealStatus,
  UserListItem,
  UserRole,
} from "@/types"

const STATUS_OPTIONS: DealStatus[] = [
  "NEW_LEAD",
  "CONTACTED",
  "PROPOSAL",
  "CLOSED_WON",
  "CLOSED_LOST",
]

const STATUS_LABEL: Record<DealStatus, string> = {
  NEW_LEAD: "New lead",
  CONTACTED: "Contacted",
  PROPOSAL: "Proposal",
  CLOSED_WON: "Closed won",
  CLOSED_LOST: "Closed lost",
}

function probabilityForStatus(status: DealStatus): number {
  switch (status) {
    case "NEW_LEAD":
      return 10
    case "CONTACTED":
      return 30
    case "PROPOSAL":
      return 60
    case "CLOSED_WON":
      return 100
    case "CLOSED_LOST":
      return 0
    default:
      return 0
  }
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const NONE = "__none__"

export type DealFormProps = {
  deal?: DealApi
  users: UserListItem[]
  customers: CustomerApi[]
  currentUserId: string
  userRole: UserRole
  onSuccess: () => void
  onClose: () => void
}

export default function DealForm({
  deal,
  users,
  customers,
  currentUserId,
  userRole,
  onSuccess,
  onClose,
}: DealFormProps) {
  const isEdit = Boolean(deal?.id)
  const isRep = userRole === "SALES_REP"
  const showAssignee = !isRep && users.length > 0
  const repEditLocked = isEdit && isRep

  const [open, setOpen] = useState(true)
  const [title, setTitle] = useState(deal?.title ?? "")
  const [amount, setAmount] = useState(
    deal !== undefined ? String(deal.amount) : ""
  )
  const [status, setStatus] = useState<DealStatus>(deal?.status ?? "NEW_LEAD")
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    toDateInputValue(deal?.expectedCloseDate ?? null)
  )
  const [assignedToId, setAssignedToId] = useState(
    deal?.assignedToId ?? currentUserId
  )
  const [customerId, setCustomerId] = useState(
    deal?.customerId ?? ""
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)

  const probability = useMemo(() => probabilityForStatus(status), [status])

  useEffect(() => {
    if (deal) {
      setTitle(deal.title)
      setAmount(String(deal.amount))
      setStatus(deal.status)
      setExpectedCloseDate(toDateInputValue(deal.expectedCloseDate))
      setAssignedToId(deal.assignedToId)
      setCustomerId(deal.customerId ?? "")
    }
  }, [deal])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setTitleError(null)
    setAmountError(null)

    if (repEditLocked) {
      const trimmedStatus = status
      setLoading(true)
      try {
        const res = await fetch(`/api/deals/${deal!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: trimmedStatus }),
        })
        const body = (await res.json()) as { error?: string }
        if (!res.ok) {
          const msg = body.error ?? "Something went wrong"
          setError(msg)
          toast.error(msg)
          return
        }
        toast.success("Deal updated")
        onSuccess()
        setOpen(false)
        onClose()
      } finally {
        setLoading(false)
      }
      return
    }

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      const msg = "Title is required"
      setTitleError(msg)
      return
    }

    const amountNum = Number(amount)
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      const msg = "Amount must be a positive number"
      setAmountError(msg)
      return
    }

    setLoading(true)
    try {
      if (isEdit) {
        const payload: Record<string, unknown> = {
          title: trimmedTitle,
          amount: amountNum,
          status,
        }
        if (expectedCloseDate.trim() !== "") {
          payload.expectedCloseDate = new Date(expectedCloseDate).toISOString()
        } else {
          payload.expectedCloseDate = null
        }
        if (showAssignee) {
          payload.assignedToId = assignedToId
        }
        if (!isRep) {
          payload.customerId =
            customerId.trim() === "" ? null : customerId.trim()
        }

        const res = await fetch(`/api/deals/${deal!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const body = (await res.json()) as { error?: string }
        if (!res.ok) {
          const msg = body.error ?? "Something went wrong"
          setError(msg)
          toast.error(msg)
          return
        }
      } else {
        const payload: Record<string, unknown> = {
          title: trimmedTitle,
          amount: amountNum,
          status,
        }
        if (expectedCloseDate.trim() !== "") {
          payload.expectedCloseDate = new Date(expectedCloseDate).toISOString()
        }
        if (showAssignee && assignedToId) {
          payload.assignedToId = assignedToId
        }
        if (customerId.trim() !== "") {
          payload.customerId = customerId.trim()
        }

        const res = await fetch("/api/deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const body = (await res.json()) as { error?: string }
        if (!res.ok) {
          const msg = body.error ?? "Something went wrong"
          setError(msg)
          toast.error(msg)
          return
        }
      }

      toast.success(isEdit ? "Deal updated" : "Deal created")
      onSuccess()
      setOpen(false)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={dialogContentResponsiveClassName}
        showCloseButton={!loading}
        onPointerDownOutside={(e) => {
          if (loading) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault()
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit deal" : "Add deal"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update deal details below."
                : "Create a new deal in the pipeline."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[min(70vh,560px)] gap-4 overflow-y-auto py-2 pr-1">
            <div className="space-y-2">
              <Label htmlFor="deal-title">Title</Label>
              <Input
                id="deal-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (titleError) setTitleError(null)
                }}
                required={!repEditLocked}
                disabled={loading || repEditLocked}
                autoComplete="off"
                aria-invalid={titleError ? true : undefined}
              />
              {titleError ? (
                <p className="text-sm text-destructive" role="alert">
                  {titleError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deal-amount">Amount (USD)</Label>
              <Input
                id="deal-amount"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  if (amountError) setAmountError(null)
                }}
                required={!repEditLocked}
                disabled={loading || repEditLocked}
                aria-invalid={amountError ? true : undefined}
              />
              {amountError ? (
                <p className="text-sm text-destructive" role="alert">
                  {amountError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deal-status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as DealStatus)}
                disabled={loading}
              >
                <SelectTrigger id="deal-status" className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deal-probability">Probability</Label>
              <Input
                id="deal-probability"
                readOnly
                value={formatPercentage(probability)}
                className="bg-muted/50"
                aria-readonly="true"
              />
              <p className="text-xs text-muted-foreground">
                Updates automatically when you change status.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deal-close">Expected close date</Label>
              <Input
                id="deal-close"
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                disabled={loading || repEditLocked}
              />
            </div>

            {showAssignee ? (
              <div className="space-y-2">
                <Label htmlFor="deal-assignee">Assigned to</Label>
                <Select
                  value={assignedToId}
                  onValueChange={setAssignedToId}
                  disabled={loading || repEditLocked}
                >
                  <SelectTrigger id="deal-assignee" className="w-full">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {!isRep || !isEdit ? (
              <div className="space-y-2">
                <Label htmlFor="deal-customer">Customer</Label>
                <Select
                  value={customerId === "" ? NONE : customerId}
                  onValueChange={(v) =>
                    setCustomerId(v === NONE ? "" : v)
                  }
                  disabled={loading || repEditLocked}
                >
                  <SelectTrigger id="deal-customer" className="w-full">
                    <SelectValue placeholder="Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No customer</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.companyName} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <LoadingIcon className="size-4 animate-spin" aria-hidden />
                  Saving...
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create deal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
