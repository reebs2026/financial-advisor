# 🧪 TESTING STRATEGY

## Testing Pyramid

```
        ⬆ Few, expensive, slow, fragile
      ╱─────────────╲
     ╱   E2E Tests   ╲        5-10% of suite
    ╱─────────────────╲       (Browser, full flow)
   ╱───────────────────╲
  ╱  Integration Tests  ╲     20-30% of suite
 ╱─────────────────────╲ (API + DB, no UI)
╱───────────────────────╲
│   Unit Tests          │     60-70% of suite
│ (Functions, isolated) │     (Fast, deterministic)
└───────────────────────┘
        ⬇ Many, cheap, fast, reliable
```

**Target Coverage**: 80% code coverage

---

## 1️⃣ UNIT TESTS (60-70%)

Test individual functions in isolation. **Fast**: <5ms per test.

### Service Layer Unit Tests

```typescript
// src/services/__tests__/transaction.service.test.ts
import { describe, it, expect } from "vitest"
import { TransactionService } from "../transaction.service"

describe("TransactionService", () => {
  // getMonthlyExpenses
  it("sums all expense transactions in a month", () => {
    const txs = [
      { amount: 100, type: "expense" },
      { amount: 50, type: "expense" },
      { amount: 200, type: "income" },
    ]
    const result = TransactionService.getMonthlyExpenses(txs, "2026-04-01")
    expect(result).toBe(150)
  })

  it("returns 0 if no transactions", () => {
    const result = TransactionService.getMonthlyExpenses([], "2026-04-01")
    expect(result).toBe(0)
  })

  it("excludes transfers from calculation", () => {
    const txs = [
      { amount: 100, type: "expense" },
      { amount: 50, type: "transfer" },
    ]
    const result = TransactionService.getMonthlyExpenses(txs, "2026-04-01")
    expect(result).toBe(100)
  })

  // getCategoryBreakdown
  it("returns breakdown by category", () => {
    const txs = [
      { category: "Dining", amount: 200 },
      { category: "Dining", amount: 100 },
      { category: "Transport", amount: 50 },
    ]
    const result = TransactionService.getCategoryBreakdown(txs)
    expect(result).toEqual({
      "Dining": 300,
      "Transport": 50,
    })
  })

  // getSpendingVelocity
  it("calculates avg daily spend over period", () => {
    const txs = [
      { amount: 100, date: "2026-04-01" },
      { amount: 150, date: "2026-04-02" },
      { amount: 50, date: "2026-04-03" },
    ]
    const result = TransactionService.getSpendingVelocity(txs, 3)
    expect(result).toBe(100) // (100+150+50)/3
  })
})
```

### Utility Function Tests

```typescript
// src/lib/__tests__/financial.test.ts
describe("Financial Utilities", () => {
  it("rounds to 2 decimals correctly", () => {
    expect(roundToTwoDecimals(0.1 + 0.2)).toBe(0.30)
    expect(roundToTwoDecimals(7.675)).toBe(7.68) // banker's rounding
  })

  it("calculates debt payoff timeline", () => {
    const monthsToPayoff = calculateDebtPayoff(
      balance: 10_000,
      monthlyPayment: 500,
      interestRate: 0.05 / 12
    )
    expect(monthsToPayoff).toBeCloseTo(21, 0) // ~21 months
  })

  it("converts currency correctly", () => {
    const result = convertCurrency(100, "ZAR", "USD", rate: 0.055)
    expect(result).toBe(5.5)
  })
})
```

### Validation Tests

```typescript
// src/lib/__tests__/validation.test.ts
describe("Input Validation", () => {
  it("rejects negative transaction amounts", () => {
    const result = TransactionSchema.safeParse({ amount: -50 })
    expect(result.success).toBe(false)
  })

  it("rejects future dates", () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    const result = TransactionSchema.safeParse({
      date: futureDate.toISOString()
    })
    expect(result.success).toBe(false)
  })

  it("allows R0.01 as minimum transaction", () => {
    const result = TransactionSchema.safeParse({ amount: 0.01 })
    expect(result.success).toBe(true)
  })
})
```

**Tools**: Vitest (fast, Vite-integrated)

---

## 2️⃣ INTEGRATION TESTS (20-30%)

Test API endpoints + database together. **Slower**: 100ms-5s per test.

### API Endpoint Tests

