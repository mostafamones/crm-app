"use client"

import { useState } from "react"
import LeadForm from "@/components/leads/LeadForm"
import LeadStatusBadge from "@/components/leads/LeadStatusBadge"
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
import { AlertIcon, DeleteIcon, EditIcon, LeadsIcon, LoadingIcon } from "@/lib/icons"
import { dialogContentResponsiveClassName } from "@/lib/dialog-content-classes"
import { formatShortDate } from "@/lib/utils"
import type { LeadApi, UserRole } from "@/types"
import { toast } from "sonner"

export type LeadsTableProps = {
  leads: LeadApi[]
  onRefresh: () => void
  userRole: UserRole
  loading?: boolean
  loadError?: string | null
  onRetryLoad?: () => void
}

function canManageLeads(role: UserRole): boolean {
  return role === "ADMIN" || role === "SALES_MANAGER"
}

export default function LeadsTable({
  leads,
  onRefresh,
  userRole,
  loading = false,
  loadError = null,
  onRetryLoad,
}: LeadsTableProps) {
  const showOwner = canManageLeads(userRole)
  const showDelete = canManageLeads(userRole)
  const columnCount = showOwner ? 7 : 6

  const [editingLead, setEditingLead] = useState<LeadApi | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LeadApi | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleteError(null)
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/leads/${deleteTarget.id}`, {
        method: "DELETE",
      })
      const body = (await res.json()) as { error?: string }
      if (!res.ok) {
        const msg = body.error ?? "Failed to delete lead"
        setDeleteError(msg)
        toast.error(msg)
        return
      }
      toast.success("Lead deleted")
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
            title="Couldn’t load leads"
            description={loadError}
            action={
              onRetryLoad ? (
                <Button type="button" onClick={() => onRetryLoad()}>
                  Try again
                </Button>
              ) : null
            }
          />
        ) : leads.length === 0 ? (
          <EmptyState
            icon={<LeadsIcon stroke={1.25} aria-hidden />}
            title="No leads yet"
            description="Add your first lead to start tracking prospects."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                {showOwner ? <TableHead>Owner</TableHead> : null}
                <TableHead>Created</TableHead>
                <TableHead>Last contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.source}</TableCell>
                  <TableCell>
                    <LeadStatusBadge status={lead.status} />
                  </TableCell>
                  {showOwner ? (
                    <TableCell>{lead.owner?.name ?? "—"}</TableCell>
                  ) : null}
                  <TableCell>{formatShortDate(lead.createdAt)}</TableCell>
                  <TableCell>
                    {lead.lastContactDate
                      ? formatShortDate(lead.lastContactDate)
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setEditingLead(lead)}
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
                            setDeleteTarget(lead)
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

      {editingLead ? (
        <LeadForm
          key={editingLead.id}
          lead={editingLead}
          onSuccess={() => {
            setEditingLead(null)
            onRefresh()
          }}
          onClose={() => setEditingLead(null)}
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
            <DialogTitle>Delete lead</DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              . Deals linked to this lead will be unlinked. This action cannot be
              undone.
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
