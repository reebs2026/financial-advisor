# 📊 API RATE LIMITING & QUOTA MANAGEMENT

## 1️⃣ RATE LIMITING STRATEGY

### General API Rate Limits
```
Tier: Free User (all users initially)

Requests per minute: 60 req/min
Requests per hour: 1,000 req/hr
Requests per day: 10,000 req/day
Concurrent requests: 10 simultaneous

Cost: $0
Upgrade available: Yes (when user pays)

Burst allowance: 10 extra requests (short-term spike)
```

### Rate Limit Headers
```
Every response includes:
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1682342400 (unix timestamp)
Retry-After: 30 (seconds to wait before retry)
```

### Rate Limit Enforcement
```typescript
// Middleware: src/middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 req/min
  analytics: true, // Track rate limits
  prefix: 'ratelimit',
})

export async function middleware(request: NextRequest) {
  const ip = getClientIP(request)
  const userId = request.headers.get('x-user-id')
  
  // Use userId if authenticated, fall back to IP
  const identifier = userId || ip
  
  const { success, limit, remaining, reset, pending } = 
    await ratelimit.limit(identifier)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((reset - Date.now()) / 1000),
        }
      }
    )
  }

  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', reset.toString())
  
  return response
}
```

### Cost-Based Rate Limiting

**Claude API costs scale with usage:**
```
Input: $0.003 per 1K tokens
Output: $0.015 per 1K tokens

Estimated costs per feature:
- Simple transaction parse: $0.01
- Complex transaction parse: $0.03
- Budget recommendation: $0.05
- Forecast generation: $0.10

Monthly quota allocation: $10 (1000 simple parses)
```

---

## 2️⃣ PER-ENDPOINT RATE LIMITS

### Transaction Endpoints

```
POST /api/transactions (Create)
- General limit: 60 req/min
- Burst: 20 in 10 seconds allowed
- Daily: 500 transactions/day (user won't create more)
- Cost: $0.01 per call (if AI parsing)

GET /api/transactions (Read)
- General limit: 200 req/min
- No daily limit (read-only, free)
- Cost: $0 (read operations are cheap)

DELETE /api/transactions/:id
- General limit: 30 req/min
- Daily: 100 deletions/day
- Cost: $0
```

### Budget Endpoints

```
POST /api/budgets (Create)
- General limit: 60 req/min
- Daily: 20 budgets/day (soft limit)
- Cost: $0

GET /api/budgets (Read)
- General limit: 200 req/min
- Cost: $0

POST /api/budgets/:id/simulate
- General limit: 30 req/min (CPU intensive)
- Daily: 100 simulations/day
- Cost: $0.02 per call (forecast engine)
```

### AI Parsing Endpoints

```
POST /api/transactions/parse (AI)
- MOST EXPENSIVE - Cost: $0.01-0.05 per call
- Limit: 20 req/min (aggressive rate limiting)
- Daily: 50 calls/day maximum
- Burst: 5 in 1 minute allowed
- Timeout: 30 seconds

Cost control mechanism:
- Track usage per user
- Alert if approaching daily limit
- Block if daily limit exceeded
- Charge to credits if available
```

### Forecast Endpoints

```
GET /api/forecasts
- General limit: 60 req/min
- Caching: Results cached 1 hour (don't re-query)
- Cost: $0.10 per computation (rare)

POST /api/forecasts/compute
- Limit: 5 req/day (expensive computation)
- Caching: 1 week after computation
- Cost: $0.10 per call
- Timeout: 60 seconds
```

### Advisory Endpoints

```
GET /api/advisory/recommendations
- Limit: 30 req/min
- Caching: 12 hours
- Cost: $0 (rule-based, no AI)

POST /api/advisory/analyze
- Limit: 10 req/day (AI analysis)
- Cost: $0.05 per call
- Timeout: 45 seconds
```

---

## 3️⃣ QUOTA MANAGEMENT

### Monthly Quota Allocation

```
Free Tier:
- API calls: 10,000 req/month
- AI parsing: 50 calls/month
- Forecast generation: 5 computations/month
- Recurring: Yes, resets monthly

Pro Tier ($9.99/month):
- API calls: 100,000 req/month (unlimited practical)
- AI parsing: 500 calls/month
- Forecast generation: 50 computations/month
- Recurring: Yes, resets monthly

Enterprise Tier (Custom):
- API calls: Custom
- AI parsing: Custom
- Forecast generation: Custom
- SLA: Included
```

### Usage Tracking

