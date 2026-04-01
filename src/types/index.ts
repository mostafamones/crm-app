export type UserRole = "ADMIN" | "SALES_MANAGER" | "SALES_REP"
export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "LOST"
export type DealStatus = "NEW_LEAD" | "CONTACTED" | "PROPOSAL" | "CLOSED_WON" | "CLOSED_LOST"

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  status: string
  createdAt: Date
}

export type Lead = {
  id: string
  name: string
  source: string
  status: LeadStatus
  createdAt: Date
  lastContactDate: Date | null
  ownerId: string
  owner?: User
  deal?: Deal | null
}

/** Lead as returned by JSON API (ISO date strings). */
export type LeadApi = Omit<Lead, "createdAt" | "lastContactDate"> & {
  createdAt: string
  lastContactDate: string | null
  owner?: Pick<User, "id" | "name" | "email" | "role">
}

export type Customer = {
  id: string
  name: string
  companyName: string
  email: string
  phone: string | null
  address: string | null
  notes: string | null
  createdAt: Date
}

export type Deal = {
  id: string
  title: string
  amount: number
  status: DealStatus
  probability: number
  createdAt: Date
  expectedCloseDate: Date | null
  assignedToId: string
  assignedTo?: User
  customerId: string | null
  customer?: Customer | null
  leadId: string | null
}

/** Customer from JSON API (ISO dates). */
export type CustomerApi = Omit<Customer, "createdAt"> & { createdAt: string }

/** Customer row from list API (active pipeline deals count). */
export type CustomerListApi = CustomerApi & {
  activeDealsCount: number
}

/** Deal row from list/detail JSON API (ISO dates). */
export type DealApi = Omit<Deal, "createdAt" | "expectedCloseDate"> & {
  createdAt: string
  expectedCloseDate: string | null
  assignedTo?: Pick<User, "id" | "name" | "role">
  customer?: { id: string; name: string; companyName: string } | null
}

/** Customer detail from API with related deals. */
export type CustomerDetailApi = CustomerApi & {
  deals: DealApi[]
}

/** User row for selects (no password). */
export type UserListItem = Pick<User, "id" | "name" | "email" | "role"> & {
  status: string
}

/** User row from admin listing API (ISO dates). */
export type UserAdminApi = Omit<User, "createdAt"> & {
  createdAt: string
}

export type SalesReport = {
  id: string
  startDate: Date
  endDate: Date
  totalDeals: number
  closedDeals: number
  conversionRate: number
  generatedById: string
  createdAt: Date
}

/** Serialized deal row for dashboard API (JSON-safe dates). */
export type DashboardRecentDeal = {
  id: string
  title: string
  amount: number
  status: DealStatus
  createdAt: string
  expectedCloseDate: string | null
  assignedToId: string
  assignedTo: {
    id: string
    name: string
    email: string
    role: UserRole
  }
  customer: {
    id: string
    name: string
    companyName: string
    email: string
  } | null
}

export type DealStatusBreakdown = {
  status: DealStatus
  count: number
}

export type ReportsStageRow = {
  stage: string
  count: number
  value: number
}

export type ReportsMonthRow = {
  month: string
  count: number
  revenue: number
}

export type ReportsTopPerformer = {
  userId: string
  name: string
  closedDeals: number
  revenue: number
}

export type ReportsData = {
  totalDeals: number
  closedWon: number
  closedLost: number
  conversionRate: number
  totalRevenue: number
  avgDealSize: number
  dealsByStage: ReportsStageRow[]
  dealsByMonth: ReportsMonthRow[]
  topPerformers: ReportsTopPerformer[]
}

export type DashboardKPIs = {
  totalLeads: number
  totalDeals: number
  closedWon: number
  closedLost: number
  conversionRate: number
  totalRevenue: number
  dealsInPipeline: number
  dealsByStage: DealStatusBreakdown[]
  recentDeals: DashboardRecentDeal[]
}

