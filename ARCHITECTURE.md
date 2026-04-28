# 🏗️ FINANCIAL ADVISOR PLATFORM - ARCHITECTURE BLUEPRINT

## Executive Summary

A production-ready personal CFO dashboard that intelligently tracks accounts, budgets, investments, debt, and provides AI-powered transaction logging and financial recommendations. Single-user focused, deployed on Vercel + Supabase.

**Status**: Pre-implementation architecture (awaiting approval)

---

## 1️⃣ TECH STACK RATIONALE

### Frontend
- **Next.js 14** (App Router)
  - Why: React ecosystem, Server Components reduce client JS, built-in optimization
  - File-based routing matches folder structure naturally
  - API routes for backend endpoints

- **TypeScript**
  - Why: Catch bugs at compile time, self-documenting code, critical for financial data

- **Tailwind CSS + ShadCN/ui**
  - Why: Premium component library, dark mode built-in, financial-grade design system
  - Pre-built accessible components (forms, modals, charts)

- **Recharts**
  - Why: React-native charting, responsive, animations out of box
  - Perfect for financial dashboards (line, bar, pie, area charts)

- **Zustand** (state management)
  - Why: Lightweight, TypeScript-first, no boilerplate vs Redux/Context

### Backend
- **Supabase (PostgreSQL 15)**
  - Why: Managed PostgreSQL, real-time subscriptions, built-in auth, REST API
  - No DevOps overhead
  - Row-level security for future multi-user
  - Serverless, scales automatically

- **Prisma ORM**
  - Why: Type-safe database queries, auto-generated types from schema
  - Migrations baked in, works seamlessly with Supabase

- **Node.js (Next.js API Routes)**
  - Why: Warm serverless functions, handles authentication, processes Claude API calls

### AI & Intelligence
- **Claude API (Anthropic)**
  - Why: Superior financial document understanding, multi-language support
  - Planned usage: NL transaction parsing, expense categorization, recommendation generation

### Deployment
- **Vercel** (Frontend + API Routes)
  - Why: Next.js-native hosting, zero config, automatic CI/CD, preview deployments

- **Supabase Postgres** (Database)
  - Why: Managed service, backup/restore, monitoring included

---

## 2️⃣ SYSTEM ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE (Vercel)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Dashboard       │  Transaction Logger  │  Budget Editor │  │
│  │  (Overview)      │  (Form + NL Parser)  │  (Simulator)   │  │
│  │                  │                      │                │  │
│  │  • KPIs          │  • Manual entry      │  • Tier mgmt   │  │
│  │  • Charts        │  • AI parsing        │  • What-if     │  │
│  │  • Alerts        │  • Auto category     │  • Optimizer   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                      Next.js App (TypeScript)                   │
│                      Tailwind + ShadCN UI                       │
└────────┬──────────────────────────────────────────────────────┬─┘
         │                                                        │
    ┌────▼─────────────┐                        ┌────────────────▼────┐
    │  API Routes      │                        │  State Management   │
    │  (Next.js)       │                        │  (Zustand)          │
    │                  │                        │                     │
    │ • auth.ts        │                        │ • transactionStore  │
    │ • transactions   │                        │ • budgetStore       │
    │ • budget         │◄──────────────────────►│ • accountStore      │
    │ • forecast       │   API Calls            │ • forecastStore     │
    │ • ai-parse.ts    │   (REST JSON)          │ • advisoryStore     │
    └────┬─────────────┘                        └────────────────────┘
         │
         │  Prisma Client
         │  (Type-safe)
         │
    ┌────▼──────────────────────────────────┐
    │   Supabase PostgreSQL Database        │
    │   (Managed, Real-time, RLS)           │
    │                                       │
    │   ┌─────────────────────────────────┐ │
    │   │  Data Layer                     │ │
    │   │  ├── users                      │ │
    │   │  ├── accounts                   │ │
    │   │  ├── transactions (Source!)     │ │
    │   │  ├── categories                 │ │
    │   │  ├── budgets                    │ │
    │   │  ├── budget_allocations         │ │
    │   │  ├── debt_accounts              │ │
    │   │  ├── sinking_funds              │ │
    │   │  ├── investments                │ │
    │   │  ├── monthly_snapshots          │ │
    │   │  └── forecast_models            │ │
    │   └─────────────────────────────────┘ │
    │                                       │
    │   ┌─────────────────────────────────┐ │
    │   │  Auxiliary Services             │ │
    │   │  ├── Edge Functions             │ │
    │   │  ├── Real-time subscriptions    │ │
    │   │  └── RLS Policies               │ │
    │   └─────────────────────────────────┘ │
    └────────────────────────────────────────┘
