# 🚀 CI/CD & DEVOPS STRATEGY

## 1️⃣ DEVELOPMENT WORKFLOW

### Git Branching Strategy (Git Flow)
```
main (production)
  ├── staging (pre-production)
  └── develop (integration)
      └── feature/* (feature branches)
      └── bugfix/* (bug fixes)
      └── hotfix/* (production fixes)

Naming conventions:
- feature/transaction-parser
- feature/budget-simulator
- bugfix/floating-point-rounding
- hotfix/critical-auth-bug
```

### Pull Request Process
```
1. Create feature branch from develop
2. Implement feature with tests
3. Push and open PR against develop
4. Code review (at least 1 approval)
5. All checks must pass:
   - [ ] Tests (unit, integration, E2E)
   - [ ] Coverage threshold (80%)
   - [ ] Linting (ESLint + Prettier)
   - [ ] Type checking (TypeScript strict mode)
   - [ ] Security scanning (npm audit)
6. Squash merge or rebase merge
7. Delete feature branch
8. Deploy to staging automatically
```

### Commit Message Convention (Conventional Commits)
```
feat: add budget allocation optimizer
fix: handle floating-point rounding in forecasts
docs: update README with deployment steps
test: add E2E tests for transaction parsing
perf: optimize monthly snapshot query
chore: update dependencies
refactor: extract validation logic to utility
ci: add Codecov reporting

Format: <type>(<scope>): <subject>
- type: feat, fix, docs, test, perf, refactor, chore, ci
- scope: optional component/feature
- subject: imperative, present tense ("add" not "added")
```

---

## 2️⃣ CONTINUOUS INTEGRATION (GitHub Actions)

### Test Pipeline
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [develop, staging, main]
  pull_request:
    branches: [develop, staging, main]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      # Setup
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm

      # Dependencies
      - run: npm ci --frozen-lockfile

      # Database setup
      - run: npx prisma migrate deploy --skip-generate

      # Tests
      - run: npm run test:unit -- --coverage
      - run: npm run test:integration
      - run: npm run test:e2e

      # Coverage reporting
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          fail_ci_if_error: true
          required: true  # Fail PR if coverage < 80%

      # Linting & type check
      - run: npm run lint
      - run: npm run type-check
      - run: npm audit --audit-level=high
```

### Lint & Type-Check Pipeline
```yaml
# .github/workflows/lint.yml
name: Lint & Type Check

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm

      - run: npm ci
      - run: npm run lint  # ESLint + Prettier
      - run: npm run type-check  # TypeScript strict mode
```

### Security Scanning
```yaml
# .github/workflows/security.yml
name: Security Scanning

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Dependency audit
      - run: npm audit --audit-level=high

      # SAST: Snyk (optional, paid)
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      # Secret scanning (automatic in GitHub)
      # GitHub detects API keys, tokens, etc.
```

---

## 3️⃣ CONTINUOUS DEPLOYMENT (Vercel)

### Automatic Deployments
```
main → Production (Vercel.com/financial-advisor)
staging → Staging (staging.financial-advisor.com)
develop → Preview (pr-123.financial-advisor.com)

Each branch auto-deploys on push.
```

### Environment-Specific Configuration
```typescript
// lib/config.ts
export const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    environment: 'development',
    logLevel: 'debug',
  },
  staging: {
    apiUrl: 'https://staging.financial-advisor.com',
    environment: 'staging',
    logLevel: 'info',
  },
  production: {
    apiUrl: 'https://financial-advisor.com',
    environment: 'production',
    logLevel: 'error',
  },
}
```

### Vercel Project Configuration
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "dev": "npm run dev",
  "envPrefix": "NEXT_PUBLIC_",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
    "CLAUDE_API_KEY": "@claude_api_key"
  },
  "regions": ["sfo1"],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Preview Deployments
```
Every PR gets:
- Unique preview URL (pr-123.financial-advisor.com)
- Same environment as production (replica DB)
- Automatic cleanup after 30 days
- GitHub comments with deployment links
```

---

## 4️⃣ MONITORING & OBSERVABILITY

### Application Performance Monitoring (APM)

**Vercel Analytics** (Built-in, free)
```
- Core Web Vitals
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Time to First Byte (TTFB)

