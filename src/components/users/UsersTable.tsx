"use client"

import { useState } from "react"
import UserForm from "@/components/users/UserForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataTableSkeleton } from "@/components/ui/DataTableSkeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertIcon,
  EditIcon,
  LoadingIcon,
  UsersIcon,
} from "@/lib/icons"
import { dialogContentResponsiveClassName } from "@/lib/dialog-content-classes"
import { cn, formatShortDate } from "@/lib/utils"
import type { UserAdminApi, UserRole } from "@/types"
import { toast } from "sonner"

export type UsersTableProps = {
  users: UserAdminApi[]
  currentUserId: string
  onRefresh: () => void
  loading?: boolean
  loadError?: string | null
  onRetryLoad?: () => void
}

function roleBadgeVariant(
  role: UserRole
): "default" | "secondary" | "outline" | "destructive" {
  switch (role) {
    case "ADMIN":
      return "destructive"
    case "SALES_MANAGER":
      return "secondary"
    default:
      return "outline"
  }
}

function roleLabel(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "Admin"
    case "SALES_MANAGER":
      return "Manager"
    case "SALES_REP":
      return "Rep"
    default:
      return role
  }
}

export default function UsersTable({
  users,
  currentUserId,
  onRefresh,
  loading = false,
  loadError = null,
  onRetryLoad,
}: UsersTableProps) {
  const [editing, setEditing] = useState<UserAdminApi | null>(null)
  const [statusTarget, setStatusTarget] = useState<UserAdminApi | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  const nextStatus =
    statusTarget?.status === "active" ? "inactive" : "active"

  async function confirmStatusChange() {
    if (!statusTarget) return
    setStatusError(null)
    setStatusLoading(true)
    try {
      const res = await fetch(`/api/users/${statusTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      const body = (await res.json()) as { error?: string }
      if (!res.ok) {
        const msg = body.error ?? "Failed to update user"
        setStatusError(msg)
        toast.error(msg)
        return
      }
      toast.success(
        nextStatus === "active" ? "User activated" : "User deactivated"
      )
      setStatusTarget(null)
      onRefresh()
    } finally {
      setStatusLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border bg-card">
        {loading ? (
          <DataTableSkeleton columns={6} rows={10} />
        ) : loadError ? (
          <EmptyState
            icon={
              <AlertIcon className="text-destructive" stroke={1.25} aria-hidden />
            }
            title="Couldn’t load users"
            description={loadError}
            action={
              onRetryLoad ? (
                <Button type="button" onClick={() => onRetryLoad()}>
                  Try again
                </Button>
              ) : null
            }
          />
        ) : users.length === 0 ? (
          <EmptyState
            icon={<UsersIcon stroke={1.25} aria-hidden />}
            title="No users yet"
            description="Add your first user to grant access to the CRM."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((row) => {
                const isSelf = row.id === currentUserId
                const isActive = row.status === "active"
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {row.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={roleBadgeVariant(row.role)}
                        className={cn("font-normal")}
                      >
                        {roleLabel(row.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={isActive ? "default" : "secondary"}
                        className="font-normal"
                      >
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatShortDate(row.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setEditing(row)}
                        >
                          <EditIcon className="size-4" aria-hidden />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={isSelf}
                          title={
                            isSelf
                              ? "You cannot deactivate your own account here"
                              : undefined
                          }
                          onClick={() => {
                            setStatusError(null)
                            setStatusTarget(row)
                          }}
                        >
                          {isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {editing ? (
        <UserForm
          key={editing.id}
          user={editing}
          onSuccess={() => {
            setEditing(null)
            onRefresh()
          }}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <Dialog
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open && !statusLoading) {
            setStatusTarget(null)
            setStatusError(null)
          }
        }}
      >
        <DialogContent
          className={dialogContentResponsiveClassName}
          showCloseButton={!statusLoading}
        >
          <DialogHeader>
            <DialogTitle>
              {statusTarget?.status === "active"
                ? "Deactivate user"
                : "Activate user"}
            </DialogTitle>
            <DialogDescription>
              {statusTarget?.status === "active" ? (
                <>
                  User{" "}
                  <span className="font-medium text-foreground">
                    {statusTarget?.name}
                  </span>{" "}
                  will not be able to sign in until reactivated.
                </>
              ) : (
                <>
                  Restore access for{" "}
                  <span className="font-medium text-foreground">
                    {statusTarget?.name}
                  </span>
                  .
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {statusError ? (
            <p className="text-sm text-destructive" role="alert">
              {statusError}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!statusLoading) setStatusTarget(null)
              }}
              disabled={statusLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={
                statusTarget?.status === "active" ? "destructive" : "default"
              }
              onClick={() => void confirmStatusChange()}
              disabled={statusLoading}
            >
              {statusLoading ? (
                <>
                  <LoadingIcon className="size-4 animate-spin" aria-hidden />
                  Updating...
                </>
              ) : statusTarget?.status === "active" ? (
                "Deactivate"
              ) : (
                "Activate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