```

---

## 3️⃣ DATABASE SCHEMA

### Core Tables

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  settings JSONB DEFAULT '{}'::jsonb  -- currency, timezone, etc
);
```

#### `accounts`
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,  -- "FNB", "ABSA", "Emergency", etc
  account_type ENUM ('bank', 'investment', 'debt', 'sinking'),
  currency VARCHAR DEFAULT 'ZAR',
  balance_override DECIMAL(15,2),  -- If manual override needed
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### `transactions` (Single source of truth)
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id),
  
  -- Core transaction data
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  description VARCHAR NOT NULL,
  
  -- Categorization
  category_id UUID REFERENCES categories(id),
  category_name VARCHAR,  -- Denormalized for speed
  
  -- Classification
  transaction_type ENUM ('income', 'expense', 'transfer') DEFAULT 'expense',
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency ENUM ('daily', 'weekly', 'monthly', 'yearly'),
  
  -- Meta
  notes TEXT,
  tagged_budget_id UUID REFERENCES budgets(id),
  source ENUM ('manual', 'csv_import', 'ai_parsed', 'api_integration'),
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  INDEX (user_id, date),
  INDEX (account_id, date),
  INDEX (category_id)
);
```

#### `categories`
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR NOT NULL,
  icon VARCHAR,  -- emoji or icon name
  color VARCHAR,  -- hex or tailwind color
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

#### `budgets`
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name VARCHAR NOT NULL,  -- "Kai School", "Emergency", "Dining", etc
  tier ENUM ('protected', 'strategic', 'flexible') DEFAULT 'flexible',
  
  -- Allocation
  monthly_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR DEFAULT 'ZAR',
  
  -- Configuration
  is_active BOOLEAN DEFAULT true,
  is_locked BOOLEAN DEFAULT false,  -- Kai school is locked
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Historical tracking
CREATE TABLE budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  month DATE NOT NULL,  -- first day of month
  allocated_amount DECIMAL(15,2) NOT NULL,
  spent_amount DECIMAL(15,2) DEFAULT 0,
  actual_transactions INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);
```

#### `debt_accounts`
```sql
CREATE TABLE debt_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  creditor_name VARCHAR NOT NULL,  -- "Naeem", "Cedric"
  original_amount DECIMAL(15,2) NOT NULL,
  remaining_balance DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Track debt reduction
CREATE TABLE debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_account_id UUID NOT NULL REFERENCES debt_accounts(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id),
  amount_paid DECIMAL(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

#### `sinking_funds`
```sql
CREATE TABLE sinking_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name VARCHAR NOT NULL,  -- "Car service", "Postal box", etc
  description TEXT,
  target_amount DECIMAL(15,2) NOT NULL,
  current_balance DECIMAL(15,2) DEFAULT 0,
  target_date DATE,  -- when needed
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Track contributions
CREATE TABLE sinking_fund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sinking_fund_id UUID NOT NULL REFERENCES sinking_funds(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id),
  amount DECIMAL(15,2) NOT NULL,
  contribution_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

#### `investments`
```sql
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id),
  
  name VARCHAR NOT NULL,  -- "Unit Trust", "Stocks", etc
  type ENUM ('unit_trust', 'stocks', 'crypto', 'savings') DEFAULT 'unit_trust',
  symbol VARCHAR,  -- ticker or code
  
  current_balance DECIMAL(15,2) NOT NULL,
  cost_basis DECIMAL(15,2),  -- for gains calculation
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Track investment growth
CREATE TABLE investment_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  balance DECIMAL(15,2) NOT NULL,
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  
  UNIQUE (investment_id, snapshot_date)
);
```

#### `monthly_snapshots` (For reporting & trends)
```sql
CREATE TABLE monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  month DATE NOT NULL,  -- first day of month
  
  -- Computed at snapshot time
  total_income DECIMAL(15,2),
  total_expenses DECIMAL(15,2),
  net_savings DECIMAL(15,2),
  
  -- Account balances
  account_balances JSONB,  -- { "FNB": 50000, "ABSA": 30000 }
  
  -- Budget data
  budget_allocations JSONB,  -- { "Kai School": 5000, "Emergency": ... }
  budget_spent JSONB,
  
  -- Net worth
  total_assets DECIMAL(15,2),
  total_liabilities DECIMAL(15,2),
  net_worth DECIMAL(15,2),
  
  created_at TIMESTAMP DEFAULT now()
);
```

