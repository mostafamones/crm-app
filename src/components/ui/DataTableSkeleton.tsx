import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const DEFAULT_WIDTHS = [
  "w-32",
  "w-28",
  "w-24",
  "w-20",
  "w-24",
  "w-24",
  "w-20",
  "w-16",
]

export type DataTableSkeletonProps = {
  /** Number of data columns (header cells). */
  columns: number
  /** Number of skeleton rows (default 10). */
  rows?: number
  /** Optional Tailwind width classes per column; cycles if shorter than `columns`. */
  columnWidths?: string[]
  className?: string
}

export function DataTableSkeleton({
  columns,
  rows = 10,
  columnWidths,
  className,
}: DataTableSkeletonProps) {
  const widths =
    columnWidths && columnWidths.length > 0
      ? Array.from({ length: columns }, (_, i) => columnWidths[i % columnWidths.length])
      : Array.from(
          { length: columns },
          (_, i) => DEFAULT_WIDTHS[i % DEFAULT_WIDTHS.length]
        )

  return (
    <Table className={cn(className)}>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton className={cn("h-4", widths[i] ?? "w-24")} />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, ri) => (
          <TableRow key={ri}>
            {Array.from({ length: columns }).map((_, ci) => (
              <TableCell key={ci}>
                <Skeleton className={cn("h-4", widths[ci] ?? "w-24")} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
