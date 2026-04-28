# Phase 1 Setup Checklist

## ✅ Project Scaffolding Complete

All Phase 1 files have been generated. Follow these steps to get the app running.

---

## STEP 1: Environment Setup (5 minutes)

### 1.1 Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Wait for database initialization
- Copy these values:
  - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
  - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Service Key → `SUPABASE_SERVICE_KEY`

### 1.2 Configure Environment
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
```

Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_KEY=xxxxx
DATABASE_URL=postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## STEP 2: Install Dependencies (10 minutes)

```bash
# Install all Node packages
npm install

# Verify installation
npm list next react typescript
```

Expected output shows Next.js 14, React 18, TypeScript 5.3

---

## STEP 3: Database Setup (5 minutes)

### 3.1 Generate Prisma Client
```bash
npm run prisma:generate
```

### 3.2 Run Migrations
```bash
npm run prisma:migrate
```

This creates all 17 tables in your Supabase database.

### 3.3 Verify in Supabase
- Go to Supabase Dashboard
- Click "SQL Editor"
- Run: `SELECT * FROM information_schema.tables WHERE table_schema='public';`
- You should see all 17 tables created

### 3.4 (Optional) View Database
```bash
npm run prisma:studio
```

Opens Prisma Studio at http://localhost:5555 to explore tables visually.

---

## STEP 4: Run Development Server (2 minutes)

```bash
npm run dev
```

Expected output:
```
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

Visit [http://localhost:3000](http://localhost:3000)

---

## STEP 5: Test the App (5 minutes)

### 5.1 Signup
- You're redirected to `/login`
- Click "Sign up"
- Enter email & password (min 8 chars)
- Confirm password
- Click "Sign Up"

### 5.2 Email Confirmation
- Check your email inbox (or spam)
- Click the confirmation link
- You're back at login

### 5.3 Login
- Enter your email & password
- Click "Log In"
- You're redirected to `/dashboard`

### 5.4 Add Transaction
- You see the dashboard with 4 KPI cards
- Right side: "Add Transaction" form
- Fill in:
  - Type: "Expense"
  - Amount: 250.00
  - Account: (if you don't have one, create it first)
  - Date: Today
  - Description: "Test transaction"
- Click "Add Transaction"
- See it appear in "Recent Transactions"

### 5.5 Logout
- Click "Log out" in the header
- You're back at login

---

## STEP 6: Setup Git (2 minutes)

```bash
# Initialize git repo
git init

# Add all files
git add .

# Create first commit
git commit -m "chore: initial project scaffold (Phase 1)

- Next.js 14 + TypeScript setup
- Supabase Auth integration
- Prisma ORM with 17-table schema
- Dashboard with KPI cards
- Transaction entry form
- API endpoints for dashboard, transactions
- Zustand state management
- Tailwind CSS + ShadCN/ui styling
- Production-grade error handling & validation"

# Add GitHub remote (create repo on GitHub first)
git remote add origin https://github.com/YOUR_USERNAME/financial-advisor.git
git branch -M main
git push -u origin main
```

---

## STEP 7: Deploy to Vercel (5 minutes)

### 7.1 Push to GitHub (if not done)
```bash
git push -u origin main
```

### 7.2 Deploy to Vercel
- Go to [vercel.com](https://vercel.com)
- Click "Add New..." → "Project"
- Import your GitHub repo
- Set environment variables (copy from `.env.local`)
- Click "Deploy"

Vercel automatically deploys on `git push`

---

## What's Included

### ✅ Files Created
- **Configuration**: tsconfig.json, tailwind.config.ts, next.config.js, postcss.config.js
- **Authentication**: Login & signup pages with Supabase Auth
- **Dashboard**: Main dashboard with KPI cards & recent transactions
- **Components**: KPICard, RecentTransactions, TransactionForm, DashboardLayout
- **Services**: TransactionService with 6 core methods
- **Store**: Zustand store for client state
- **API Routes**: /api/dashboard, /api/dashboard/metrics, /api/transactions
- **Middleware**: Auth protection for /dashboard routes
- **Database**: Prisma schema with 17 tables
- **Utilities**: Zod validation schemas, Supabase client, Prisma client
- **Styling**: Global CSS with Tailwind components
- **Types**: TypeScript interfaces for all data models

### ✅ Features Implemented
- User signup & login
- Email confirmation
- Protected dashboard routes
- KPI metrics (balance, income, expenses, buffer days)
- Manual transaction entry
- Recent transaction list
- Account selection on transactions
- Category selection on expenses
- Form validation
- Error handling
- Loading states
- Responsive design (mobile-first)
- Accessibility (WCAG 2.1 Level AA ready)

### ✅ Security
- JWT tokens in httpOnly cookies
- Zod input validation
- SQL injection prevention (Prisma)
- XSS prevention (React)
- CSRF prevention (Supabase)
- Security headers configured

### ✅ Ready for Phase 2
- Database schema supports all features
- Service layer architecture for business logic
- Zustand store for state
- API route pattern for new endpoints
- Validation framework in place

---

## Common Issues & Fixes

### Issue: "Unauthorized" on dashboard
**Fix**: 
- Clear browser cookies
- Login again
- Check Supabase credentials in `.env.local`

### Issue: Database migration fails
**Fix**:
- Check DATABASE_URL in `.env.local`
- Verify Supabase project is running
- Check PostgreSQL connection: `npx prisma db execute --stdin < connection_test.sql`

### Issue: "Cannot find module '@/lib/supabase'"
**Fix**:
```bash
npm run prisma:generate
npm install
```

### Issue: TypeScript errors
**Fix**:
```bash
npm run type-check
npm run prisma:generate
```

### Issue: Port 3000 already in use
**Fix**:
```bash
npm run dev -- -p 3001
# Or kill the process using port 3000
```

---

## Next Steps (Phase 2)

Once Phase 1 is running, next steps are:

1. **Week 2**: AI transaction parsing (Claude API)
2. **Week 3**: Budget system (3 tiers: protected/strategic/flexible)
3. **Week 4**: Debt tracking & sinking funds
4. **Week 5**: Forecasting engine & advisory
5. **Week 6**: Visualizations & launch

---

## Verification Checklist

- [ ] `.env.local` configured with Supabase credentials
- [ ] `npm install` completed
- [ ] `npm run prisma:generate` ran successfully
- [ ] `npm run prisma:migrate` created all tables
- [ ] `npm run dev` starts without errors
- [ ] Can signup at http://localhost:3000/signup
- [ ] Can login at http://localhost:3000/login
- [ ] Dashboard loads with KPI cards
- [ ] Can create a transaction
- [ ] Can logout
- [ ] Git repo initialized and pushed
- [ ] Vercel deployment successful

---

## Support

If you get stuck:

1. **Read the error message carefully** - it usually tells you what's wrong
2. **Check `.env.local`** - 90% of issues are config-related
3. **Check Supabase dashboard** - verify project is running
4. **Read README.md** - comprehensive setup & troubleshooting
5. **Check network tab** - verify API calls succeeding
6. **Run `npm run type-check`** - catch TypeScript issues

---

## Timeline

- Setup & Verification: **30-45 minutes**
- Phase 1 running: **End of Day 1**
- Phase 2 ready: **Day 2**

You're all set! 🚀
