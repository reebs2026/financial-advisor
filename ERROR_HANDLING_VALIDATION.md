# 🛡️ ERROR HANDLING & INPUT VALIDATION STRATEGY

## 1️⃣ Input Validation Rules

### Transaction Amounts
```typescript
// Min/Max boundaries
MIN_TRANSACTION: 0.01  // R0.01
MAX_TRANSACTION: 999_999_999.99  // R999M

// Validation rules
- Amount must be decimal (2 places: R123.45)
- No negative amounts (handled separately as income/expense type)
- Must not exceed account balance (warning, not error)
- No NaN or Infinity
```

### Dates
```typescript
// Constraints
- Cannot be in the future (transaction date)
- Cannot be older than 2 years
- Must be valid date (Feb 30 = error)
- Format: YYYY-MM-DD
```

### Budget Allocations
```typescript
// Constraints
- Min: R0 (can zero out flexible budgets)
- Max: Sum of all monthly income
- Protected budgets (Kai School): Cannot go below R5,000
- Sum of all allocations: Should not exceed projected income (warning)
```

### Account Names
```typescript
- Min length: 2 characters
- Max length: 50 characters
- No special characters except spaces, hyphens, parentheses
- Must be unique per user
```

### Category Names
```typescript
- Min: 2 chars
- Max: 30 chars
- No leading/trailing spaces
- Can include emojis
```

### Debt Account Names
```typescript
- Must match known creditors: Naeem, Cedric, [custom]
- Min: 2 chars, Max: 50 chars
```

---

## 2️⃣ Error Codes & Messages

### Validation Errors (400)

| Code | Situation | Message | Action |
|------|-----------|---------|--------|
| `INVALID_AMOUNT` | Amount is NaN, Infinity, or negative | "Amount must be a positive number" | Re-enter |
| `AMOUNT_TOO_SMALL` | < R0.01 | "Amount must be at least R0.01" | Re-enter |
| `AMOUNT_TOO_LARGE` | > R999,999,999 | "Amount is too large" | Re-enter |
| `INVALID_DATE` | Invalid date format or future date | "Date must be today or earlier" | Pick date |
| `DATE_TOO_OLD` | > 2 years ago | "Transactions older than 2 years are archived" | Contact support |
| `BUDGET_PROTECTED` | Trying to reduce Kai School below R5k | "Kai School budget cannot be reduced below R5,000" | Increase buffer or flexible budget |
| `BUDGET_ZERO_SUM` | All flexible budgets would be zero | "At least one flexible budget must be > R0" | Increase one budget |
| `ACCOUNT_NAME_TAKEN` | Duplicate account name | "Account '${name}' already exists" | Use different name |
| `INVALID_CATEGORY` | Category doesn't exist or malformed | "Invalid category selected" | Pick from list |
| `MISSING_REQUIRED_FIELD` | Required field is empty | "Please enter ${fieldName}" | Fill field |

### Authentication Errors (401)

| Code | Message | Action |
|------|---------|--------|
| `UNAUTHORIZED` | No valid session | Sign in again |
| `SESSION_EXPIRED` | Session > 7 days old | Sign in again |
| `INVALID_CREDENTIALS` | Wrong password | Try again |
| `ACCOUNT_LOCKED` | 5+ failed login attempts | Check email for unlock link |

### Authorization Errors (403)

| Code | Message | Action |
|------|---------|--------|
| `FORBIDDEN` | User doesn't own resource | N/A (shouldn't happen in single-user) |

### Not Found Errors (404)

| Code | Message | Action |
|------|---------|--------|
| `TRANSACTION_NOT_FOUND` | Transaction ID doesn't exist | Data may have been deleted |
| `BUDGET_NOT_FOUND` | Budget ID doesn't exist | Create budget first |
| `ACCOUNT_NOT_FOUND` | Account ID doesn't exist | Create account first |

### Server Errors (500)

| Code | Message | User Sees |
|------|---------|-----------|
| `DATABASE_ERROR` | Supabase connection failed | "We're having trouble saving. Please try again." |
| `AI_PARSING_ERROR` | Claude API call failed | "AI parser unavailable. Use manual entry." |
| `CALCULATION_ERROR` | Forecast calculation failed | "Forecast unavailable. Check back soon." |

---

## 3️⃣ Client-Side Validation (Before Sending)

### Transaction Form
```typescript
// Validate before POST /api/transactions
validate(tx: TransactionInput) {
  errors = []
  
  if (!tx.amount || tx.amount <= 0) {
    errors.push("Amount is required and must be positive")
  }
  
  if (tx.amount > 999_999_999.99) {
    errors.push("Amount is too large")
  }
  
  if (!tx.date || isNaN(new Date(tx.date))) {
    errors.push("Invalid date")
  }
  
  if (new Date(tx.date) > new Date()) {
    errors.push("Date cannot be in the future")
  }
  
  if (!tx.account_id) {
    errors.push("Please select an account")
  }
  
  if (!tx.category_id && !tx.category_name) {
    errors.push("Please select a category")
  }
  
  if (!tx.description || tx.description.trim().length < 2) {
    errors.push("Description must be at least 2 characters")
  }
  
  return errors.length === 0 ? { valid: true } : { valid: false, errors }
}
```

### Budget Form
```typescript
validate(budget: BudgetInput) {
  errors = []
  
  if (!budget.name || budget.name.trim().length < 2) {
    errors.push("Budget name must be at least 2 characters")
  }
  
  if (budget.monthly_amount < 0) {
    errors.push("Amount cannot be negative")
  }
  
  // Protected budget check
  if (budget.tier === "protected" && budget.monthly_amount < 5000) {
    errors.push("Protected budgets must be at least R5,000")
  }
  
  return errors.length === 0 ? { valid: true } : { valid: false, errors }
}
```