Dashboard at: vercel.com/dashboard/financial-advisor
```

**Error Tracking** (Sentry - optional)
```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event) {
    // Don't send PII
    if (event.request?.headers?.authorization) {
      delete event.request.headers.authorization;
    }
    return event;
  },
});
```

### Database Monitoring (Supabase)
```
Available in Supabase dashboard:
- Query performance (slow queries)
- Table sizes (storage usage)
- Connection count (concurrent users)
- Replica lag (read-write consistency)
- Backup status

Alerts:
- Database disk usage > 80%
- Query execution > 5 seconds
- Replica lag > 100ms
```

### Logging Strategy
```typescript
// lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    // Console (development)
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    // File (production)
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})

// Usage
logger.info('Transaction created', { transactionId: 'tx-123', amount: 500 })
logger.error('Database error', { code: 'DB_TIMEOUT', errorMessage: '...' })
```

---

## 5️⃣ DATABASE MIGRATIONS

### Prisma Migrations
```bash
# Generate migration after schema change
npm run prisma migrate dev --name add_sinking_funds

# Deploy migration to production
npm run prisma migrate deploy

# Check migration status
npm run prisma migrate status
```

### Migration Checklist
```
Before deploying:
- [ ] Schema change aligns with feature
- [ ] Migration is reversible (add NOT NULL with default)
- [ ] No data loss (especially for renamed columns)
- [ ] Tested on staging database
- [ ] Backup of production database created
- [ ] Zero-downtime deployment plan (if needed)
```

### Zero-Downtime Deployment (For large migrations)
```typescript
// Strategy for adding NOT NULL column without data loss:
// 1. Add column as nullable (NULLABLE)
// 2. Backfill existing rows with default value
// 3. Add NOT NULL constraint in separate migration
// 4. Update application code to use new field

// Example: Adding monthly_snapshot_id to transactions
// Step 1: Add optional column
model Transaction {
  monthly_snapshot_id String? @db.Uuid
}

// Deploy & verify
// Step 2: Backfill (in separate migration)
UPDATE transactions
SET monthly_snapshot_id = (
  SELECT id FROM monthly_snapshots
  WHERE monthly_snapshots.user_id = transactions.user_id
  AND EXTRACT(YEAR_MONTH FROM transactions.date) = 
      EXTRACT(YEAR_MONTH FROM monthly_snapshots.period_start)
)
WHERE monthly_snapshot_id IS NULL

// Step 3: Add constraint
ALTER TABLE transactions
ALTER COLUMN monthly_snapshot_id SET NOT NULL

// Step 4: Update application code
```

---

## 6️⃣ DEPLOYMENT CHECKLIST

### Pre-Deployment
```
On develop branch:
- [ ] All tests passing (unit, integration, E2E)
- [ ] Coverage >= 80%
- [ ] No security vulnerabilities (npm audit)
- [ ] Linting passes (ESLint + Prettier)
- [ ] TypeScript type-check passes
- [ ] Code review approved
- [ ] Database migration tested on staging
- [ ] Environment variables configured on Vercel
- [ ] Changelog updated
- [ ] Release notes drafted
```

### Staging Deployment
```bash
# Merge to staging branch
git checkout staging
git merge develop
git push

# Vercel auto-deploys
# Run smoke tests:
- [ ] Login flow works
- [ ] Can create transaction
- [ ] Dashboard loads without errors
- [ ] API endpoints respond
- [ ] Database queries execute
```

### Production Deployment
```bash
# Merge to main (after staging approval)
git checkout main
git merge staging
git push

# Vercel auto-deploys to production
# Monitor for 1 hour:
- [ ] Error rate normal (< 1% of requests)
- [ ] Response time normal (< 200ms p99)
- [ ] Database load normal
- [ ] No spike in error logs
```

### Rollback Plan
```bash
# If production is broken, revert immediately:
git revert <commit-hash>
git push  # Vercel auto-deploys rollback

# Then:
1. Investigate error in staging
2. Fix on develop branch
3. Re-test on staging
4. Redeploy to production
```

---

## 7️⃣ BACKUP & DISASTER RECOVERY

### Automated Backups (Supabase)
```
Frequency: Daily
Retention: 30 days
Encryption: At rest
Point-in-time recovery: Available
Backup method: pg_dump (PostgreSQL standard)

Manual backup (before major changes):
1. Go to Supabase dashboard → Backups
2. Click "Create backup"
3. Wait for completion (5-10 minutes)
```

### Restore Procedure
```
Full restore (entire database):
1. Contact Supabase support
2. Provide backup timestamp
3. They provision new database from backup
4. Update DATABASE_URL connection string
5. Redeploy application