```typescript
// Prisma schema
model Usage {
  id        String   @id @default(cuid())
  user_id   String   @db.Uuid
  user      User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  month     String   @default(db.now()) // "2026-04" for April 2026
  
  api_calls_count        Int @default(0)
  ai_parse_count         Int @default(0)
  forecast_count         Int @default(0)
  
  api_calls_cost         Decimal @default(0)  // In cents
  ai_parse_cost          Decimal @default(0)
  forecast_cost          Decimal @default(0)
  total_cost             Decimal @default(0)
  
  quota_api_calls        Int @default(10000)  // 10k for free tier
  quota_ai_parse         Int @default(50)
  quota_forecast         Int @default(5)
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  @@unique([user_id, month])
}
```

### Usage Tracking Middleware

```typescript
// lib/quota.ts
export async function trackUsage(
  userId: string,
  feature: 'api_call' | 'ai_parse' | 'forecast',
  cost: number
) {
  const month = new Date().toISOString().slice(0, 7) // "2026-04"
  
  const usage = await db.usage.upsert({
    where: { user_id_month: { user_id, month } },
    update: {
      [`${feature}_count`]: { increment: 1 },
      [`${feature}_cost`]: { increment: cost },
      total_cost: { increment: cost },
    },
    create: {
      user_id,
      month,
      [`${feature}_count`]: 1,
      [`${feature}_cost`]: cost,
      total_cost: cost,
    }
  })
  
  return usage
}

export async function checkQuota(
  userId: string,
  feature: 'api_call' | 'ai_parse' | 'forecast'
): Promise<boolean> {
  const month = new Date().toISOString().slice(0, 7)
  const usage = await db.usage.findUnique({
    where: { user_id_month: { user_id, month } }
  })
  
  if (!usage) return true // No usage yet, quota not exceeded
  
  const count = usage[`${feature}_count`]
  const quota = usage[`quota_${feature}`]
  
  return count < quota
}
```

---

## 4️⃣ QUOTA ALERTS & NOTIFICATIONS

### Alert Thresholds

```typescript
// Send email alerts when usage crosses thresholds
async function checkQuotaAlerts(userId: string) {
  const month = new Date().toISOString().slice(0, 7)
  const usage = await db.usage.findUnique({
    where: { user_id_month: { user_id, month } }
  })
  
  if (!usage) return
  
  // AI Parse alerts (most expensive)
  const aiParsePercent = (usage.ai_parse_count / usage.quota_ai_parse) * 100
  if (aiParsePercent === 50 && !usage.alerted_ai_50) {
    await sendEmail(userId, '50% of AI parsing quota used')
    usage.alerted_ai_50 = true
  }
  if (aiParsePercent === 80 && !usage.alerted_ai_80) {
    await sendEmail(userId, '80% of AI parsing quota used')
    usage.alerted_ai_80 = true
  }
  if (aiParsePercent >= 100) {
    await sendEmail(userId, 'AI parsing quota exceeded')
  }
  
  // Similar alerts for forecast
  const forecastPercent = (usage.forecast_count / usage.quota_forecast) * 100
  // ...
  
  await db.usage.update({ where: { id: usage.id }, data: usage })
}
```

### In-App Quota Display

```typescript
// Dashboard component
export function QuotaUsage({ userId }) {
  const usage = useQuery(['quota', userId], () => 
    fetch(`/api/user/quota`).then(r => r.json())
  )
  
  return (
    <div className="quota-panel">
      <h3>Monthly Usage</h3>
      
      {/* AI Parsing (most important) */}
      <div className="quota-item">
        <label>AI Transaction Parsing</label>
        <ProgressBar 
          used={usage.ai_parse_count} 
          total={usage.quota_ai_parse}
        />
        <span>{usage.ai_parse_count} / {usage.quota_ai_parse} calls</span>
        {usage.ai_parse_count >= usage.quota_ai_parse && (
          <Alert variant="warning">
            Quota exceeded. Upgrade to Pro for more.
          </Alert>
        )}
      </div>
      
      {/* API Calls */}
      <div className="quota-item">
        <label>Total API Calls</label>
        <ProgressBar 
          used={usage.api_calls_count} 
          total={usage.quota_api_calls}
        />
        <span>{usage.api_calls_count} / {usage.quota_api_calls}</span>
      </div>
      
      {/* Forecast Computations */}
      <div className="quota-item">
        <label>Forecast Computations</label>
        <ProgressBar 
          used={usage.forecast_count} 
          total={usage.quota_forecast}
        />
        <span>{usage.forecast_count} / {usage.quota_forecast}</span>
      </div>
    </div>
  )
}
```

---

## 5️⃣ UPGRADE MECHANISM

### Quota Upgrade on Subscription

