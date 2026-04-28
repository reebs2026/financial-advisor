# 🔐 SECURITY & COMPLIANCE STRATEGY

## 1️⃣ AUTHENTICATION & AUTHORIZATION

### Password Security
```typescript
// Using Supabase Auth (handles hashing + salting)
- Min length: 12 characters
- Complexity: Must include uppercase, lowercase, number, special char
- Expiry: No expiry (users manage their own)
- Failed attempts: Lock account after 5 failed attempts for 15 minutes
- Session timeout: 7 days of inactivity (auto-logout)
- JWT in httpOnly cookies (XSS protection)
```

### Row-Level Security (RLS)
```sql
-- Even for single-user, enforce RLS to prevent future bugs
-- All queries filtered by auth.uid()

CREATE POLICY "users_select_own_data"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_data"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_data"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_data"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);
```

### OAuth 2.0 / Social Login (Future)
```
- Support: Google, Apple, GitHub (standard OAuth2 providers)
- No passwords stored for OAuth users
- Automatic account creation on first login
- Email verification for security
```

---

## 2️⃣ DATA ENCRYPTION

### In Transit (HTTPS)
- ✅ Vercel auto-enables HTTPS
- ✅ All API calls over TLS 1.3
- ✅ HSTS header enforced (12 months)
- ✅ Certificate pinning not needed (rely on browser)

### At Rest
```typescript
// Sensitive fields encrypted in database
- Passwords: Supabase Auth (never stored in our tables)
- Account numbers: Encrypt with Supabase Vault (if storing)
- Personal data: Use database encryption (Supabase PgCrypto)

// Non-sensitive fields
- Amounts: Plain text (DECIMAL type)
- Dates: Plain text
- Categories: Plain text
// Rationale: Financial data is encrypted at database level; users can view their own
```

### Environment Variables
```bash
# .env.local (NEVER commit)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx (server-only, never expose)
CLAUDE_API_KEY=sk-xxx (server-only)

# Vercel stores these securely
# Never log these values
```

---

## 3️⃣ INPUT VALIDATION & INJECTION PREVENTION

### SQL Injection Prevention
- ✅ Prisma parameterized queries (automatic)
- ✅ No raw SQL in endpoints
- ✅ Zod validation before database queries

### XSS (Cross-Site Scripting) Prevention
```typescript
// React auto-escapes by default
<div>{userInput}</div> // Safe — HTML escaped

// Never use dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // DANGEROUS

// Sanitize if needed (rare)
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(userInput)
```

### CSRF (Cross-Site Request Forgery) Prevention
```typescript
// Next.js handles CSRF protection automatically:
// - SameSite=Strict cookies
// - Origin checking on state-changing requests
// - Middleware validates requests

// Manual validation (if needed):
const getCsrfToken = (req) => {
  return req.headers['x-csrf-token']
}
```

### Rate Limiting (See API_RATE_LIMITING.md)
- API endpoints rate-limited per user
- Claude API calls rate-limited (cost control)
- Login attempts rate-limited (brute force protection)

---

## 4️⃣ SENSITIVE DATA HANDLING

### What NOT to Log
```typescript
// NEVER log these:
- Passwords
- API keys / JWT tokens
- Email addresses
- Full account numbers
- Social security numbers
- Credit card numbers (even last 4 digits)
- Personal descriptions containing PII

// Safe to log:
- User ID (UUID, not email)
- Transaction amount (R500)
- Action: "user created transaction"
- Error codes: "INVALID_AMOUNT"
- Timestamps
- IP address (anonymized)
```

### Data Retention Policy
```
- Active user data: Retained indefinitely
- Deleted transactions: Soft delete (archived, not removed)
- Session logs: 90 days
- Error logs: 30 days
- API access logs: 7 days
- On account deletion: Hard delete after 30-day grace period
```

### Backup Encryption
```
- Supabase automated backups: Encrypted at rest
- Frequency: Daily
- Retention: 30 days
- Point-in-time recovery: Available
- Disaster recovery RTO: < 1 hour
- RPO: < 5 minutes
```

---

## 5️⃣ COMPLIANCE CHECKLIST

### POPIA (Protection of Personal Information Act - South Africa)
- ✅ User consent on signup (checkbox)
- ✅ Clear privacy policy (Privacy.md)
- ✅ No third-party data sharing without consent
- ✅ User right to access their data (export endpoint)
- ✅ User right to deletion (account deletion endpoint)
- ✅ Data breach notification plan (< 30 days)

### GDPR (If serving EU users)
- ✅ Lawful basis: Legitimate interest (personal financial management)
- ✅ Privacy by design: Minimal data collection
- ✅ Data subject rights: Access, rectification, deletion, export
- ✅ DPA (Data Processing Agreement) with Supabase
- ✅ DPIA (Data Protection Impact Assessment) for high-risk features

