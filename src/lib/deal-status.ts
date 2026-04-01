import type { DealStatus } from "@/types"

export function dealStatusLabel(status: DealStatus): string {
  const labels: Record<DealStatus, string> = {
    NEW_LEAD: "New Lead",
    CONTACTED: "Contacted",
    PROPOSAL: "Proposal",
    CLOSED_WON: "Closed Won",
    CLOSED_LOST: "Closed Lost",
  }
  return labels[status]
}

/** Badge utility classes per enforced design system (AGENTS.md). */
export function dealStatusBadgeClassName(status: DealStatus): string {
  switch (status) {
    case "NEW_LEAD":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400"
    case "CONTACTED":
      return "border-amber-500/20 bg-amber-500/10 text-amber-400"
    case "PROPOSAL":
      return "border-violet-500/20 bg-violet-500/10 text-violet-400"
    case "CLOSED_WON":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
    case "CLOSED_LOST":
      return "border-red-500/20 bg-red-500/10 text-red-400"
  }
}
