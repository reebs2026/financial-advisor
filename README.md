# Financial Advisor

A full-scale digital financial management platform built with Next.js, TypeScript, Supabase, and Prisma.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript 5.3
- **Styling**: Tailwind CSS, ShadCN/ui components
- **Database**: Supabase PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth with JWT
- **State Management**: Zustand
- **Validation**: Zod
- **Charts**: Recharts
- **Testing**: Vitest, Playwright
- **Deployment**: Vercel

## Setup Instructions

### 1. Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- PostgreSQL database (via Supabase)

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local
```

Then fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
DATABASE_URL=postgresql://user:password@localhost:5432/financial_advisor
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (creates all tables)
npm run prisma:migrate

# (Optional) View database in Prisma Studio
npm run prisma:studio
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
├── services/              # Business logic layer
├── store/                 # Zustand state management
├── types/                 # TypeScript type definitions
├── lib/                   # Utility functions
└── middleware.ts          # Auth middleware
```

## Key Features (Phase 1)

- ✅ User authentication (signup/login)
- ✅ Dashboard with KPI cards
- ✅ Manual transaction entry
- ✅ Account management
- ✅ Category management
- ✅ Recent transaction list
- ✅ Monthly balance tracking

## Available Scripts

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript
npm run test:unit        # Run unit tests
npm run test:e2e         # Run E2E tests
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run format           # Format code with Prettier
npm run clean            # Clean build artifacts
```

## Authentication Flow

1. User signs up at `/signup`
2. Email confirmation (via Supabase)
3. Login at `/login`
4. JWT token stored in secure httpOnly cookie
5. Middleware protects `/dashboard` routes
6. User can logout from dashboard

## Database Schema

The application uses 17 tables:

- `users` - User accounts (Supabase Auth)
- `accounts` - Bank, investment, debt accounts
- `transactions` - Income, expense, transfer records
- `categories` - Spending categories (user-defined)
- `budgets` - Budget allocations (3 tiers)
- `budget_allocations` - Monthly budget tracking
- `debt_accounts` - Credit cards, loans
- `debt_payments` - Debt payment history
- `sinking_funds` - Emergency fund, car service, etc.
- `sinking_fund_contributions` - Monthly contributions
- `investments` - Stocks, ETFs, Unit Trusts
- `investment_snapshots` - Historical investment values
- `monthly_snapshots` - Monthly financial summary
- `forecast_models` - Saved forecast scenarios
- `usage` - API quota tracking
- `audit_logs` - Security and compliance logs

All tables include:
- Proper foreign keys with cascading deletes
- Timestamps (createdAt, updatedAt)
- Row-level security (RLS) ready
- Strategic indexes for query performance

## API Endpoints (Phase 1)

### Authentication (Supabase)
- `POST /auth/signup` - Sign up
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout

### Dashboard
- `GET /api/dashboard` - Get dashboard data (accounts, categories, transactions, metrics)
- `GET /api/dashboard/metrics` - Get dashboard KPI metrics

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - Get recent transactions

## Input Validation

All endpoints use Zod schemas for validation:

```typescript
// Example: Create Transaction
CreateTransactionSchema = z.object({
  account_id: z.string().min(1),
  amount: z.number().positive().max(999999999.99),
  date: z.string().datetime().or(z.date()),
  description: z.string().min(1).max(500),
  transaction_type: z.enum(['income', 'expense', 'transfer']),
  category_id: z.string().optional(),
})
```

## Error Handling

All API routes return standardized responses:

```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: "Error message", details?: [...] }
```

HTTP status codes:
- `200` - OK
- `400` - Bad request (validation error)
- `401` - Unauthorized
- `500` - Server error

## Security

- ✅ Supabase Auth with JWT
- ✅ HTTPS/TLS 1.3 (via Vercel)
- ✅ Input validation (Zod)
- ✅ SQL injection prevention (Prisma)
- ✅ XSS prevention (React escaping)
- ✅ CSRF prevention (SameSite cookies)
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ Row-level security ready (Supabase RLS)

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Auto-deploys on push

```bash
# Or deploy manually
npm run build
npm run start
```

### Manual Deployment

1. Build: `npm run build`
2. Start: `npm run start`
3. Set `NODE_ENV=production`
4. Configure environment variables

## Testing

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# All tests
npm run test

# Coverage
npm run test:unit -- --coverage
```

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Format code: `npm run format`
4. Lint: `npm run lint`
5. Commit: `git commit -m "feat: description"`
6. Push: `git push origin feature/your-feature`
7. Create pull request

## Troubleshooting

### "Unauthorized" error
- Check Supabase credentials in `.env.local`
- Verify JWT token in cookies
- Clear cookies and re-login

### Database connection error
- Verify `DATABASE_URL` in `.env.local`
- Check Supabase is running
- Run migrations: `npm run prisma:migrate`

### Types error
- Run `npm run type-check`
- Regenerate Prisma: `npm run prisma:generate`

## Phase 2-6 Roadmap

- **Phase 2**: AI parsing (Claude API)
- **Phase 3**: Budgets, debt, sinking funds
- **Phase 4**: Forecasting & advisory
- **Phase 5**: Visualizations & polish
- **Phase 6**: Advanced features

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - 6-phase roadmap
- [ERROR_HANDLING_VALIDATION.md](./ERROR_HANDLING_VALIDATION.md) - Validation rules
- [SECURITY_COMPLIANCE.md](./SECURITY_COMPLIANCE.md) - Security approach
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Testing pyramid

## Support

For questions or issues:
1. Check documentation
2. Review error logs
3. Check Supabase dashboard
4. Debug with Prisma Studio: `npm run prisma:studio`

## License

Copyright © 2026 Financial Advisor. All rights reserved.
