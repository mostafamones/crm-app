import path from "node:path"
import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import bcrypt from "bcryptjs"

const databaseUrl = `file:${path.join(process.cwd(), "prisma", "dev.db")}`
const adapter = new PrismaBetterSqlite3({ url: databaseUrl })
const prisma = new PrismaClient({ adapter })

import { Role, LeadStatus, DealStatus } from "../src/generated/prisma"

async function main() {
  // ── Clean existing data (order matters for FK constraints) ────────────────
  await prisma.salesReport.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ─────────────────────────────────────────────────────────────────
  const SALT_ROUNDS = 10;

  const [adminUser, managerUser, repUser] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@crm.com",
        passwordHash: await bcrypt.hash("admin123", SALT_ROUNDS),
        role: Role.ADMIN,
        status: "active",
      },
    }),
    prisma.user.create({
      data: {
        name: "Sara Manager",
        email: "manager@crm.com",
        passwordHash: await bcrypt.hash("manager123", SALT_ROUNDS),
        role: Role.SALES_MANAGER,
        status: "active",
      },
    }),
    prisma.user.create({
      data: {
        name: "John Rep",
        email: "rep@crm.com",
        passwordHash: await bcrypt.hash("rep123", SALT_ROUNDS),
        role: Role.SALES_REP,
        status: "active",
      },
    }),
  ]);

  // ── Customers ─────────────────────────────────────────────────────────────
  const [customer1, customer2, customer3, customer4, customer5] =
    await Promise.all([
      prisma.customer.create({
        data: {
          name: "Ahmed Hassan",
          companyName: "TechSolutions Egypt",
          email: "ahmed@techsolutions.eg",
          phone: "+20-10-1234-5678",
          address: "Cairo, Egypt",
          notes: "Interested in enterprise plan",
        },
      }),
      prisma.customer.create({
        data: {
          name: "Sarah Williams",
          companyName: "Global Imports Ltd",
          email: "sarah@globalimports.com",
          phone: "+1-555-234-5678",
          address: "New York, USA",
          notes: "Prefers email communication",
        },
      }),
      prisma.customer.create({
        data: {
          name: "Mohamed Ali",
          companyName: "Nile Trading Co",
          email: "m.ali@niletrading.com",
          phone: "+20-11-9876-5432",
          address: "Alexandria, Egypt",
          notes: "Budget conscious, needs ROI proof",
        },
      }),
      prisma.customer.create({
        data: {
          name: "Emma Johnson",
          companyName: "StartupHub MENA",
          email: "emma@startuphub.me",
          phone: "+971-50-123-4567",
          address: "Dubai, UAE",
          notes: "Fast decision maker",
        },
      }),
      prisma.customer.create({
        data: {
          name: "Omar Khalil",
          companyName: "Pharma Dynamics",
          email: "o.khalil@pharmadyn.com",
          phone: "+20-12-5555-6666",
          address: "Giza, Egypt",
          notes: "Requires compliance documentation",
        },
      }),
    ]);

  // ── Leads (all owned by repUser) ──────────────────────────────────────────
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        name: "Rania Mahmoud",
        source: "Website",
        status: LeadStatus.NEW,
        ownerId: repUser.id,
      },
    }),
    prisma.lead.create({
      data: {
        name: "James Carter",
        source: "Referral",
        status: LeadStatus.CONTACTED,
        lastContactDate: yesterday,
        ownerId: repUser.id,
      },
    }),
    prisma.lead.create({
      data: {
        name: "Nour Elsayed",
        source: "LinkedIn",
        status: LeadStatus.QUALIFIED,
        lastContactDate: yesterday,
        ownerId: repUser.id,
      },
    }),
    prisma.lead.create({
      data: {
        name: "Chris Brown",
        source: "Cold Email",
        status: LeadStatus.CONTACTED,
        lastContactDate: yesterday,
        ownerId: repUser.id,
      },
    }),
    prisma.lead.create({
      data: {
        name: "Yasmin Farouk",
        source: "Conference",
        status: LeadStatus.NEW,
        ownerId: repUser.id,
      },
    }),
    prisma.lead.create({
      data: {
        name: "David Lee",
        source: "Referral",
        status: LeadStatus.LOST,
        lastContactDate: yesterday,
        ownerId: repUser.id,
      },
    }),
  ]);

  // ── Helper: future date N months from now ─────────────────────────────────
  function monthsFromNow(months: number): Date {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d;
  }

  // ── Deals (assigned to repUser, linked to customers) ──────────────────────
  await Promise.all([
    prisma.deal.create({
      data: {
        title: "TechSolutions CRM License",
        amount: 25000,
        status: DealStatus.CLOSED_WON,
        probability: 100,
        assignedToId: repUser.id,
        customerId: customer1.id,
        expectedCloseDate: null, // already closed
      },
    }),
    prisma.deal.create({
      data: {
        title: "Global Imports Integration",
        amount: 15000,
        status: DealStatus.PROPOSAL,
        probability: 60,
        assignedToId: repUser.id,
        customerId: customer2.id,
        expectedCloseDate: monthsFromNow(1),
      },
    }),
    prisma.deal.create({
      data: {
        title: "Nile Trading Starter Pack",
        amount: 8000,
        status: DealStatus.CONTACTED,
        probability: 30,
        assignedToId: repUser.id,
        customerId: customer3.id,
        expectedCloseDate: monthsFromNow(2),
      },
    }),
    prisma.deal.create({
      data: {
        title: "StartupHub Team Plan",
        amount: 12000,
        status: DealStatus.CLOSED_WON,
        probability: 100,
        assignedToId: repUser.id,
        customerId: customer4.id,
        expectedCloseDate: null, // already closed
      },
    }),
    prisma.deal.create({
      data: {
        title: "Pharma Dynamics Enterprise",
        amount: 45000,
        status: DealStatus.CLOSED_LOST,
        probability: 0,
        assignedToId: repUser.id,
        customerId: customer5.id,
        expectedCloseDate: null, // already closed/lost
      },
    }),
    prisma.deal.create({
      data: {
        title: "Hassan Group Expansion",
        amount: 18000,
        status: DealStatus.NEW_LEAD,
        probability: 10,
        assignedToId: repUser.id,
        customerId: customer1.id,
        expectedCloseDate: monthsFromNow(3),
      },
    }),
  ]);

  // ── Summary ───────────────────────────────────────────────────────────────
  const [userCount, customerCount, leadCount, dealCount] = await Promise.all([
    prisma.user.count(),
    prisma.customer.count(),
    prisma.lead.count(),
    prisma.deal.count(),
  ]);

  console.log(
    `Database seeded with ${userCount} users, ${customerCount} customers, ${leadCount} leads, ${dealCount} deals.`
  );

  // Suppress "unused variable" warnings — variables used implicitly via closures
  void [adminUser, managerUser, leads];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
