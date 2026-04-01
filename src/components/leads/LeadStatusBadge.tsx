import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { LeadStatus } from "@/types"

const statusClass: Record<LeadStatus, string> = {
  NEW: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  CONTACTED: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  QUALIFIED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  LOST: "border-destructive/30 bg-destructive/10 text-destructive",
}

const statusLabel: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  LOST: "Lost",
}

export default function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant="outline" className={cn("font-normal", statusClass[status])}>
      {statusLabel[status]}
    </Badge>
  )
}
