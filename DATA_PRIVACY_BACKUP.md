# 🔒 DATA PRIVACY & BACKUP STRATEGY

## 1️⃣ DATA PRIVACY PRINCIPLES

### Privacy by Design
```
1. Minimize data collection
   - Only collect what's needed for functionality
   - Don't ask for info you won't use

2. Minimize retention
   - Delete when no longer needed
   - Archive old data, don't hoard

3. Minimize exposure
   - Encrypt in transit and at rest
   - Never expose to third parties without consent
   - Use RLS even for single-user app

4. Transparency
   - Clear privacy policy
   - Explain how data is used
   - User control over their data
```

---

## 2️⃣ DATA INVENTORY

### What Data We Collect

| Data Type | Purpose | Sensitivity | Retention |
|-----------|---------|-------------|-----------|
| Email | User identification, password reset | HIGH | Account lifetime |
| Password hash | Authentication | CRITICAL | Account lifetime |
| Transactions | Financial tracking | HIGH | User-configured (min 2 years) |
| Accounts | Asset tracking | HIGH | Account lifetime |
| Categories | Organization | LOW | Account lifetime |
| Budgets | Spending goals | MEDIUM | Account lifetime |
| Session tokens | Authentication | CRITICAL | 7 days |
| Login logs | Security monitoring | MEDIUM | 90 days |
| Error logs | Debugging | MEDIUM | 30 days |
| IP address | Rate limiting, fraud detection | MEDIUM | 7 days |
| Device fingerprint | Session security | MEDIUM | 7 days |
| API keys | Third-party integrations | CRITICAL | Until deleted |

### What We DON'T Collect
```
- ✅ Browsing history
- ✅ Geolocation
- ✅ Demographic data (unless entered by user)
- ✅ Biometric data
- ✅ Third-party data (without explicit consent)
- ✅ Cookies for tracking (only functional/security cookies)
```

---

## 3️⃣ USER DATA RIGHTS

### Right to Access (POPIA §14)
```
Endpoint: GET /api/user/data-export

Returns:
- User profile
- All transactions
- All budgets
- All accounts
- All investment records
- All forecasts
- All settings
- Format: JSON

Response time: < 30 days
```

### Right to Rectification (POPIA §14)
```
Endpoint: POST /api/user/data-update
Body: { email, phone, ... }

User can update:
- Email address
- Password
- Name
- Currency preference

Cannot update (data integrity):
- Transaction amounts (must delete and re-enter)
- Past dates (audit trail integrity)
- Deleted records (immutable)
```

### Right to Deletion (POPIA §14)
```
Endpoint: DELETE /api/user/account

Process:
1. User initiates deletion
2. 30-day grace period (can cancel)
3. After 30 days, data purged

What happens:
- Soft delete after 30 days
- No exports or backups contain deleted user
- Cannot recover after hard delete

What survives:
- NONE. Full hard delete after grace period.
```

### Right to Export (POPIA §14)
```
Endpoint: GET /api/user/data-export?format=csv

Formats supported:
- JSON (complete data structure)
- CSV (transactions, budgets)
- PDF (personal financial summary)
- OFX (for import to other banking apps)

Response time: Immediate (< 1 second)
File retained: 7 days, then auto-delete
```

---

## 4️⃣ BACKUP ARCHITECTURE

### Backup Tiers

**Tier 1: Real-time Replication**
```
- Supabase PostgreSQL default setup
- Automatic replication across availability zones
- RTO: < 1 minute
- RPO: < 1 second
- Automatic failover
```

**Tier 2: Automated Daily Backups**
```
Frequency: Once per day at 02:00 UTC
Retention: 30 days rolling window
Encryption: At rest, AES-256
Method: pg_dump full database dump
Size: ~100 MB per backup (estimated)
Storage: Supabase cloud backup storage
Cost: Included in Supabase plan
```

**Tier 3: Manual Pre-Release Backups**
```
Trigger: Before deploying major changes
Method: Supabase API backup creation
Retention: 90 days
Process:
1. Backup created manually before deployment
2. Tagged with release version
3. Test restore in staging
4. Keep for incident investigation
```

**Tier 4: Archive Backups (Quarterly)**
```
Trigger: At end of each quarter
Method: Export to encrypted cloud storage
Destination: Google Drive / AWS S3 (encrypted)
Retention: 7 years (for regulatory compliance)
Size: Annual total ~4 GB
Cost: < $10/month storage
```

### Backup Schedule
```
Time (UTC) | Backup Type | Retention | Status |
-----------|-------------|-----------|---------|
00:00 | Nightly backup | 30 days | Automated |
02:00 | Nightly backup | 30 days | Automated |
Quarterly | Archive backup | 7 years | Manual |
Pre-release | Release backup | 90 days | Manual |
```

