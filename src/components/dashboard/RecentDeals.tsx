import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/EmptyState"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { dealStatusBadgeClassName, dealStatusLabel } from "@/lib/deal-status"
import { DealsIcon } from "@/lib/icons"
import { formatCurrency } from "@/lib/utils"
import type { DashboardRecentDeal } from "@/types"

export default function RecentDeals({
  deals,
}: {
  deals: DashboardRecentDeal[]
}) {
  return (
    <Card className="gap-4 border-border p-6 shadow-card">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-semibold">Recent deals</CardTitle>
        <CardDescription>Latest five deals by created date</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0 pb-0">
        {deals.length === 0 ? (
          <EmptyState
            icon={<DealsIcon stroke={1.25} aria-hidden />}
            title="No deals yet"
            description="Create a deal to see recent activity here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Deal</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned to</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow
                  key={deal.id}
                  className="border-border hover:bg-muted/20"
                >
                  <TableCell className="max-w-[180px] truncate font-medium text-foreground">
                    {deal.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {deal.customer?.companyName ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-foreground">
                    {formatCurrency(deal.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={dealStatusBadgeClassName(deal.status)}
                    >
                      {dealStatusLabel(deal.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {deal.assignedTo.name}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