### PCI DSS (Payment Card Industry)
- 🚫 NOT applicable: We don't store credit card data
- ✅ Transactions logged but not card details
- ✅ If integration with bank APIs: Use Plaid (PCI-compliant)

### SOC 2 Type II (Future)
- Goal: Achieve SOC 2 Type II certification for enterprise customers
- Timeline: Year 2 roadmap
- Requires: 6-month monitoring period of security controls

---

## 6️⃣ THIRD-PARTY DEPENDENCIES

### Vetted & Trusted
| Dependency | Purpose | Security Review |
|------------|---------|-----------------|
| Supabase | Database + Auth | ✅ SOC 2 Type II certified |
| Prisma | ORM | ✅ Type-safe, no SQL injection risk |
| Claude API | NL parsing | ✅ Anthropic security standards |
| Recharts | Charting | ✅ Client-side only, no data sent |
| Tailwind | Styling | ✅ CSS utility, no security risk |
| ShadCN/ui | Components | ✅ Copy-paste, auditable |
| Zustand | State | ✅ Minimal library, simple |
| Zod | Validation | ✅ Runtime type checking |

### Dependency Scanning
```bash
# Weekly automated scans
npm audit
npm audit fix

# Automated PR updates
Dependabot enabled on GitHub
```

---

## 7️⃣ API SECURITY

### CORS (Cross-Origin Resource Sharing)
```typescript
// Allow only trusted origins
const ALLOWED_ORIGINS = [
  'https://financial-advisor.com',
  'https://staging.financial-advisor.com',
  'http://localhost:3000' // Development only
]

// Reject others
if (!ALLOWED_ORIGINS.includes(req.headers.origin)) {
  return NextResponse.json({ error: 'CORS error' }, { status: 403 })
}
```

### API Key Rotation
```
- Supabase JWT: Auto-rotated by Supabase
- Service role key: Rotated quarterly
- Claude API key: Rotated quarterly
- Process: Create new key, update Vercel env, revoke old key
```

### Request Signing (Future)
```
If moving to mobile app:
- Implement request signing (HMAC-SHA256)
- Timestamp validation to prevent replay attacks
- Rate limiting per device
```

---

## 8️⃣ SECURITY INCIDENT RESPONSE

### Breach Response Plan
```
1. DETECT (Automated alerting)
   - Supabase alerts for unauthorized access
   - CloudFlare logs for DDoS
   - Auth logs for suspicious login attempts

2. ISOLATE (Within 1 hour)
   - Revoke compromised API keys
   - Lock affected user accounts
   - Scale up infrastructure if DDoS

3. NOTIFY (Within 24 hours)
   - Email affected users
   - Post on status page
   - Contact Supabase support

4. REMEDIATE (Within 48 hours)
   - Root cause analysis
   - Deploy security patch
   - Rotate all secrets

5. DOCUMENT (Post-incident)
   - Write incident report
   - Update security checklist
   - Adjust monitoring rules
```

### Security Contacts
```
- Lead: Reebs (mr.odirile@gmail.com)
- Incident hotline: [to be defined]
- Supabase support: [account contact]
- Vercel support: [account contact]
```

---

## 9️⃣ SECURITY TESTING

### Manual Security Testing
```
Before each release:
- [ ] OWASP Top 10 checklist
- [ ] Input validation (try injections, XSS, etc.)
- [ ] Authentication (weak passwords, session hijacking)
- [ ] Authorization (try accessing other user's data)
- [ ] Encryption (verify HTTPS in-transit)
```

### Automated Security Testing
```bash
# Dependency scanning (weekly)
npm audit

# SAST (Static Application Security Testing)
npm run lint  # Catches obvious security issues

# DAST (Dynamic Application Security Testing)
# Future: Use tools like OWASP ZAP or Snyk
```

### Penetration Testing (Annual)
```
Year 2 roadmap:
- Hire professional penetration tester
- Test all endpoints for vulnerabilities
- Review architecture for design flaws
- Generate security report
```

---

## 🔟 SECURITY HEADERS

### Response Headers
```typescript
// Middleware: src/middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // CSP (Content Security Policy)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  )

  // HSTS
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  )

  return response
}
```

---

## Summary

✅ **Authentication**: Supabase Auth + JWT in httpOnly cookies  
✅ **Authorization**: Row-level security on all tables  
✅ **Encryption**: TLS in transit, database encryption at rest  
✅ **Input validation**: Zod + Prisma prevent injection  
✅ **Sensitive data**: Never logged, encrypted, access-controlled  
✅ **Compliance**: POPIA + GDPR ready (+ PCI DSS not applicable)  
✅ **Secrets**: Environment variables + Vercel secure storage  
✅ **Dependencies**: Minimal, vetted, auto-scanned  
✅ **Incident response**: Plan documented, contacts identified  
✅ **Security headers**: All critical headers configured  