Point-in-time restore (specific table):
1. Supabase support restores to separate database
2. Export table using pg_dump
3. Import to production database

RTO: < 1 hour
RPO: < 5 minutes (last backup)
```

### Data Retention & Deletion
```typescript
// Scheduled cleanup job (runs nightly)
import cron from 'node-cron'

// Delete soft-deleted transactions after 365 days
cron.schedule('0 2 * * *', async () => {
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  await db.transactions.deleteMany({
    where: {
      deleted_at: { lt: cutoff }
    }
  })
})

// Archive old forecast models
cron.schedule('0 3 * * *', async () => {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  await db.forecastModels.updateMany({
    where: { created_at: { lt: cutoff } },
    data: { archived: true }
  })
})
```

---

## 8️⃣ RELEASE MANAGEMENT

### Semantic Versioning (SemVer)
```
MAJOR.MINOR.PATCH (e.g., 1.2.3)

MAJOR: Breaking API changes or major features
MINOR: New features (backward compatible)
PATCH: Bug fixes (backward compatible)

Examples:
- v1.0.0: Initial release
- v1.1.0: Add budget simulator feature
- v1.1.1: Fix floating-point rounding bug
- v2.0.0: Redesign dashboard (breaking change)
```

### Changelog Format
```markdown
## [1.1.0] - 2026-05-15

### Added
- Budget allocation optimizer algorithm
- Spending velocity detection alerts
- CSV export functionality

### Fixed
- Floating-point rounding in forecast calculations
- Transaction date validation accepting future dates

### Changed
- Dashboard redesign with new KPI layout
- Improved error messages for validation

### Deprecated
- Legacy transaction import format (will be removed in 2.0.0)

### Removed
- Old forecast engine (replaced with new deterministic model)

### Security
- Fixed XSS vulnerability in transaction descriptions
- Updated dependencies to patch security issue
```

---

## 9️⃣ LOCAL DEVELOPMENT

### Setup for New Developer
```bash
# Clone repository
git clone https://github.com/reebs/financial-advisor.git
cd financial-advisor

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with local Supabase credentials

# Setup database
npx prisma migrate deploy
npx prisma db seed  # Load seed data

# Start dev server
npm run dev

# Run tests
npm run test:unit
npm run test:integration

# Open in browser
open http://localhost:3000
```

### Debugging
```bash
# Debug tests
npm run test:unit -- --inspect-brk

# Debug application
node --inspect-brk node_modules/.bin/next dev

# Prisma Studio (visual database browser)
npx prisma studio

# Check TypeScript errors
npm run type-check

# Check linting errors
npm run lint
```

---

## 🔟 OPERATIONAL RUNBOOK

### Daily Tasks
- [ ] Check Vercel deployment status
- [ ] Review error logs in Sentry (if enabled)
- [ ] Verify backup completed successfully
- [ ] Check database size (Supabase dashboard)

### Weekly Tasks
- [ ] Review analytics (Core Web Vitals, user engagement)
- [ ] Update dependencies (npm update)
- [ ] Merge staging → main for weekly release
- [ ] Team sync on bugs and features

### Monthly Tasks
- [ ] Security audit (npm audit, check advisories)
- [ ] Database maintenance (analyze table sizes, remove old logs)
- [ ] Review monitoring thresholds
- [ ] Cost review (Vercel, Supabase, Claude API usage)

### Quarterly Tasks
- [ ] Performance review (response times, error rates)
- [ ] Capacity planning (growing user base implications)
- [ ] Roadmap planning for next quarter
- [ ] Customer/stakeholder feedback synthesis

---

## Summary

✅ **Git Flow**: Feature branches, PRs, code review  
✅ **CI**: Automated tests (unit, integration, E2E)  
✅ **Security**: npm audit, SAST, secret scanning  
✅ **CD**: Auto-deploy to staging/production  
✅ **Monitoring**: Vercel analytics, Supabase metrics, Sentry (optional)  
✅ **Logging**: Structured JSON logs, sensitive data filtered  
✅ **Migrations**: Prisma, zero-downtime strategy  
✅ **Backup**: Daily automated backups, 30-day retention  
✅ **Disaster recovery**: RTO < 1 hour, RPO < 5 minutes  
✅ **Release management**: SemVer, changelog, runbook  