#### `forecast_models`
```sql
CREATE TABLE forecast_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name VARCHAR,  -- "Deterministic Base", "Optimistic", etc
  forecast_method ENUM ('deterministic', 'monte_carlo') DEFAULT 'deterministic',
  
  -- Assumptions
  avg_monthly_income DECIMAL(15,2),
  avg_monthly_expenses DECIMAL(15,2),
  
  assumptions JSONB,  -- flexible for future expansion
  
  -- Results (computed)
  results JSONB,  -- projections, scenarios, etc
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## 4️⃣ FOLDER STRUCTURE

```
financial-advisor/
│
├── .env.example                    # Environment variables template
├── .env.local                      # (git ignored) Local secrets
├── next.config.js                  # Next.js config
├── tailwind.config.ts              # Tailwind config
├── tsconfig.json                   # TypeScript config
├── prisma/
│   ├── schema.prisma               # Database schema (single source)
│   ├── migrations/                 # Managed by Prisma
│   └── seed.ts                     # Seed data script
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Dashboard (/)
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/route.ts
│   │   ├── transactions/
│   │   │   ├── page.tsx            # Transaction list + filter
│   │   │   └── new/page.tsx        # Transaction logger (form + NL)
│   │   ├── budgets/
│   │   │   ├── page.tsx            # Budget overview
│   │   │   └── [id]/editor.tsx     # Budget simulator
│   │   ├── accounts/
│   │   │   └── page.tsx            # Account balances
│   │   ├── investments/
│   │   │   └── page.tsx            # Investment dashboard
│   │   ├── debt/
│   │   │   └── page.tsx            # Debt tracker
│   │   ├── forecast/
│   │   │   └── page.tsx            # Forecasting view
│   │   ├── api/                    # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── signup/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   ├── transactions/
│   │   │   │   ├── route.ts        # GET all, POST new
│   │   │   │   ├── [id]/route.ts   # GET one, PUT, DELETE
│   │   │   │   ├── parse-nl/route.ts  # AI parsing endpoint
│   │   │   │   └── bulk-import/route.ts
│   │   │   ├── budgets/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── simulate/route.ts
│   │   │   ├── accounts/route.ts
│   │   │   ├── forecast/route.ts   # Compute forecasts
│   │   │   └── advisory/
│   │   │       └── recommendations/route.ts
│   │   └── error.tsx               # Error boundary
│   │
│   ├── components/                 # Reusable React components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── dashboard/
│   │   │   ├── KPICard.tsx         # Single KPI display
│   │   │   ├── DashboardGrid.tsx
│   │   │   └── AlertPanel.tsx
│   │   ├── charts/
│   │   │   ├── CategoryBreakdown.tsx
│   │   │   ├── MonthlyTrend.tsx
│   │   │   ├── NetWorthChart.tsx
│   │   │   ├── DebtReductionChart.tsx
│   │   │   └── SpendingVelocity.tsx
│   │   ├── forms/
│   │   │   ├── TransactionForm.tsx
│   │   │   ├── BudgetForm.tsx
│   │   │   └── NLParser.tsx        # "Log with AI"
│   │   ├── tables/
│   │   │   ├── TransactionTable.tsx
│   │   │   └── BudgetTable.tsx
│   │   ├── modals/
│   │   │   ├── BudgetSimulator.tsx
│   │   │   └── AllocationOptimizer.tsx
│   │   └── ui/                     # ShadCN components (auto-generated)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── ... (others)
│   │
│   ├── services/                   # Business logic layers
│   │   ├── auth.service.ts         # Auth logic (Supabase)
│   │   ├── transaction.service.ts  # Transaction CRUD, queries
│   │   ├── budget.service.ts       # Budget logic, spending calc
│   │   ├── account.service.ts      # Account balance derivation
│   │   ├── forecast.service.ts     # Forecasting engine
│   │   ├── advisor.service.ts      # Advisory recommendations
│   │   ├── ai.service.ts           # Claude API integration
│   │   └── snapshot.service.ts     # Monthly snapshot computation
│   │
│   ├── lib/                        # Utilities
│   │   ├── supabase.ts             # Supabase client
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── auth.ts                 # Auth helpers
│   │   ├── currency.ts             # Currency formatting
│   │   ├── date.ts                 # Date utilities
│   │   ├── validation.ts           # Input validation schemas
│   │   └── constants.ts            # App constants
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useTransactions.ts
│   │   ├── useBudgets.ts
│   │   ├── useAccounts.ts
│   │   └── useForecast.ts
│   │
│   ├── store/                      # Zustand state stores
│   │   ├── authStore.ts
│   │   ├── transactionStore.ts
│   │   ├── budgetStore.ts
│   │   ├── accountStore.ts
│   │   ├── forecastStore.ts
│   │   └── advisoryStore.ts
│   │
│   └── types/                      # TypeScript types
│       ├── index.ts
│       ├── database.ts             # Generated from Prisma
│       ├── api.ts
│       └── financial.ts
│
├── public/                         # Static assets
│   ├── icons/
│   ├── logos/
│   └── images/
│
├── docs/
│   ├── ARCHITECTURE.md             # This file
│   ├── DATABASE.md                 # Schema reference
│   ├── API.md                      # API documentation
│   ├── DEPLOYMENT.md               # Deploy instructions
│   └── ROADMAP.md                  # Future features
│
├── .gitignore
├── package.json
└── README.md
```

---

## 5️⃣ CORE SERVICES ARCHITECTURE

### 1. **Transaction Service** (`transaction.service.ts`)
```typescript
interface TransactionService {
  // CRUD
  create(transaction: CreateTransactionInput): Promise<Transaction>
  update(id: string, changes: Partial<Transaction>): Promise<Transaction>
  delete(id: string): Promise<void>
  get(id: string): Promise<Transaction>
  list(filters: TransactionFilters): Promise<Transaction[]>

