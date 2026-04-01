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
import type { LeadApi, LeadStatus } from "@/types"
import { toast } from "sonner"

const SOURCE_OPTIONS = [
  "Website",
  "Referral",
  "LinkedIn",
  "Cold Email",
  "Conference",
  "Other",
] as const

const SOURCE_SET = new Set<string>(SOURCE_OPTIONS)

function sourceOptionsFor(lead: LeadApi | undefined): string[] {
  const base = [...SOURCE_OPTIONS]
  if (lead?.source && !SOURCE_SET.has(lead.source)) {
    return [lead.source, ...base]
  }
  return base
}

const STATUS_OPTIONS: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "LOST",
]

function toDateInputValue(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export type LeadFormProps = {
  lead?: LeadApi
  onSuccess: () => void
  onClose: () => void
}

export default function LeadForm({ lead, onSuccess, onClose }: LeadFormProps) {
  const isEdit = Boolean(lead?.id)

  const [open, setOpen] = useState(true)
  const [name, setName] = useState(lead?.name ?? "")
  const sourceChoices = useMemo(() => sourceOptionsFor(lead), [lead])
  const [source, setSource] = useState(lead?.source ?? "Website")
  const [status, setStatus] = useState<LeadStatus>(lead?.status ?? "NEW")
  const [lastContactDate, setLastContactDate] = useState(
    toDateInputValue(lead?.lastContactDate ?? null)
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  useEffect(() => {
    if (lead) {
      setName(lead.name)
      setSource(lead.source)
      setStatus(lead.status)
      setLastContactDate(toDateInputValue(lead.lastContactDate))
    }
  }, [lead])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNameError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      const msg = "Name is required"
      setNameError(msg)
      return
    }

    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        name: trimmed,
        source,
        status,
      }
      if (lastContactDate.trim() !== "") {
        payload.lastContactDate = new Date(lastContactDate).toISOString()
      } else if (isEdit) {
        payload.lastContactDate = null
      }

      const url = isEdit ? `/api/leads/${lead!.id}` : "/api/leads"
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
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

      toast.success(isEdit ? "Lead updated" : "Lead created")
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
            <DialogTitle>{isEdit ? "Edit lead" : "Add lead"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update lead details below."
                : "Create a new lead. You will be set as the owner."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="lead-name">Name</Label>
              <Input
                id="lead-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError) setNameError(null)
                }}
                required
                disabled={loading}
                autoComplete="off"
                aria-invalid={nameError ? true : undefined}
              />
              {nameError ? (
                <p className="text-sm text-destructive" role="alert">
                  {nameError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-source">Source</Label>
              <Select
                value={source}
                onValueChange={setSource}
                disabled={loading}
              >
                <SelectTrigger id="lead-source" className="w-full">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {sourceChoices.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as LeadStatus)}
                disabled={loading}
              >
                <SelectTrigger id="lead-status" className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-last-contact">Last contact date</Label>
              <Input
                id="lead-last-contact"
                type="date"
                value={lastContactDate}
                onChange={(e) => setLastContactDate(e.target.value)}
                disabled={loading}
              />
            </div>

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
                "Create lead"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
