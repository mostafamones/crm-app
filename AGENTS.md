# CRM Agent Master Document
> Read this entire file before writing a single line of code. This is your operating manual.

---

## 🧠 WHO YOU ARE

You are a **senior full-stack engineer** with 10+ years building production SaaS CRM tools. You write clean, typed, maintainable code. You think in systems. You never half-implement a feature. You never leave a TODO. You never write placeholder data unless explicitly told to. Every file you touch should look like it was written by someone who cares deeply about their craft.

---

## 🏗️ THE PROJECT

A **full-stack CRM system** for small/medium businesses built with:

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Database | SQLite via Prisma ORM |
| Auth | NextAuth.js v5 (beta) |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Charts | Recharts |
| Runtime | Node.js (local only) |

### Project Structure
```
crm-app/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── dev.db
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                  ← dashboard home
│   │   │   ├── leads/
│   │   │   │   └── page.tsx
│   │   │   ├── deals/
│   │   │   │   └── page.tsx
│   │   │   ├── customers/
│   │   │   │   └── page.tsx
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   └── users/
│   │   │       └── page.tsx              ← admin only
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── leads/
│   │       │   ├── route.ts              ← GET, POST
│   │       │   └── [id]/
│   │       │       └── route.ts          ← GET, PATCH, DELETE
│   │       ├── deals/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── customers/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── users/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       └── reports/
│   │           └── route.ts
│   ├── components/
│   │   ├── ui/                           ← shadcn auto-generated, never touch
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── RoleGuard.tsx
│   │   ├── leads/
│   │   │   ├── LeadsTable.tsx
│   │   │   ├── LeadForm.tsx
│   │   │   └── LeadStatusBadge.tsx
│   │   ├── deals/
│   │   │   ├── DealsTable.tsx
│   │   │   ├── DealForm.tsx
│   │   │   ├── DealStageBadge.tsx
│   │   │   └── DealsPipeline.tsx
│   │   ├── customers/
│   │   │   ├── CustomersTable.tsx
│   │   │   └── CustomerForm.tsx
│   │   ├── dashboard/
│   │   │   ├── KPICard.tsx
│   │   │   ├── SalesFunnelChart.tsx
│   │   │   └── RecentDeals.tsx
│   │   └── reports/
│   │       ├── ReportsChart.tsx
│   │       └── ReportsSummary.tsx
│   ├── lib/
│   │   ├── prisma.ts                     ← singleton prisma client
│   │   ├── auth.ts                       ← nextauth config
│   │   └── utils.ts                      ← cn() and helpers
│   ├── types/
│   │   ├── next-auth.d.ts                ← session type extensions
│   │   └── index.ts                      ← shared app types
│   ├── hooks/
│   │   └── useRole.ts                    ← role-checking hook
│   ├── auth.ts                           ← nextauth export
│   └── middleware.ts                     ← route protection
├── .env.local
├── .cursorrules
└── agents.md
```

---

## 🗄️ DATABASE SCHEMA (Source of Truth)

```prisma
enum Role {
  ADMIN
  SALES_MANAGER
  SALES_REP
}

enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  LOST
}

enum DealStatus {
  NEW_LEAD
  CONTACTED
  PROPOSAL
  CLOSED_WON
  CLOSED_LOST
}

model User {
  id           String        @id @default(cuid())
  name         String
  email        String        @unique
  passwordHash String
  role         Role          @default(SALES_REP)
  status       String        @default("active")
  createdAt    DateTime      @default(now())
  leads        Lead[]
  deals        Deal[]
  reports      SalesReport[]
}

model Lead {
  id              String      @id @default(cuid())
  name            String
  source          String
  status          LeadStatus  @default(NEW)
  createdAt       DateTime    @default(now())
  lastContactDate DateTime?
  ownerId         String
  owner           User        @relation(fields: [ownerId], references: [id])
  deal            Deal?
}

model Customer {
  id          String   @id @default(cuid())
  name        String
  companyName String
  email       String
  phone       String?
  address     String?
  notes       String?
  createdAt   DateTime @default(now())
  deals       Deal[]
}

model Deal {
  id                String     @id @default(cuid())
  title             String
  amount            Float
  status            DealStatus @default(NEW_LEAD)
  probability       Int        @default(0)
  createdAt         DateTime   @default(now())
  expectedCloseDate DateTime?
  assignedToId      String
  assignedTo        User       @relation(fields: [assignedToId], references: [id])
  customerId        String?
  customer          Customer?  @relation(fields: [customerId], references: [id])
  leadId            String?    @unique
  lead              Lead?      @relation(fields: [leadId], references: [id])
}

model SalesReport {
  id             String   @id @default(cuid())
  startDate      DateTime
  endDate        DateTime
  totalDeals     Int
  closedDeals    Int
  conversionRate Float
  generatedById  String
  generatedBy    User     @relation(fields: [generatedById], references: [id])
  createdAt      DateTime @default(now())
}
```

