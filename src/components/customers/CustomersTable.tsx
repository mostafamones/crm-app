"use client"

import { useState } from "react"
import CustomerForm from "@/components/customers/CustomerForm"
import { Button } from "@/components/ui/button"
import { DataTableSkeleton } from "@/components/ui/DataTableSkeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  CustomersIcon,
  DeleteIcon,
  EditIcon,
  LoadingIcon,
} from "@/lib/icons"
import { dialogContentResponsiveClassName } from "@/lib/dialog-content-classes"
import { formatShortDate } from "@/lib/utils"
import type { CustomerListApi, UserRole } from "@/types"
import { toast } from "sonner"

export type CustomersTableProps = {
  customers: CustomerListApi[]
  onRefresh: () => void
  userRole: UserRole
  loading?: boolean
  loadError?: string | null
  onRetryLoad?: () => void
}

function canDeleteCustomer(role: UserRole): boolean {
  return role === "ADMIN" || role === "SALES_MANAGER"
}

export default function CustomersTable({
  customers,
  onRefresh,
  userRole,
  loading = false,
  loadError = null,
  onRetryLoad,
}: CustomersTableProps) {
  const showDelete = canDeleteCustomer(userRole)

  const [editing, setEditing] = useState<CustomerListApi | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CustomerListApi | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleteError(null)
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/customers/${deleteTarget.id}`, {
        method: "DELETE",
      })
      const body = (await res.json()) as { error?: string }
      if (!res.ok) {
        const msg = body.error ?? "Failed to delete customer"
        setDeleteError(msg)
        toast.error(msg)
        return
      }
      toast.success("Customer deleted")
      setDeleteTarget(null)
      onRefresh()
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border bg-card">
        {loading ? (
          <DataTableSkeleton columns={7} rows={10} />
        ) : loadError ? (
          <EmptyState
            icon={<AlertIcon className="text-destructive" stroke={1.25} aria-hidden />}
            title="Couldn’t load customers"
            description={loadError}
            action={
              onRetryLoad ? (
                <Button type="button" onClick={() => onRetryLoad()}>
                  Try again
                </Button>
              ) : null
            }
          />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={<CustomersIcon stroke={1.25} aria-hidden />}
            title="No customers yet"
            description="Add your first customer to link them to deals."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Active deals</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.companyName}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {row.email}
                  </TableCell>
                  <TableCell>{row.phone ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">
                    {row.activeDealsCount}
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
                      {showDelete ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => {
                            setDeleteError(null)
                            setDeleteTarget(row)
                          }}
                        >
                          <DeleteIcon className="size-4" aria-hidden />
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {editing ? (
        <CustomerForm
          key={editing.id}
          customer={editing}
          onSuccess={() => {
            setEditing(null)
            onRefresh()
          }}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteLoading) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent
          className={dialogContentResponsiveClassName}
          showCloseButton={!deleteLoading}
        >
          <DialogHeader>
            <DialogTitle>Delete customer</DialogTitle>
            <DialogDescription>
              This will remove{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.companyName}
              </span>{" "}
              and unlink any associated deals. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p className="text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!deleteLoading) setDeleteTarget(null)
              }}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <LoadingIcon className="size-4 animate-spin" aria-hidden />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
