import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Base URL for server-side fetch to this app (e.g. internal API routes). */
export function getAppBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "")
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`
  }
  return "http://localhost:3000"
}

/** USD with no cents, e.g. `$25,000`. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatUsd(amount: number): string {
  return formatCurrency(amount)
}

/** e.g. `Jan 15, 2025` */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatShortDate(value: string | Date): string {
  return formatDate(value)
}

/** `value` is a whole percent (e.g. `65.3` → `65.3%`). */
export function formatPercentage(value: number): string {
  const rounded = Math.round(value * 10) / 10
  const s = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return `${s}%`
}
