# Docker Sandbox Environment Setup

This guide walks you through setting up and running the Financial Advisor application in a Docker sandbox. This isolated environment lets you test the entire application without installing Node.js or dependencies on your local machine.

## Prerequisites

You need Docker and Docker Compose installed on your system:

- **Docker Desktop** (includes both Docker and Docker Compose)
  - macOS: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
  - Windows: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - Linux: [Docker Engine](https://docs.docker.com/engine/install/)

Verify installation:
```bash
docker --version
docker-compose --version
```

## Quick Start (3 steps)

### Step 1: Prepare Environment

Your `.env.local` file is already configured with Supabase credentials. Docker will use it automatically.

### Step 2: Build the Docker Image

From the project root directory, run:

```bash
docker-compose build
```

This does:
- Creates a Node.js 18 Alpine container
- Installs all npm dependencies
- Generates Prisma client
- Builds the Next.js application for production
- Creates a lean production image (~500MB)

**First build takes 3-5 minutes.** Subsequent builds are faster.

### Step 3: Start the Application

```bash
docker-compose up
```

The output will show:
```
financial-advisor-app  | ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

Visit **http://localhost:3000** in your browser.

## Common Commands

### Start in Background
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f app
```

### Stop the Application
```bash
docker-compose down
```

### Stop and Remove Everything (including database)
```bash
docker-compose down -v
```

### Rebuild After Code Changes
```bash
docker-compose build --no-cache
docker-compose up
```

### Access Container Shell
```bash
docker-compose exec app sh
```

### Run Prisma Commands Inside Container
```bash
docker-compose exec app npm run prisma:migrate
docker-compose exec app npm run prisma:studio
```

## Development Mode (Auto-reload)

To enable hot-reload during development, uncomment the volumes section in `docker-compose.yml`:

```yaml
volumes:
  - .:/app                    # Sync all code
  - /app/node_modules        # Don't sync node_modules
  - /app/.next               # Don't sync build cache
```

Then rebuild and start:
```bash
docker-compose up --build
```

Changes to files will hot-reload automatically.

## Testing Scenarios

### Scenario 1: Test Signup/Login Flow

1. Start the app: `docker-compose up`
2. Go to http://localhost:3000/signup
3. Create an account with:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
4. Check your email (Supabase will send confirmation)
5. Click confirmation link
6. Login with same credentials
7. You should see the dashboard

### Scenario 2: Test Transactions

1. Login to dashboard
2. Click "Add Transaction" on the right
3. Fill in:
   - Type: "Expense"
   - Amount: 150.00
   - Account: (select or create)
   - Date: Today
   - Category: (select or create)
   - Description: "Test expense"
4. Click "Add Transaction"
5. See it appear in Recent Transactions

### Scenario 3: Test with Mock Data

To populate test data, access the container:

```bash
docker-compose exec app npm run prisma:studio
```

This opens Prisma Studio at http://localhost:5555 where you can:
- View all database tables
- Create test users, accounts, transactions
- Verify data relationships

## Troubleshooting

### Port 3000 Already in Use

If you get "Address already in use", either:

**Option A**: Stop the conflicting service
```bash
# Find what's using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

**Option B**: Use a different port
```bash
# Edit docker-compose.yml
# Change: ports: - "3000:3000"
# To:     ports: - "3001:3000"
```

Then visit http://localhost:3001

### Container Exits Immediately

Check logs:
```bash
docker-compose logs app
```

Common causes:
- Environment variables not set (check `.env.local`)
- Database connection error (verify Supabase credentials)
- Port already in use

### Database Connection Error

Verify your credentials in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_KEY=your-service-key
DATABASE_URL=postgresql://postgres:password@...
```

Then restart:
```bash
docker-compose down
docker-compose up
```

### Out of Disk Space

Docker images and volumes can use significant space. Clean up:

```bash
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything (be careful!)
docker system prune -a
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Docker Container                │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │   Node.js 18 Alpine (139MB)       │  │
│  │   ┌─────────────────────────────┐ │  │
│  │   │  Next.js 14 App             │ │  │
│  │   │  - React 18 Components      │ │  │
│  │   │  - API Routes               │ │  │
│  │   │  - Middleware               │ │  │
│  │   └─────────────────────────────┘ │  │
│  └───────────────────────────────────┘  │
│                   │                      │
│                   ↓                      │
│  ┌───────────────────────────────────┐  │
│  │   PostgreSQL 15 (optional)        │  │
│  │   - For local-only testing        │  │
│  │   - Use Supabase for real DB      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         ↓ (port 3000)
    http://localhost:3000
```

## Two Database Options

### Option A: Use Supabase (Recommended)

Your `.env.local` already points to Supabase. Docker connects to it directly.

**Pros:**
- Production-like environment
- Real Supabase features (Auth, RLS)
- Same database as deployed app

**Cons:**
- Requires internet connection
- All data persists (can accumulate test data)

### Option B: Use Local PostgreSQL

Uncomment the `postgres` service in `docker-compose.yml` and set:

```bash
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/financial_advisor
```

**Pros:**
- Isolated from production
- Fast (no network latency)
- Easy to reset

**Cons:**
- Need separate Supabase for Auth
- Different from production setup

## Environment Consistency

Docker ensures consistency:

| Aspect | Local | Docker | Production |
|--------|-------|--------|-----------|
| OS | Your system | Alpine Linux | Alpine Linux |
| Node | System version | 18.x | 18.x |
| Dependencies | npm install | npm install | npm install |
| Environment | .env.local | .env.local | .env (secure) |

This makes Docker a true sandbox that matches production behavior.

## Next Steps

1. ✅ Build: `docker-compose build`
2. ✅ Start: `docker-compose up`
3. ✅ Test the flows (signup, login, transactions)
4. ✅ Run `docker-compose down` when done

Once you've verified the app works in Docker, you can:
- Proceed to Phase 2 (AI parsing)
- Deploy to Vercel
- Set up CI/CD with Docker
- Scale to multiple containers (coming in Phase 6)

## Docker Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Best Practices for Node.js in Docker](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Alpine Linux](https://alpinelinux.org/) - Lightweight base image

## Support

If you encounter issues:

1. **Check logs**: `docker-compose logs app`
2. **Verify environment**: `docker-compose config`
3. **Rebuild clean**: `docker-compose build --no-cache`
4. **Restart everything**: `docker-compose down -v && docker-compose up --build`
5. **Check Docker resources**: Docker Desktop → Settings → Resources