```typescript
// src/app/api/__tests__/transactions.test.ts
import { POST, GET } from "../transactions/route"
import { createMockRequest } from "@/test/mocks"

describe("POST /api/transactions", () => {
  it("creates transaction and returns it", async () => {
    const req = createMockRequest({
      method: "POST",
      body: {
        amount: 250,
        date: "2026-04-23",
        account_id: "acc-123",
        category_id: "cat-456",
        description: "Coffee",
      }
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.id).toBeDefined()
    expect(data.amount).toBe(250)
    expect(data.description).toBe("Coffee")
  })

  it("validates required fields", async () => {
    const req = createMockRequest({
      method: "POST",
      body: { amount: 250 } // missing required fields
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("rejects future dates", async () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)

    const req = createMockRequest({
      method: "POST",
      body: {
        amount: 250,
        date: futureDate.toISOString().split("T")[0],
        account_id: "acc-123",
        category_id: "cat-456",
        description: "Test",
      }
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("updates account balance when transaction created", async () => {
    // Arrange: Create account with known balance
    const accountBefore = await db.accounts.findUnique({ where: { id: "acc-123" } })
    const balanceBefore = accountBefore.balance

    // Act: Create transaction
    const req = createMockRequest({
      method: "POST",
      body: {
        amount: 100,
        date: "2026-04-23",
        account_id: "acc-123",
        category_id: "cat-456",
        description: "Test",
      }
    })
    await POST(req)

    // Assert: Balance updated
    const accountAfter = await db.accounts.findUnique({ where: { id: "acc-123" } })
    expect(accountAfter.balance).toBe(balanceBefore - 100)
  })
})

describe("GET /api/transactions", () => {
  it("returns all user transactions", async () => {
    const req = createMockRequest({ method: "GET" })
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
  })

  it("filters by account_id", async () => {
    const req = createMockRequest({
      method: "GET",
      query: { account_id: "acc-123" }
    })
    const res = await GET(req)
    const data = await res.json()

    expect(data.every(tx => tx.account_id === "acc-123")).toBe(true)
  })
})
```

### Database Tests

```typescript
// src/__tests__/db.test.ts
describe("Database Integrity", () => {
  it("prevents duplicate account names per user", async () => {
    const user = await db.users.create({
      data: { email: "test@example.com" }
    })

    await db.accounts.create({
      data: {
        name: "FNB",
        user_id: user.id,
        account_type: "bank"
      }
    })

    // Second create should fail or enforce uniqueness
    const duplicate = await db.accounts.create({
      data: {
        name: "FNB",
        user_id: user.id,
        account_type: "bank"
      }
    }).catch(e => e)

    expect(duplicate).toBeInstanceOf(Error)
  })

  it("cascades delete on user delete", async () => {
    const user = await db.users.create({
      data: { email: "test@example.com" }
    })

    const account = await db.accounts.create({
      data: { name: "FNB", user_id: user.id, account_type: "bank" }
    })

    await db.users.delete({ where: { id: user.id } })

    const remainingAccounts = await db.accounts.findMany({
      where: { user_id: user.id }
    })

    expect(remainingAccounts).toHaveLength(0)
  })

  it("maintains referential integrity on budget delete", async () => {
    const budget = await db.budgets.create({
      data: { name: "Dining", user_id: user.id, monthly_amount: 2500 }
    })

    const tx = await db.transactions.create({
      data: {
        amount: 250,
        tagged_budget_id: budget.id,
        // ... other fields
      }
    })

    await db.budgets.delete({ where: { id: budget.id } })

    const txAfter = await db.transactions.findUnique({
      where: { id: tx.id }
    })

    expect(txAfter.tagged_budget_id).toBeNull() // Should untag
  })
})
```

**Tools**: Vitest + test database (in-memory or Docker Postgres)

---

## 3️⃣ E2E TESTS (5-10%)

Test full user flows through the browser. **Slow**: 5s-30s per test.

### Critical User Journeys