  // Aggregation (derived from transactions!)
  getMonthlyExpenses(month: Date): Promise<Decimal>
  getMonthlyIncome(month: Date): Promise<Decimal>
  getCategoryBreakdown(month: Date): Promise<CategoryTotal[]>
  getMonthlyTrend(months: number): Promise<TrendData[]>
  getSpendingVelocity(days: number): Promise<DailyAverage>

  // Bulk
  bulkImportCSV(file: File, accountId: string): Promise<ImportResult>
}
```

### 2. **Budget Service** (`budget.service.ts`)
```typescript
interface BudgetService {
  // CRUD
  createBudget(budget: CreateBudgetInput): Promise<Budget>
  updateAllocation(budgetId: string, month: Date, amount: Decimal): Promise<void>

  // Calculations
  getMonthlyAllocation(month: Date): Promise<BudgetAllocation[]>
  getSpentAmount(budgetId: string, month: Date): Promise<Decimal>
  getBudgetHealth(month: Date): Promise<HealthScore>  // 0-100

  // Simulation
  simulateAllocationChange(
    changes: AllocationDelta[],
    month: Date
  ): Promise<SimulationResult>

  // Optimization
  suggestOptimalAllocation(constraints: AllocationConstraints): Promise<AllocationSuggestion>

  // Tiers
  protectedBudgetTotal(): Promise<Decimal>  // Kai school
  strategicBudgetTotal(): Promise<Decimal>
  flexibleBudgetTotal(): Promise<Decimal>
}
```

### 3. **Account Service** (`account.service.ts`)
```typescript
interface AccountService {
  // CRUD
  createAccount(account: CreateAccountInput): Promise<Account>
  updateAccount(id: string, changes: Partial<Account>): Promise<Account>

  // Balance Calculation (always from transactions!)
  getBalance(accountId: string, asOfDate?: Date): Promise<Decimal>
  getAllBalances(): Promise<AccountBalance[]>
  getNetWorth(): Promise<Decimal>

  // Multi-currency
  convertCurrency(amount: Decimal, from: Currency, to: Currency): Promise<Decimal>
  getTotalInZAR(): Promise<Decimal>

  // Accounts rollup
  getTotalByType(type: AccountType): Promise<Decimal>
  getAccountSummary(): Promise<AccountSummary>
}
```

### 4. **Forecast Service** (`forecast.service.ts`)
```typescript
interface ForecastService {
  // Deterministic (MVP)
  computeMonthlyForecast(baseMonth: Date): Promise<DeterministicForecast>
  computeAnnualForecast(year: number): Promise<AnnualForecast>