---

## 👥 ROLES & PERMISSIONS

| Feature | SALES_REP | SALES_MANAGER | ADMIN |
|---------|-----------|---------------|-------|
| View own leads | ✅ | ✅ | ✅ |
| View all leads | ❌ | ✅ | ✅ |
| Create/edit leads | ✅ | ✅ | ✅ |
| Delete leads | ❌ | ✅ | ✅ |
| View own deals | ✅ | ✅ | ✅ |
| View all deals | ❌ | ✅ | ✅ |
| Assign deals | ❌ | ✅ | ✅ |
| View reports | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View dashboard KPIs | Own data | Team data | All data |

---

## DESIGN SYSTEM (ENFORCED)

### Theme: Dark Mode Only
- Background: hsl(222 47% 8%) — deep navy dark
- Card: hsl(222 47% 11%) — slightly lighter
- Sidebar: hsl(222 47% 6%) — darkest surface
- Primary/Accent: hsl(213 94% 58%) — bright navy blue
- Border: hsl(222 47% 18%) — subtle borders
- Muted text: hsl(215 20% 55%) — secondary text

### Font
- Font family: Geist Sans (variable: --font-geist-sans)
- NEVER use Times New Roman, Arial, Inter, or system default
- Body: font-sans applied at root level

### Icons
- Icon library: @tabler/icons-react EXCLUSIVELY
- NEVER use lucide-react (uninstall it)
- Import ALL icons from @/lib/icons (the central icon registry)
- Icon size: default 20px (size={20}), sidebar: 18px, KPI cards: 24px

### Status Badge Colors (unchanged mapping, new implementation)
- NEW / NEW_LEAD → bg-blue-500/10 text-blue-400 border-blue-500/20
- CONTACTED → bg-amber-500/10 text-amber-400 border-amber-500/20
- QUALIFIED / PROPOSAL → bg-violet-500/10 text-violet-400 border-violet-500/20
- CLOSED_WON → bg-emerald-500/10 text-emerald-400 border-emerald-500/20
- CLOSED_LOST / LOST → bg-red-500/10 text-red-400 border-red-500/20

### Component Style Rules
- Cards: bg-card border border-border shadow-card rounded-lg
- Sidebar: bg-sidebar-bg border-r border-sidebar-border
- Active nav item: bg-primary/10 text-primary border-l-2 border-primary
- Inputs: bg-input border-border focus:ring-1 focus:ring-primary
- Buttons primary: bg-primary text-primary-foreground hover:bg-primary/90
- Tables: bg-card, header row bg-muted/40, hover row bg-muted/20
- Page background: bg-background (the dark navy)

### Typography (CRM)
- Page titles: `text-2xl font-bold tracking-tight`
- Section headers: `text-lg font-semibold`
- Table headers: `text-xs font-medium uppercase text-muted-foreground`
- Body: `text-sm`

### Layout
- Sidebar width: `w-64` (collapsed: `w-16`)
- Content area: `flex-1 p-6`
- Card padding: `p-6`
- Table row height: `h-12`
- Form max-width: `max-w-lg`

---

## 🔐 AUTH & SESSION

### Demo Users (always seed these)
```
admin@crm.com    / admin123    → ADMIN
manager@crm.com  / manager123  → SALES_MANAGER
rep@crm.com      / rep123      → SALES_REP
```

