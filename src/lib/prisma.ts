import path from "node:path"
import { PrismaClient } from "@/generated/prisma"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

/** Absolute path avoids opening a different (empty) DB when cwd is not the repo root. */
const databaseUrl = `file:${path.join(process.cwd(), "prisma", "dev.db")}`

const adapter = new PrismaBetterSqlite3({
  url: databaseUrl,
})

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export default prisma

