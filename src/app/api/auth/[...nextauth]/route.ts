import { handlers } from "@/auth"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

export function GET(req: NextRequest) {
  return handlers.GET(req)
}

export function POST(req: NextRequest) {
  return handlers.POST(req)
}