---

## 5️⃣ DISASTER RECOVERY PROCEDURES

### Scenario 1: Complete Database Loss

**Detection**: Supabase alerts + manual check
**RTO**: < 1 hour
**RPO**: < 5 minutes

```
Recovery steps:
1. Verify issue (not just replication lag)
2. Contact Supabase support (priority ticket)
3. Request restore from last backup
4. Supabase provisions restored database
5. Update DATABASE_URL in .env
6. Redeploy application
7. Verify data integrity
8. Notify users (if data loss occurred)
```

### Scenario 2: Data Corruption

**Detection**: Manual data quality checks
**RTO**: < 2 hours
**RPO**: Depends on backup used

```
Recovery steps:
1. Restore from backup to staging database
2. Run data integrity checks
3. Identify which records are corrupted
4. Restore only corrupted records to production
5. Verify with user (if needed)
6. Document root cause
```

### Scenario 3: Ransomware / Malicious Deletion

**Detection**: Rate limiting + alerting on suspicious deletes
**RTO**: < 4 hours
**RPO**: < 24 hours

```
Recovery steps:
1. Isolate affected accounts immediately
2. Revoke all session tokens
3. Force password reset
4. Restore from backup before attack
5. Implement additional rate limiting
6. Notify affected users
7. Post-incident review
```

### Scenario 4: Application Code Bug (Data Wipe)

**Detection**: Alerting on unexpected delete operations
**RTO**: < 2 hours
**RPO**: < 1 hour

```
Recovery steps:
1. Deploy rollback of code change
2. Restore from backup (1 hour before incident)
3. Reapply user actions from after incident
4. Verify data integrity
5. Re-release fixed version of code
```

---

## 6️⃣ ENCRYPTION SPECIFICATIONS

### Data in Transit (HTTPS/TLS)
```
Protocol: TLS 1.3 (minimum)
Certificate: Auto-renewed by Let's Encrypt
Cipher suites: Modern only (no weak ciphers)
HSTS: Enabled (1 year, includeSubDomains)
Verify: https://www.ssllabs.com/ssltest/

Enforcement:
- All HTTP requests redirected to HTTPS
- Secure flag on all cookies
- httpOnly flag on auth tokens
```

### Data at Rest (Database)
```
Supabase PostgreSQL encryption:
- Encryption enabled: YES
- Algorithm: AES-256-GCM (industry standard)
- Key management: Managed by Supabase
- Backup encryption: YES (same algorithm)

Sensitive columns (if needed):
- Email: Plain text (identify user)
- Password: Hashed with bcrypt (never stored)
- Account numbers: Plain text (needed for reconciliation)
- API keys: Encrypted in vault

Note: Financial data encrypted at rest by database.
Users can only view their own data (RLS).
```

### Application-Level Encryption (If needed)
```typescript
// For ultra-sensitive data (not required yet)
import { createCipheriv } from 'crypto'

function encryptField(plaintext: string, key: Buffer): string {
  const iv = crypto.randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`
}

