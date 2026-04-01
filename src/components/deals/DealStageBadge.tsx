import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { DealStatus } from "@/types"

const statusClass: Record<DealStatus, string> = {
  NEW_LEAD: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  CONTACTED: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  PROPOSAL: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  CLOSED_WON: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  CLOSED_LOST: "border-destructive/30 bg-destructive/10 text-destructive",
}

const statusLabel: Record<DealStatus, string> = {
  NEW_LEAD: "New lead",
  CONTACTED: "Contacted",
  PROPOSAL: "Proposal",
  CLOSED_WON: "Closed won",
  CLOSED_LOST: "Closed lost",
}

/** Column surface (header + lane) — matches stage badge palette. */
export const dealStageLaneClass: Record<DealStatus, string> = {
  NEW_LEAD: "border-slate-500/25 bg-slate-500/5",
  CONTACTED: "border-blue-500/25 bg-blue-500/5",
  PROPOSAL: "border-amber-500/25 bg-amber-500/5",
  CLOSED_WON: "border-emerald-500/25 bg-emerald-500/5",
  CLOSED_LOST: "border-destructive/25 bg-destructive/5",
}

export function dealStageTitle(status: DealStatus): string {
  return statusLabel[status]
}

export default function DealStageBadge({ status }: { status: DealStatus }) {
  return (
    <Badge variant="outline" className={cn("font-normal", statusClass[status])}>
      {statusLabel[status]}
    </Badge>
  )
}
