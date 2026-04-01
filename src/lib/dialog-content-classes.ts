import { cn } from "@/lib/utils"

/**
 * DialogContent `className` overlay: edge-to-edge on narrow viewports,
 * centered `sm:max-w-lg` modal on larger screens.
 */
export const dialogContentResponsiveClassName = cn(
  "left-0 top-0 h-full max-h-[100dvh] w-full max-w-full translate-x-0 translate-y-0 overflow-y-auto rounded-none border-0 p-4 sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[min(90vh,720px)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border-0 sm:p-6 sm:ring-1 sm:ring-foreground/10"
)