  // Projections
  projectDebtPayoff(debtId: string): Promise<PayoffProjection>
  projectSinkingFund(fundId: string): Promise<FundingProjection>
  projectInvestmentGrowth(investmentId: string): Promise<GrowthProjection>

  // Alerts
  detectRisks(): Promise<RiskAlert[]>
  computeBufferWarning(): Promise<BufferStatus>
}
```

### 5. **AI Service** (`ai.service.ts`)
```typescript
interface AIService {
  // Transaction parsing
  parseNLTransaction(
    text: string,
    context: UserContext
  ): Promise<ParsedTransaction>

  // Category detection
  suggestCategory(description: string, history: Transaction[]): Promise<Category>

  // Advisory
  generateMonthlyRecommendations(month: Date): Promise<Recommendation[]>
  analyzeSpendingPattern(): Promise<SpendingAnalysis>
}
```

### 6. **Advisory Service** (`advisor.service.ts`)
```typescript
interface AdvisoryService {
  // Rule-based checks
  checkBufferHealth(): Promise<BufferAlert | null>
  checkSpendingVelocity(): Promise<VelocityAlert | null>
  checkBudgetCompliance(): Promise<ComplianceIssue[]>

  // Recommendations
  suggestAllocationAdjustment(): Promise<AllocationSuggestion>
  suggestDebtPaymentBoost(): Promise<DebtRecommendation>
  protectKaiSchool(): void  // Constraint function

  // Monthly checkup questions
  getMonthlyCheckupQuestions(): Promise<FollowUpQuestion[]>
}
```

---

## 6️⃣ API ENDPOINTS OVERVIEW

### Authentication
```
POST   /api/auth/signup        # Register
POST   /api/auth/login         # Login
POST   /api/auth/logout        # Logout
GET    /api/auth/me            # Current user
```

### Transactions
```
GET    /api/transactions       # List all (with filters)
POST   /api/transactions       # Create new
GET    /api/transactions/:id   # Get one
PUT    /api/transactions/:id   # Update
DELETE /api/transactions/:id   # Delete

POST   /api/transactions/parse-nl   # AI parse "I spent 500 on coffee"
POST   /api/transactions/bulk-import # CSV import
```

### Budgets
```
GET    /api/budgets            # List all budgets
POST   /api/budgets            # Create new
PUT    /api/budgets/:id        # Update
DELETE /api/budgets/:id        # Delete

PUT    /api/budgets/:id/allocate    # Set monthly allocation
GET    /api/budgets/:id/spent       # Get spent amount
GET    /api/budgets/health          # Overall health score

POST   /api/budgets/simulate        # "What if I change X?"
POST   /api/budgets/optimize        # Suggest optimal allocation
```

### Accounts & Balances
```
GET    /api/accounts           # All accounts + balances
POST   /api/accounts           # Create account
PUT    /api/accounts/:id       # Update
GET    /api/accounts/:id/balance    # Current balance