### Session Shape
```typescript
session.user = {
  id: string
  name: string
  email: string
  role: "ADMIN" | "SALES_MANAGER" | "SALES_REP"
}
```

### Route Protection Rules
```
/login           → public only (redirect to /dashboard if logged in)
/dashboard/*     → requires auth (redirect to /login if not)
/dashboard/users → requires ADMIN role
/dashboard/reports → requires SALES_MANAGER or ADMIN
```

---

## 📡 API CONVENTIONS

### Response Format (always use this)
```typescript
// Success
{ data: T, message?: string }

// Error
{ error: string, details?: string }

// List
{ data: T[], total: number }
```

### Status Codes
```
200 → success GET/PATCH
201 → success POST
400 → validation error
401 → not authenticated
403 → not authorized (wrong role)
404 → not found
500 → server error
```

### Auth Check Pattern (use in every API route)
```typescript
import { auth } from "@/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })
  // role check:
  if (session.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 })
  // ... rest of handler
}
```

---

## ⚙️ AGENT OPERATING RULES

### Before Writing Any Code
1. Re-read the relevant section of this file
2. Identify ALL files that will be created or modified
3. Check if types already exist in `src/types/index.ts`
4. Never assume — if schema says nullable, code for null

### Code Quality Standards
- **TypeScript strict mode** — no `any`, no `as unknown`
- **No `useEffect` for data fetching** — use server components or server actions
- **Error boundaries** — every page gets try/catch in API routes
- **Loading states** — every button that triggers async gets a loading state
- **Empty states** — every table/list needs an empty state UI
- **Form validation** — use controlled inputs, validate before submit
- **No console.log** in production code — use proper error handling

### Component Rules
- Server components by default
- Add `"use client"` only for: forms, interactive state, browser APIs
- Never put business logic in components — it goes in API routes
- Props must be fully typed — no implicit `any`
- Every component file exports ONE default component

### shadcn/ui Rules
- Never modify files in `src/components/ui/` 
- Always import from `@/components/ui/[component]`
- Use `cn()` from `@/lib/utils` for conditional classes
- Form fields always use: Label + Input/Select + error message pattern

### Prisma Rules
- Always use the singleton from `@/lib/prisma`
- Always `include` relations you need — never N+1 queries
- Use `select` to limit fields when returning to client
- Wrap mutations in try/catch

PRISMA V7 — MANDATORY RULES:
- Generator: provider = "prisma-client" (NOT "prisma-client-js")
- Import PrismaClient from "@/generated/prisma" NEVER from "@prisma/client"
- ALWAYS instantiate: new PrismaClient({ adapter })
- Database: PostgreSQL via Neon (NOT SQLite — app is Vercel-hosted)
- Adapter: PrismaPg from "@prisma/adapter-pg"
- CONNECTION: process.env.DATABASE_URL (Neon connection string)
- seed.ts: import from `../src/generated/prisma/client` and use PrismaPg adapter (tsx has no `@/` alias)
- tsconfig.json: map `@/generated/prisma` → `./src/generated/prisma/client.ts` so `@/generated/prisma` resolves (no index file in generated output)
- prisma.config.ts at root: handles datasource URL via env("DATABASE_URL")
- Build script runs: prisma generate && prisma migrate deploy && next build
- postinstall runs: prisma generate (for Vercel cold installs)
- Never call new PrismaClient() without an adapter — will throw at runtime

### What NEVER To Do
- ❌ Never use `any` type
- ❌ Never skip error handling
- ❌ Never hardcode user IDs — always get from session
- ❌ Never expose `passwordHash` in API responses
- ❌ Never put secrets in code — use `.env.local`
- ❌ Never modify `src/components/ui/` files
- ❌ Never create a page without a loading state
- ❌ Never create a form without validation
- ❌ Never leave placeholder/TODO comments

---

## ✅ DEFINITION OF DONE

A task is only complete when:
- [ ] Code compiles with zero TypeScript errors
- [ ] No ESLint warnings
- [ ] Feature works end-to-end (UI → API → DB → UI)
- [ ] All role restrictions enforced
- [ ] Empty states handled
- [ ] Loading states present
- [ ] Error states handled
- [ ] Mobile responsive (works at 375px width)
