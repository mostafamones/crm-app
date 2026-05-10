# CRM Architecture Diagrams

This document captures the current database structure and the core application data flow for the CRM system.

## ERD

```mermaid
erDiagram
  User {
    string id PK
    string name
    string email UK
    string passwordHash
    Role role
    string status
    datetime createdAt
  }

  Lead {
    string id PK
    string name
    string source
    LeadStatus status
    datetime createdAt
    datetime lastContactDate
    string ownerId FK
  }

  Customer {
    string id PK
    string name
    string companyName
    string email
    string phone
    string address
    string notes
    datetime createdAt
  }

  Deal {
    string id PK
    string title
    float amount
    DealStatus status
    int probability
    datetime createdAt
    datetime expectedCloseDate
    string assignedToId FK
    string customerId FK
    string leadId UK_FK
  }

  SalesReport {
    string id PK
    datetime startDate
    datetime endDate
    int totalDeals
    int closedDeals
    float conversionRate
    string generatedById FK
    datetime createdAt
  }

  User ||--o{ Lead : owns
  User ||--o{ Deal : assigned_to
  User ||--o{ SalesReport : generates
  Lead o|--|| Deal : converts_to
  Customer ||--o{ Deal : has
```

## DFD

```mermaid
flowchart TD
  SalesRep["Sales Rep"]
  Manager["Sales Manager"]
  Admin["Admin"]

  UI["Next.js Dashboard UI"]
  Auth["NextAuth Session/Auth Layer"]

  LeadsAPI["Leads API\n/api/leads"]
  DealsAPI["Deals API\n/api/deals"]
  CustomersAPI["Customers API\n/api/customers"]
  ReportsAPI["Reports API\n/api/reports"]
  UsersAPI["Users API\n/api/users"]
  DashboardAPI["Dashboard API\n/api/dashboard"]

  Prisma["Prisma Data Access Layer"]
  DB[("PostgreSQL Database")]

  SalesRep --> UI
  Manager --> UI
  Admin --> UI

  UI --> Auth

  UI --> LeadsAPI
  UI --> DealsAPI
  UI --> CustomersAPI
  UI --> ReportsAPI
  UI --> UsersAPI
  UI --> DashboardAPI

  LeadsAPI --> Auth
  DealsAPI --> Auth
  CustomersAPI --> Auth
  ReportsAPI --> Auth
  UsersAPI --> Auth
  DashboardAPI --> Auth

  LeadsAPI --> Prisma
  DealsAPI --> Prisma
  CustomersAPI --> Prisma
  ReportsAPI --> Prisma
  UsersAPI --> Prisma
  DashboardAPI --> Prisma

  Prisma --> DB

  Auth -. session and role checks .-> UI
  Auth -. authorization .-> LeadsAPI
  Auth -. authorization .-> DealsAPI
  Auth -. authorization .-> CustomersAPI
  Auth -. authorization .-> ReportsAPI
  Auth -. authorization .-> UsersAPI
  Auth -. authorization .-> DashboardAPI
```