GET    /api/accounts/net-worth      # Total net worth
GET    /api/accounts/summary        # Comprehensive summary
```

### Forecasting
```
GET    /api/forecast/monthly        # Month forecast
GET    /api/forecast/annual         # Year forecast
GET    /api/forecast/debt/:id       # Debt payoff projection
GET    /api/forecast/sinking/:id    # Sinking fund projection
GET    /api/forecast/risks          # Alert detection
```

### Advisory
```
GET    /api/advisory/recommendations    # Monthly suggestions
GET    /api/advisory/checkup-questions  # Monthly form
POST   /api/advisory/checkup-responses  # Save responses
GET    /api/advisory/analysis           # Spending analysis
```

---

## 7️⃣ DASHBOARD ARCHITECTURE

### Layout Strategy
```
┌─────────────────────────────────────────────┐
│           HEADER (Logo, Nav, User)          │
├──────────────────┬──────────────────────────┤
│                  │                          │
│   SIDEBAR        │     MAIN CONTENT         │
│ (Navigation)     │                          │
│                  │  ┌────────────────────┐  │
│  • Dashboard     │  │  KPI Cards Row     │  │
│  • Transactions  │  │  (4 metrics)       │  │
│  • Budgets       │  ├────────────────────┤  │
│  • Accounts      │  │  Charts Section    │  │
│  • Investments   │  │  (3-column grid)   │  │
│  • Debt          │  ├────────────────────┤  │
│  • Forecast      │  │  Alert Panel       │  │
│  • Settings      │  ├────────────────────┤  │
│                  │  │  Quick Actions     │  │
│                  │  └────────────────────┘  │
│                  │                          │
└──────────────────┴──────────────────────────┘
```

### Dashboard KPIs (Top Row)
1. **Income This Month** - Green, large number
2. **Expenses This Month** - Red, large number
3. **Remaining Buffer** - Blue, large number (Income - Expenses)
4. **Budget Health Score** - Purple badge (0-100%)

### Account Balances (Second Row)
1. **FNB Balance**
2. **ABSA Balance**
3. **Total Investments**
4. **Net Worth**

### Third Row (Progress & Alerts)
1. **Emergency Fund Progress** - Progress bar
2. **Building Fund Progress** - Progress bar
3. **Debt Remaining** - Large number

### Charts (Responsive Grid)
1. **Category Breakdown** (Pie)
2. **Monthly Trend** (Area chart, 12 months)
3. **Spending Velocity** (Line chart, last 30 days)
4. **Net Worth Over Time** (Area chart, 12 months)
5. **Investment Growth** (Line chart)
6. **Debt Reduction Timeline** (Bar chart projection)

---

## 8️⃣ SECURITY ARCHITECTURE

### Authentication
- Supabase Auth with email/password (can add OAuth later)
- JWT stored in httpOnly cookies
- Protected API routes check user context

### Database Security
- Row-level security policies (even for single-user)
- All queries filtered by `user_id`
- Sensitive data (passwords) never logged

### Input Validation
- Zod schemas for all API inputs
- Sanitize text inputs to prevent injection
- CSV import validation
- AI parsing output validation

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
CLAUDE_API_KEY=...
DATABASE_URL=...
```

### HTTPS & CORS
- Vercel auto-HTTPS
- CORS configured for frontend domain
- CSP headers in Next.js

---

## 9️⃣ DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Create Supabase project
- [ ] Run migrations (`npx prisma migrate deploy`)
- [ ] Seed test data
- [ ] Set environment variables on Vercel
- [ ] Test all API endpoints
- [ ] Run security audit

### Deployment
- [ ] Push to GitHub
- [ ] Connect to Vercel
- [ ] Auto-deploy on main
- [ ] Run smoke tests on production

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check database backups
- [ ] Verify real-time subscriptions
- [ ] Test Claude API integration

---

## 🔟 IMPLEMENTATION PHASES

### Phase 1: MVP (Weeks 1-2)
- [ ] Project setup (Next.js + Supabase + Prisma)
- [ ] Database schema + migrations
- [ ] Authentication (sign up, login, logout)
- [ ] Dashboard (basic KPIs)
- [ ] Transaction CRUD (form only, no AI yet)
- [ ] Account balance calculation
- [ ] Deploy to Vercel

### Phase 2: Intelligence (Week 3)
- [ ] Claude API integration
- [ ] NL transaction parser
- [ ] Auto-categorization
- [ ] Transaction list with filters

### Phase 3: Financial Features (Week 4)
- [ ] Budget management
- [ ] Budget simulator
- [ ] Allocation optimizer
- [ ] Debt tracker
- [ ] Sinking fund tracker

### Phase 4: Forecasting (Week 5)
- [ ] Deterministic forecasting
- [ ] Monthly snapshots
- [ ] Advisory alerts
- [ ] Monthly recommendations

### Phase 5: Polish & Advanced (Week 6+)
- [ ] Dark mode
- [ ] Mobile optimization
- [ ] Monte Carlo forecasting
- [ ] CSV import/export
- [ ] Settings panel

---

## 1️⃣1️⃣ FUTURE EXTENSIBILITY

Designed for these additions:
- **Bank API Integration** (Plaid, TradingView)
- **Automatic Transaction Import**
- **SMS/WhatsApp Logging**
- **Multi-currency Live Conversion**
- **Business Accounting Module**
- **Tax Reporting**
- **Agent Orchestration** (Claude SDK)
- **Mobile App** (React Native)
- **Export to PDF/Excel**

All core logic in services → easy to extend without UI changes.

---

## 📋 APPROVAL CHECKLIST

Before implementation, confirm:
- [ ] Tech stack approved (Next.js + Supabase + Claude)
- [ ] Database schema makes sense
- [ ] Folder structure is clear
- [ ] API endpoints are complete
- [ ] Dashboard layout is acceptable
- [ ] Security approach is sound
- [ ] Deployment plan is viable

**Status**: 🟡 Awaiting your feedback & approval
