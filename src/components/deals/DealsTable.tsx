"use client"

import { useState } from "react"
import DealStageBadge from "@/components/deals/DealStageBadge"
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
import { AlertIcon, DeleteIcon, DealsIcon, EditIcon, LoadingIcon } from "@/lib/icons"
import { dialogContentResponsiveClassName } from "@/lib/dialog-content-classes"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import type { DealApi, UserRole } from "@/types"
import { toast } from "sonner"

export type DealsTableProps = {
  deals: DealApi[]
  onRefresh: () => void
  userRole: UserRole
  onEdit: (deal: DealApi) => void
  loading?: boolean
  loadError?: string | null
  onRetryLoad?: () => void
}

function canManageDeals(role: UserRole): boolean {
  return role === "ADMIN" || role === "SALES_MANAGER"
}

export default function DealsTable({
  deals,
  onRefresh,
  userRole,
  onEdit,
  loading = false,
  loadError = null,
  onRetryLoad,
}: DealsTableProps) {
  const showAssignee = canManageDeals(userRole)
  const showDelete = canManageDeals(userRole)
  const columnCount = showAssignee ? 8 : 7

  const [deleteTarget, setDeleteTarget] = useState<DealApi | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleteError(null)
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/deals/${deleteTarget.id}`, {
        method: "DELETE",
      })
      const body = (await res.json()) as { error?: string }
      if (!res.ok) {
        const msg = body.error ?? "Failed to delete deal"
        setDeleteError(msg)
        toast.error(msg)
        return
      }
      toast.success("Deal deleted")
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
          <DataTableSkeleton columns={columnCount} rows={10} />
        ) : loadError ? (
          <EmptyState
            icon={<AlertIcon className="text-destructive" stroke={1.25} aria-hidden />}
            title="Couldn’t load deals"
            description={loadError}
            action={
              onRetryLoad ? (
                <Button type="button" onClick={() => onRetryLoad()}>
                  Try again
                </Button>
              ) : null
            }
          />
        ) : deals.length === 0 ? (
          <EmptyState
            icon={<DealsIcon stroke={1.25} aria-hidden />}
            title="No deals in table view"
            description="Add a deal or switch to the pipeline to see stages."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Probability</TableHead>
                {showAssignee ? <TableHead>Assigned to</TableHead> : null}
                <TableHead>Expected close</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="max-w-[200px] truncate font-medium">
                    {deal.title}
                  </TableCell>
                  <TableCell>
                    {deal.customer?.companyName ?? "No customer"}
                  </TableCell>
                  <TableCell>{formatCurrency(deal.amount)}</TableCell>
                  <TableCell>
                    <DealStageBadge status={deal.status} />
                  </TableCell>
                  <TableCell>{deal.probability}%</TableCell>
                  {showAssignee ? (
                    <TableCell>{deal.assignedTo?.name ?? "—"}</TableCell>
                  ) : null}
                  <TableCell>
                    {deal.expectedCloseDate
                      ? formatShortDate(deal.expectedCloseDate)
                      : "Not set"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => onEdit(deal)}
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
                            setDeleteTarget(deal)
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
            <DialogTitle>Delete deal</DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.title}
              </span>
              . This action cannot be undone.
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
