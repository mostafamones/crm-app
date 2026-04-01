"use client"

import {
  dealStageLaneClass,
  dealStageTitle,
} from "@/components/deals/DealStageBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/EmptyState"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertIcon, DealsIcon } from "@/lib/icons"
import { cn, formatCurrency, formatPercentage } from "@/lib/utils"
import type { DealApi, DealStatus } from "@/types"

const STAGE_ORDER: DealStatus[] = [
  "NEW_LEAD",
  "CONTACTED",
  "PROPOSAL",
  "CLOSED_WON",
  "CLOSED_LOST",
]

export type DealsPipelineProps = {
  deals: DealApi[]
  onDealClick: (deal: DealApi) => void
  loading?: boolean
  loadError?: string | null
  onRetryLoad?: () => void
}

function groupByStage(list: DealApi[]): Record<DealStatus, DealApi[]> {
  const empty = (): Record<DealStatus, DealApi[]> => ({
    NEW_LEAD: [],
    CONTACTED: [],
    PROPOSAL: [],
    CLOSED_WON: [],
    CLOSED_LOST: [],
  })
  return list.reduce((acc, deal) => {
    acc[deal.status].push(deal)
    return acc
  }, empty())
}

function columnTotals(stageDeals: DealApi[]): { count: number; value: number } {
  return {
    count: stageDeals.length,
    value: stageDeals.reduce((s, d) => s + d.amount, 0),
  }
}

export default function DealsPipeline({
  deals,
  onDealClick,
  loading = false,
  loadError = null,
  onRetryLoad,
}: DealsPipelineProps) {
  const grouped = groupByStage(deals)

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGE_ORDER.map((stage) => (
            <div
              key={stage}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-lg border p-3",
                dealStageLaneClass[stage]
              )}
            >
              <Skeleton className="mb-3 h-16 w-full rounded-md" />
              <Skeleton className="mb-2 h-24 w-full rounded-md" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="rounded-lg border bg-card">
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
        </div>
      ) : deals.length === 0 ? (
        <div className="rounded-lg border bg-card">
          <EmptyState
            icon={<DealsIcon stroke={1.25} aria-hidden />}
            title="Pipeline is empty"
            description="Add your first deal to see it across stages."
          />
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGE_ORDER.map((stage) => {
            const stageDeals = grouped[stage]
            const { count, value } = columnTotals(stageDeals)
            return (
              <div
                key={stage}
                className={cn(
                  "flex w-[min(100%,18rem)] shrink-0 flex-col rounded-lg border",
                  dealStageLaneClass[stage]
                )}
              >
                <div className="border-b border-border/60 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold leading-tight">
                      {dealStageTitle(stage)}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {count} deal{count === 1 ? "" : "s"} · {formatCurrency(value)}
                  </p>
                </div>
                <div className="flex min-h-[12rem] flex-1 flex-col gap-2 p-2">
                  {stageDeals.map((deal) => (
                    <button
                      key={deal.id}
                      type="button"
                      onClick={() => onDealClick(deal)}
                      className={cn(
                        "rounded-md border border-border/80 bg-background/80 p-3 text-left shadow-sm transition-colors",
                        "hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      )}
                    >
                      <p className="line-clamp-2 text-sm font-medium leading-snug">
                        {deal.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {deal.customer?.companyName ??
                          deal.customer?.name ??
                          "No customer"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(deal.amount)}
                        </span>
                        <Badge variant="secondary" className="font-normal">
                          {formatPercentage(deal.probability)}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
