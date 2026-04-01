"use client"

import { useEffect, useState } from "react"
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
import { LoadingIcon } from "@/lib/icons"
import { dialogContentResponsiveClassName } from "@/lib/dialog-content-classes"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { CustomerApi } from "@/types"

export type CustomerFormProps = {
  customer?: CustomerApi
  onSuccess: () => void
  onClose: () => void
}

const textareaClassName = cn(
  "flex min-h-[100px] w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80"
)

export default function CustomerForm({
  customer,
  onSuccess,
  onClose,
}: CustomerFormProps) {
  const isEdit = Boolean(customer?.id)

  const [open, setOpen] = useState(true)
  const [name, setName] = useState(customer?.name ?? "")
  const [companyName, setCompanyName] = useState(customer?.companyName ?? "")
  const [email, setEmail] = useState(customer?.email ?? "")
  const [phone, setPhone] = useState(customer?.phone ?? "")
  const [address, setAddress] = useState(customer?.address ?? "")
  const [notes, setNotes] = useState(customer?.notes ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [companyError, setCompanyError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  useEffect(() => {
    if (customer) {
      setName(customer.name)
      setCompanyName(customer.companyName)
      setEmail(customer.email)
      setPhone(customer.phone ?? "")
      setAddress(customer.address ?? "")
      setNotes(customer.notes ?? "")
    }
  }, [customer])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNameError(null)
    setCompanyError(null)
    setEmailError(null)

    const trimmedName = name.trim()
    const trimmedCompany = companyName.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) {
      setNameError("Name is required")
      return
    }
    if (!trimmedCompany) {
      setCompanyError("Company name is required")
      return
    }
    if (!trimmedEmail) {
      setEmailError("Email is required")
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: trimmedName,
        companyName: trimmedCompany,
        email: trimmedEmail,
        phone: phone.trim() === "" ? null : phone.trim(),
        address: address.trim() === "" ? null : address.trim(),
        notes: notes.trim() === "" ? null : notes.trim(),
      }

      if (isEdit) {
        const res = await fetch(`/api/customers/${customer!.id}`, {
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
        const res = await fetch("/api/customers", {
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

      toast.success(isEdit ? "Customer updated" : "Customer created")
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
            <DialogTitle>
              {isEdit ? "Edit customer" : "Add customer"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update customer details below."
                : "Create a new customer record."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[min(70vh,560px)] gap-4 overflow-y-auto py-2 pr-1">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Name</Label>
              <Input
                id="customer-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError) setNameError(null)
                }}
                required
                disabled={loading}
                autoComplete="name"
                aria-invalid={nameError ? true : undefined}
              />
              {nameError ? (
                <p className="text-sm text-destructive" role="alert">
                  {nameError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-company">Company name</Label>
              <Input
                id="customer-company"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value)
                  if (companyError) setCompanyError(null)
                }}
                required
                disabled={loading}
                autoComplete="organization"
                aria-invalid={companyError ? true : undefined}
              />
              {companyError ? (
                <p className="text-sm text-destructive" role="alert">
                  {companyError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError(null)
                }}
                required
                disabled={loading}
                autoComplete="email"
                aria-invalid={emailError ? true : undefined}
              />
              {emailError ? (
                <p className="text-sm text-destructive" role="alert">
                  {emailError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                autoComplete="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-address">Address</Label>
              <Input
                id="customer-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
                autoComplete="street-address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-notes">Notes</Label>
              <textarea
                id="customer-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                rows={4}
                className={textareaClassName}
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
                "Create customer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