```typescript
// e2e/transactions.spec.ts
import { test, expect } from "@playwright/test"

test.describe("Transaction Logging", () => {
  test("user can log transaction manually", async ({ page }) => {
    await page.goto("/")
    await page.click("button:has-text('Log Transaction')")

    // Fill form
    await page.fill("input[name='amount']", "250")
    await page.selectOption("select[name='account']", "fnb")
    await page.fill("input[name='description']", "Coffee")
    await page.click("button:has-text('Save')")

    // Assert
    await expect(page.locator("text=Coffee")).toBeVisible()
    await expect(page.locator("text=R 250")).toBeVisible()
  })

  test("user can parse transaction with AI", async ({ page }) => {
    await page.goto("/transactions/new")

    // Enter natural language
    await page.fill(
      "textarea[name='nl_input']",
      "I spent 500 on coffee at Vida"
    )
    await page.click("button:has-text('Parse with AI')")

    // Wait for parsing
    await page.waitForTimeout(2000)

    // Verify fields auto-filled
    await expect(page.locator("input[name='amount']")).toHaveValue("500")
    await expect(page.locator("input[name='description']")).toHaveValue(
      "Coffee at Vida"
    )
  })

  test("dashboard updates after new transaction", async ({ page }) => {
    const expensesBefore = await page.locator(
      "text=Expenses This Month"
    ).evaluate(el => el.textContent)

    await page.click("button:has-text('Log Transaction')")
    await page.fill("input[name='amount']", "100")
    await page.selectOption("select[name='account']", "fnb")
    await page.fill("input[name='description']", "Test")
    await page.click("button:has-text('Save')")

    // Wait for update
    await page.waitForTimeout(500)

    const expensesAfter = await page.locator(
      "text=Expenses This Month"
    ).evaluate(el => el.textContent)

    expect(expensesAfter).not.toBe(expensesBefore)
  })
})

test.describe("Budget Management", () => {
  test("user can simulate allocation change", async ({ page }) => {
    await page.goto("/budgets")
    await page.click("button:has-text('Simulate')")

    // Change allocation
    await page.fill("input[name='emergency']", "4000")
    await page.fill("input[name='building']", "3000")

    // Check impact
    const impactMessage = await page.locator(
      "text=Emergency funding"
    ).textContent()

    expect(impactMessage).toContain("increase")
  })

  test("Kai School budget is protected", async ({ page }) => {
    await page.goto("/budgets")

    // Try to reduce Kai School
    const kaiInput = page.locator("input[name='kai_school']")
    await kaiInput.fill("4000") // Try to set below minimum

    await page.click("button:has-text('Save')")

    // Should show error
    const error = await page.locator("text=cannot be reduced").isVisible()
    expect(error).toBe(true)
  })
})

test.describe("Forecasting", () => {
  test("monthly forecast is shown on dashboard", async ({ page }) => {
    await page.goto("/")

    // Check forecast visible
    await expect(page.locator("text=End-of-month projection")).toBeVisible()
    await expect(page.locator("text=R").first()).toBeVisible()
  })
})
```

**Tools**: Playwright (cross-browser, fast)

---

## 4️⃣ TEST DATA SETUP

### Fixtures

```typescript
// test/fixtures.ts
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function seedTestUser() {
  return await prisma.users.create({
    data: {
      email: "test@example.com",
      // ... other fields
    }
  })
}

export async function seedTestAccounts(userId: string) {
  return await prisma.accounts.createMany({
    data: [
      { name: "FNB", user_id: userId, account_type: "bank", balance: 50_000 },
      { name: "ABSA", user_id: userId, account_type: "bank", balance: 30_000 },
      { name: "Emergency", user_id: userId, account_type: "bank", balance: 20_000 },
    ]
  })
}

export async function seedTestTransactions(userId: string, accountId: string) {
  const now = new Date()
  return await prisma.transactions.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      user_id: userId,
      account_id: accountId,
      amount: Math.random() * 500,
      date: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
      description: `Test transaction ${i}`,
      transaction_type: "expense",
    }))
  })
}
```

---

## 5️⃣ CI/CD INTEGRATION

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
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
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:coverage

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true
          required: true # Fail PR if coverage drops below threshold
```

---

## 6️⃣ COVERAGE TARGETS

| Category | Target | Consequence |
|----------|--------|-------------|
| Unit | 80% | Blocks merge if below |
| Integration | 60% | Warning if below |
| E2E | 10 tests min | Critical paths only |
| **Overall** | **80%** | **Required for release** |

---

## 7️⃣ Test Naming Conventions

```typescript
// DO: Clear, describes behavior
it("returns 0 when no transactions exist", () => {})
it("rejects amounts greater than 999 million", () => {})
it("updates monthly snapshot after new transaction", () => {})

// DON'T: Vague or implementation-focused
it("works correctly", () => {})
it("calls db.transaction.create()", () => {})
it("test", () => {})
```

---

## Summary

✅ **60-70% unit** (fast feedback)  
✅ **20-30% integration** (realistic)  
✅ **5-10% E2E** (critical paths)  
✅ **80% code coverage** target  
✅ **Automated** in CI/CD (Blocks merge if drops)  
✅ **Test data** fixtures reusable  
✅ **Fast** feedback loop (<5 minutes)
