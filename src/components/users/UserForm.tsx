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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LoadingIcon } from "@/lib/icons"
import { dialogContentResponsiveClassName } from "@/lib/dialog-content-classes"
import { toast } from "sonner"
import type { UserAdminApi, UserRole } from "@/types"

const ROLE_OPTIONS: UserRole[] = [
  "SALES_REP",
  "SALES_MANAGER",
  "ADMIN",
]

const ROLE_LABEL: Record<UserRole, string> = {
  SALES_REP: "Sales Rep",
  SALES_MANAGER: "Sales Manager",
  ADMIN: "Admin",
}

export type UserFormProps = {
  user?: UserAdminApi
  onSuccess: () => void
  onClose: () => void
}

export default function UserForm({ user, onSuccess, onClose }: UserFormProps) {
  const isEdit = Boolean(user?.id)

  const [open, setOpen] = useState(true)
  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>(user?.role ?? "SALES_REP")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setRole(user.role)
      setPassword("")
    }
  }, [user])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNameError(null)
    setEmailError(null)
    setPasswordError(null)

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) {
      setNameError("Name is required")
      return
    }
    if (!trimmedEmail) {
      setEmailError("Email is required")
      return
    }

    if (!isEdit && password.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      if (isEdit) {
        const res = await fetch(`/api/users/${user!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            email: trimmedEmail,
            role,
          }),
        })
        const body = (await res.json()) as { error?: string }
        if (!res.ok) {
          const msg = body.error ?? "Something went wrong"
          setError(msg)
          toast.error(msg)
          return
        }
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            email: trimmedEmail,
            password,
            role,
          }),
        })
        const body = (await res.json()) as { error?: string }
        if (!res.ok) {
          const msg = body.error ?? "Something went wrong"
          setError(msg)
          toast.error(msg)
          return
        }
      }

      toast.success(isEdit ? "User updated" : "User created")
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
            <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update account details. Password changes are not available here."
                : "Create a new user account."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[min(70vh,560px)] gap-4 overflow-y-auto py-2 pr-1">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
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
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
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

            {!isEdit ? (
              <div className="space-y-2">
                <Label htmlFor="user-password">Password</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError(null)
                  }}
                  required
                  minLength={8}
                  disabled={loading}
                  autoComplete="new-password"
                  aria-invalid={passwordError ? true : undefined}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 8 characters.
                </p>
                {passwordError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {passwordError}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="user-role">Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as UserRole)}
                disabled={loading}
              >
                <SelectTrigger id="user-role" className="w-full">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ul className="list-none space-y-1.5 border-l-2 border-muted pl-3 text-xs text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">Sales Rep:</span>{" "}
                  Can manage own leads and deals
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    Sales Manager:
                  </span>{" "}
                  Can view team data and reports
                </li>
                <li>
                  <span className="font-medium text-foreground">Admin:</span> Full
                  system access
                </li>
              </ul>
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
                "Create user"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