```typescript
// When user upgrades from Free to Pro
async function upgradeSubscription(userId: string) {
  const month = new Date().toISOString().slice(0, 7)
  
  // Update user tier
  await db.users.update({
    where: { id: userId },
    data: { subscription_tier: 'pro' }
  })
  
  // Update current month's quota
  await db.usage.update({
    where: { user_id_month: { userId, month } },
    data: {
      quota_api_calls: 100_000,
      quota_ai_parse: 500,
      quota_forecast: 50,
    }
  })
  
  // Send confirmation
  await sendEmail(userId, 'Upgrade successful!')
}

// Quota resets automatically on month boundary
// (handled by cron job)
async function resetMonthlyQuotas() {
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const monthStr = nextMonth.toISOString().slice(0, 7)
  
  const users = await db.users.findMany()
  for (const user of users) {
    const quotas = getQuotasForTier(user.subscription_tier)
    
    await db.usage.create({
      data: {
        user_id: user.id,
        month: monthStr,
        quota_api_calls: quotas.apiCalls,
        quota_ai_parse: quotas.aiParse,
        quota_forecast: quotas.forecast,
      }
    })
  }
}
```

---

## 6️⃣ COST OPTIMIZATION

### Caching Strategy

```typescript
// Cache expensive operations
const CACHE_TTL = {
  forecasts: 3600 * 24,      // 24 hours
  recommendations: 3600 * 12, // 12 hours
  snapshots: 3600 * 24,      // 24 hours
  transactions: 300,          // 5 minutes
}

// Redis caching
async function getForecast(userId: string) {
  const cacheKey = `forecast:${userId}:${getCurrentMonth()}`
  
  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)
  
  // Compute if not in cache
  const forecast = await computeForecast(userId)
  
  // Cache result
  await redis.setex(cacheKey, CACHE_TTL.forecasts, JSON.stringify(forecast))
  
  return forecast
}
```

### API Call Deduplication

```typescript
// Don't re-call API if request is duplicate (within 1 second)
const requestDedup = new Map()

function getDedupKey(userId: string, endpoint: string, params: object) {
  return `${userId}:${endpoint}:${JSON.stringify(params)}`
}

async function dedupedFetch(userId: string, endpoint: string, params: object) {
  const key = getDedupKey(userId, endpoint, params)
  
  // Check if same request in-flight
  if (requestDedup.has(key)) {
    return requestDedup.get(key) // Return pending promise
  }
  
  // Make request
  const promise = fetch(endpoint, { body: JSON.stringify(params) })
    .then(r => r.json())
    .finally(() => requestDedup.delete(key)) // Clean up after 1s
  
  requestDedup.set(key, promise)
  return promise
}
```

### Batch Operations

```typescript
// Instead of 100 individual POST /api/transactions calls:
// POST /api/transactions/batch with 100 transactions

POST /api/transactions/batch
{
  "transactions": [
    { "amount": 100, "description": "Coffee" },
    { "amount": 50, "description": "Bus" },
    { "amount": 200, "description": "Groceries" },
    // ... 97 more
  ]
}

// Counts as 1 API call + 1 AI parsing call (if parsing)
// Instead of 100 API calls
```

---

## 7️⃣ MONITORING & ALERTS

### Rate Limit Violations
```
- Alert if user hits limit 5+ times in day
- Pattern: Possible bot/scraper activity
- Action: Temporarily reduce quota, contact user

Dashboard metric:
- Violations per user per day
- Most-violated endpoints
- Peak violation times
```

### Quota Overages

```
- Alert if user exceeds monthly quota
- Action: Block further AI calls, offer upgrade
- Grace period: 24 hours (for account upgrade)

Overages handling:
- Free tier: Cannot exceed (hard limit)
- Pro tier: Can exceed (charged at overage rate)
- Overage rate: 1.5x normal cost

Example:
- AI parsing cost: $0.01
- Overage cost: $0.015
```

---

## 8️⃣ FAIR USE POLICY

### Prohibited Usage

```
Rate limiting prevents:
- Credential stuffing (login spam)
- DDoS attacks (bulk requests)
- Web scraping (harvesting data)
- Competitive intelligence gathering
- Automated testing without permission

Enforcement:
- Temporary block (1 hour)
- Account suspension (repeat offenders)
- Legal action (severe cases)
```

### Acceptable Usage

```
✅ Normal user activity (logging transactions)
✅ Batch imports (CSV, OFX)
✅ Automated backups (scheduled daily)
✅ Mobile app sync (with exponential backoff)
✅ API integrations (with proper rate limiting)
```

---

## Summary

✅ **Rate Limiting**: 60 req/min, implemented with Upstash  
✅ **Cost Control**: AI parsing limited to 50 calls/month free  
✅ **Quota Tracking**: Per-user monthly quotas in database  
✅ **Alerts**: Email warnings at 50%, 80%, 100% quota  
✅ **Upgrades**: Pro tier 10x quota increase  
✅ **Caching**: Forecast/recommendations cached to reduce costs  
✅ **Batch Operations**: Reduce API call count  
✅ **Monitoring**: Dashboard shows current quota usage  
✅ **Fair Use**: Protected against abuse  
✅ **Overages**: Tracked and charged (Pro tier only)  