function decryptField(ciphertext: string, key: Buffer): string {
  const [ivHex, encrypted, authTagHex] = ciphertext.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// Usage: Only decrypt when needed, never log plaintext
const decrypted = decryptField(encrypted, masterKey)
```

---

## 7️⃣ ACCESS CONTROL & AUDIT LOGS

### Who Can Access What?

| Role | Data Access | Actions |
|------|-------------|---------|
| User | Own data only | Create, read, update, own data |
| Admin | All users' data | Read for support, cannot modify |
| Support | Limited (tickets only) | View specific transactions if user consents |
| Database | Application layer only | RLS enforces per-query filtering |
| Supabase | Full (managed service) | Encrypted by default |

### Audit Logging
```typescript
// Log all sensitive operations
async function logAudit(userId: string, action: string, details: object) {
  await db.auditLog.create({
    data: {
      user_id: userId,
      action, // "create_transaction", "delete_budget", etc.
      timestamp: new Date(),
      ip_address: getClientIP(), // Anonymized if possible
      user_agent: request.headers.get('user-agent'),
      details: sanitize(details), // Don't log sensitive values
    }
  })
}

// Usage
await logAudit(userId, 'create_transaction', { 
  transaction_id: 'tx-123',
  amount: 500,
  category: 'Dining'
  // Never log: description (may contain PII)
})
```

---

## 8️⃣ COMPLIANCE WITH DATA PROTECTION LAWS

### POPIA (Protection of Personal Information Act - South Africa)
```
✅ Lawful processing basis: Explicit consent at signup
✅ Transparency: Privacy policy clear and accessible
✅ Purpose limitation: Data used only for stated purposes
✅ Retention limits: Data deleted when no longer needed
✅ Security: Encryption, access controls, audit logging
✅ Subject rights: Access, correction, deletion (endpoints created)
✅ Accountability: Privacy officer contact in footer
✅ Third-party: No data sharing without consent
```

### GDPR (General Data Protection Regulation - EU)
```
If serving EU users (future):

✅ Lawful basis: Legitimate interest (personal finance)
✅ Consent: Clear consent before data collection
✅ Privacy by design: Minimal data collection
✅ Data Protection Impact Assessment (DPIA): Completed for high-risk
✅ DPA with processors: Supabase DPA in place
✅ Breach notification: < 72 hours to authorities
✅ Subject rights: All 6 rights fully implemented
✅ Data Processing Agreement: On file
```

### CCPA (California Consumer Privacy Act - USA)
```
If serving CA users (future):

✅ Right to know: Data export endpoint
✅ Right to delete: Account deletion with 30-day grace
✅ Right to opt-out: Unsubscribe from analytics
✅ No discrimination: Same access regardless of consent
✅ Shine the Light: Disclosures annual audit
```

---

## 9️⃣ THIRD-PARTY DATA SHARING

### External Services

| Service | Data Shared | Purpose | Data Processing Agreement |
|---------|------------|---------|--------------------------|
| Supabase | Database contents | Data storage | ✅ Yes |
| Vercel | Logs, analytics | Deployment, monitoring | ✅ Yes |
| Claude API | Transaction text | NL parsing | ✅ Yes (Anthropic DPA) |
| Sentry (optional) | Error logs | Error tracking | ✅ Yes |
| Google Analytics | Anonymized page views | User behavior | ✅ Yes |

### What's NOT Shared
```
- Transaction amounts (except to Claude for NL parsing)
- Personal names or emails (except Supabase, Vercel for ops)
- Bank account numbers (never shared)
- API keys (never shared)
- Raw account balance data (never shared)
```

### User Consent for Sharing
```typescript
// On signup
const consentForm = {
  'Store data in Supabase': true,  // Required
  'Process NL with Claude API': true,  // Required
  'Analytics with Google Analytics': false,  // Optional (default off)
  'Error tracking with Sentry': false,  // Optional (default off)
  'Marketing emails': false,  // Optional (default off)
}

// User can update preferences anytime
GET /api/user/privacy-settings
POST /api/user/privacy-settings { ... }
```

---

## 🔟 INCIDENT RESPONSE & NOTIFICATION

### Data Breach Response

**Within 24 hours:**
1. Confirm breach occurred
2. Identify affected users and data types
3. Contain the breach (revoke tokens, fix vulnerability)
4. Assess severity (personal data? payment data? public data?)

**Within 48 hours:**
1. Notify affected users via email with:
   - What happened
   - What data was affected
   - What we're doing
   - What they should do
2. Post on status page
3. Report to regulators (if required by POPIA)

**Within 30 days:**
1. Complete investigation
2. Post-incident review
3. Implement corrective measures
4. Update security documentation
5. Notify users of resolution
```

### User Notification Template
```
Subject: Important Security Notice — Action Recommended

Dear [Name],

On [DATE], we discovered unauthorized access to [SYSTEM]. 
Our investigation shows [USERS/TRANSACTIONS/ETC] may have been accessed.

YOUR DATA AFFECTED:
- Transaction history (amounts, not descriptions)
- Budget allocations
- Account names (not account numbers)

WHAT WE'RE DOING:
- Fixed the vulnerability
- Reset all affected sessions
- Added additional monitoring
- Conducting external security audit

WHAT YOU SHOULD DO:
- Change your password
- Review your account for unauthorized activity
- Enable 2FA (if available)

We sincerely apologize for this incident.
Questions? Contact: [support email]
```

---

## Summary

✅ **Privacy by Design**: Minimal collection, encryption, RLS  
✅ **User Rights**: Access, rectification, deletion, export (all implemented)  
✅ **Backup Strategy**: 4 tiers (real-time, daily, manual, archive)  
✅ **Disaster Recovery**: RTO < 4 hours, RPO < 24 hours  
✅ **Encryption**: TLS in transit, AES-256 at rest  
✅ **Audit Logging**: All sensitive operations logged  
✅ **Compliance**: POPIA-ready, GDPR-ready, CCPA-ready  
✅ **Third-party**: Minimal sharing, user consent, DPAs in place  
✅ **Breach Response**: 24-48 hour notification plan  
✅ **Data Retention**: Clear retention policies per data type