---

## 4️⃣ Server-Side Validation (Always Re-validate)

**Never trust client validation.** Always validate again on the server:

```typescript
// pages/api/transactions/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  
  // Schema validation with Zod
  const schema = z.object({
    amount: z.number().positive().max(999_999_999.99),
    date: z.string().date(),
    account_id: z.string().uuid(),
    category_id: z.string().uuid().optional(),
    description: z.string().min(2).max(500),
  })
  
  const parse = schema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parse.error.flatten() },
      { status: 400 }
    )
  }
  
  const tx = parse.data
  
  // Business logic validation
  const account = await db.accounts.findUnique({
    where: { id: tx.account_id }
  })
  
  if (!account) {
    return NextResponse.json(
      { error: "ACCOUNT_NOT_FOUND" },
      { status: 404 }
    )
  }
  
  // Constraint checks
  if (new Date(tx.date) > new Date()) {
    return NextResponse.json(
      { error: "DATE_IN_FUTURE", message: "Date cannot be in the future" },
      { status: 400 }
    )
  }
  
  // Create transaction
  const result = await db.transactions.create({ data: tx })
  return NextResponse.json(result)
}
```

---

## 5️⃣ Edge Cases & Boundary Conditions

### Floating Point Precision
```typescript
// Problem: 0.1 + 0.2 = 0.30000000000000004
// Solution: Use Decimal type everywhere

import { Decimal } from "@prisma/client/runtime/library"

// Always round financial amounts
function roundToTwoDecimals(amount: number): number {
  return Math.round(amount * 100) / 100
}

// In database: DECIMAL(15,2) = handles up to R999,999,999.99
```

### Concurrent Transactions
```typescript
// Problem: User logs transaction while forecast is calculating
// Solution: Database-level consistency

// Transactions table has created_at (immutable)
// Monthly snapshot computed from all txs with created_at <= month_end
// Query always uses INDEX on (user_id, date) for speed
```

### Empty States
```typescript
// No transactions yet
- Show: "No transactions yet. Log your first one!"
- Provide: Quick-add button

// No accounts
- Show: "Create an account to get started"
- Provide: Create account modal

// No budgets
- Show: "Set up budgets to track spending"
- Provide: Budget creation wizard

// All flexible budgets at zero
- Show: Warning: "All flexible budgets are zero"
- Allow: But don't allow saving with all zero
```

### Deleted Resources
```typescript
// When user deletes a transaction:
// - If tagged to budget, untag it
// - Recalculate budget spent_amount
// - Recalculate monthly snapshot
// - Do NOT delete related debt_payments or sinking_fund_contributions

// When user deletes a budget:
// - Untag all transactions
// - Delete budget_allocations (historical)
// - Delete forecast_models that reference it
```

### Currency Boundary Cases
```typescript
// R0.00 - allowed (placeholder for manual entry)
// R-50.00 - NOT allowed (use positive with type='income' instead)
// R999,999,999.99 - maximum (prevents overflow)
```

---

## 6️⃣ Error Recovery

### Automatic Retry
```typescript
// For transient errors (network timeouts, 5xx errors):
// Retry with exponential backoff: 1s, 2s, 4s, 8s max

async function fetchWithRetry(
  url: string,
  options = {},
  maxAttempts = 4
): Promise<Response> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fetch(url, options)
    } catch (error) {
      if (i === maxAttempts - 1) throw error
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
    }
  }
}
```

### User-Facing Error Messages

**DO:**
- Be specific: "Your budget for Dining is R250, but you've spent R320"
- Be actionable: "Update your budget or reduce spending this week"
- Be sympathetic: "Oops! Something went wrong. We're looking into it"

**DON'T:**
- Show technical jargon: "ERR_INVALID_SCHEMA_PARSE"
- Blame the user: "You entered bad data"
- Be vague: "Error occurred"

### Logging (Never Log Sensitive Data)

```typescript
// DO LOG:
- userId (not email)
- Action: "user created transaction"
- Amount: R500 (amount is OK, not sensitive)
- Error type: "database timeout"
- Timestamp

// NEVER LOG:
- Passwords
- Email addresses
- Full transaction descriptions (might contain personal info)
- Account numbers
- API keys
```

---

## 7️⃣ Validation Schema (Zod)

Create reusable schemas:

```typescript
// lib/validation.ts
import { z } from "zod"

export const TransactionSchema = z.object({
  amount: z.number().positive().max(999_999_999.99),
  date: z.coerce.date().refine(d => d <= new Date(), "Date cannot be in future"),
  account_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  description: z.string().min(2).max(500),
  transaction_type: z.enum(["income", "expense", "transfer"]),
})

export const BudgetSchema = z.object({
  name: z.string().min(2).max(50),
  tier: z.enum(["protected", "strategic", "flexible"]),
  monthly_amount: z.number().nonnegative(),
})

export const AccountSchema = z.object({
  name: z.string().min(2).max(50),
  account_type: z.enum(["bank", "investment", "debt", "sinking"]),
  currency: z.string().default("ZAR"),
})
```

---

## Summary

- ✅ **Client-side**: Fast feedback, better UX
- ✅ **Server-side**: Always re-validate, never trust client
- ✅ **Error codes**: Consistent, machine-readable
- ✅ **User messages**: Clear, actionable, sympathetic
- ✅ **Edge cases**: Covered (floating point, concurrency, deleted resources)
- ✅ **No sensitive data**: Never logged or exposed
