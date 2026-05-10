# CRM System

A full-stack CRM web application for small and medium businesses. Manage leads, deals, customers, and sales performance — with role-based access control baked in.

> Built as a software engineering course project supervised by **Dr. Rabab Emad**.

---

## Tools Used

| Purpose | Tool |
|---|---|
| Planning | Claude |
| Coding Agent | Cursor |
| Coding Agent | Codex |

---

## Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) + Prisma ORM v7 |
| Auth | NextAuth.js v5 |
| UI | shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| Icons | Tabler Icons |
| Font | Geist by Vercel |

---

## Features

- **Auth** — Credential login with hashed passwords and protected routes
- **Leads** — Add, edit, track and filter leads through sales statuses
- **Deals** — Kanban pipeline + table view, stage progression, revenue tracking
- **Customers** — B2B contact management linked to deals
- **Reports** — Charts, conversion rates, revenue summaries *(Manager/Admin)*
- **Users** — Create and manage system users *(Admin only)*
- **Dashboard** — Role-aware KPIs, funnel chart, recent deals
- **Architecture Docs** — Mermaid ERD and DFD diagrams in [`docs/architecture.md`](./docs/architecture.md)
- **Showcase Mode** — Launch the app and open it automatically with `npm run showcase`

---

## Roles

| | Sales Rep | Manager | Admin |
|---|:-:|:-:|:-:|
| Own leads & deals | ✅ | ✅ | ✅ |
| All team data | ❌ | ✅ | ✅ |
| Reports | ❌ | ✅ | ✅ |
| User management | ❌ | ❌ | ✅ |

---

## Getting Started

```bash
git clone https://github.com/your-username/crm-app.git
cd crm-app
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Or run:

```bash
npm run showcase
```

This starts the Next.js dev server and opens `http://localhost:3000` automatically in your browser.

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@crm.com` | `admin123` |
| Manager | `manager@crm.com` | `manager123` |
| Sales Rep | `rep@crm.com` | `rep123` |

---

## Environment Variables

```env
DATABASE_URL="your-neon-postgres-connection-string"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

## Architecture

The project architecture diagrams are documented in [`docs/architecture.md`](./docs/architecture.md):

- ERD (Entity Relationship Diagram)
- DFD (Data Flow Diagram)

---

## Team

Saba Khalid · Malak Nasr · Fares Samir · Muhammed Waheed · Omar Muhammed
