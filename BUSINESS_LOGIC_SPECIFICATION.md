# 📐 BUSINESS LOGIC SPECIFICATIONS

## CRITICAL: Algorithm Definitions for Complex Features

This document defines exact formulas and algorithms for the three most complex financial features. These need your explicit approval before implementation.

---

## 1️⃣ BUDGET HEALTH SCORE (0-100%)

### Purpose
A single composite score showing overall financial health, visible on dashboard as a percentage (0-100%) with visual indicator (red/yellow/green).

### Formula (TO BE FINALIZED)
```
Current formula concept:
HealthScore = (40% × BufferHealth) 
            + (30% × AllocationHealth) 
            + (20% × VelocityHealth) 
            + (10% × DebtHealth)

But we need to define:
- [ ] What factors determine BufferHealth? (see below)
- [ ] What factors determine AllocationHealth? (see below)
- [ ] What factors determine VelocityHealth? (see below)
- [ ] What factors determine DebtHealth? (see below)
- [ ] What are the min/max ranges for each?
- [ ] How do we weight them (40/30/20/10 correct)?
```

### Component 1: Buffer Health
```
Question: How is "buffer health" calculated?

Current options:
A) By comparing current buffer to target:
   BufferHealth = min(100%, (CurrentBuffer / TargetBuffer) * 100%)
   Where TargetBuffer = 1 month of expenses (adjustable)

B) By days of expense coverage:
   DaysOfCoverage = (CurrentBuffer / DailyExpenses)
   BufferHealth = min(100%, (DaysOfCoverage / 30) * 100%)

C) By trend (improving or declining):
   BufferTrend = (CurrentBuffer - BufferLastMonth) / BufferLastMonth
   BufferHealth = 50% + clamp(BufferTrend, -50%, +50%)

YOUR CHOICE: A / B / C / Other?
```

### Component 2: Allocation Health
```
Question: How should we score budget allocation decisions?

Current options:
A) By variance from planned allocations:
   Variance = sum(|SpentPercentage - PlannedPercentage| for all categories)
   AllocationHealth = 100% - min(100%, Variance * 2)

B) By budget adherence (% of budgets not exceeded):
   BudgetsExceeded = count(spent > budget) / total_budgets
   AllocationHealth = max(0%, 100% - (BudgetsExceeded * 100%))

C) By flexibility remaining (% of flexible budget remaining):
   FlexibleRemaining = FlexibleBudgetRemaining / TotalFlexibleBudget
   AllocationHealth = min(100%, FlexibleRemaining * 100%)

D) Combination (variance PLUS adherence):
   AllocationHealth = (50% × Variance Health) + (50% × Adherence Health)

YOUR CHOICE: A / B / C / D / Other?
```

### Component 3: Velocity Health
```
Question: How do we measure spending velocity health?

Current options:
A) By comparing actual velocity to expected:
   ExpectedVelocity = (MonthlyExpenses / 30 days)
   VelocityHealth = min(100%, (ExpectedVelocity / ActualVelocity) * 100%)
   (Higher = better, capped at 100%)

B) By trend (accelerating or decelerating):
   VelocityTrend = (CurrentVelocity - LastWeekVelocity) / LastWeekVelocity
   VelocityHealth = 100% - clamp(abs(VelocityTrend), 0%, 100%)

C) By consistency (low variance = consistent = healthy):
   VelocityVariance = stddev(last 4 weeks velocities)
   VelocityHealth = 100% / (1 + VelocityVariance)

YOUR CHOICE: A / B / C / Other?
```

### Component 4: Debt Health
```
Question: How do we measure debt health?

Current options:
A) By debt-to-income ratio:
   DTI = (TotalDebt / MonthlyIncome)
   DebtHealth = max(0%, 100% - (DTI * 100%))
   (Lower debt = higher health, capped at 100%)

B) By payment-to-income ratio:
   PTI = (MonthlyDebtPayment / MonthlyIncome)
   DebtHealth = max(0%, 100% - (PTI * 100%))

C) By payoff timeline (how long to pay off):
   PayoffMonths = sum(debt / monthly_payment for each debt)
   DebtHealth = max(0%, 100% - (PayoffMonths / 60 months) * 100%)
   (Faster payoff = higher health)

D) By debt reduction trend (paying down or not):
   DebtTrend = (LastMonthDebt - CurrentDebt) / LastMonthDebt
   DebtHealth = 50% + clamp(DebtTrend, -50%, +50%)

YOUR CHOICE: A / B / C / D / Other?
```

### Display Rules
```
Health Score Display:
90-100% → 🟢 Green "Excellent"
70-89%  → 🟡 Yellow "Good"
50-69%  → 🟠 Orange "Fair"
0-49%   → 🔴 Red "At Risk"

Recalculation: Daily (at 2 AM UTC)
Caching: 24 hours (don't recalculate on every page load)
User notification: Email if drops below threshold
```

---

## 2️⃣ BUDGET ALLOCATION OPTIMIZER

### Purpose
Given current income and constraints, suggest optimal budget allocations that maximize financial health while protecting critical budgets (Kai School).

### Algorithm (TO BE FINALIZED)

### Input Parameters
```
Given:
- Monthly income (user-entered or auto-calculated from transactions)
- Current allocations (what user currently spends on each category)
- Protected budget constraints (Kai School minimum R5,000)
- Strategic budget targets (Emergency = 1 month expenses, Building = user-defined)
- User goals (what does user want to optimize FOR?)
```

### Optimization Goal
```
Question: What should the optimizer prioritize?

Current options:
A) Maximize buffer/emergency fund growth
   Goal: Increase Emergency Fund allocation year-over-year
   
B) Minimize financial risk (highest health score)
   Goal: Allocate to maximize Health Score
   
C) Achieve user-defined goals
   Goal: User specifies % for each tier (protected/strategic/flexible)
   
D) Balanced approach (all three)
   Goal: 50% buffer growth, 30% risk reduction, 20% user preference

E) Other?

YOUR CHOICE: A / B / C / D / E?
```

### Algorithm Outline (Conceptual)
```
1. Start with current allocations
2. Identify protected allocations (cannot change):
   - Kai School: minimum R5,000 (non-negotiable)
   - Employer pension: fixed (if auto-deducted)
   
3. Calculate flexible budget:
   FlexibleBudget = TotalIncome - SumOfProtectedAllocations
   
4. Propose reallocation based on [chosen goal]:
   
   If Goal = A (Buffer growth):
     - Increase Emergency Fund
     - Decrease Flexible categories (Dining, Coffee, Lifestyle)
     - Keep Strategic budgets stable
   
   If Goal = B (Risk reduction):
     - Increase Emergency Fund (buffer health)
     - Adjust allocations to maximize overall Health Score
     - Protect strategic budgets
   
   If Goal = C (User preference):
     - Respect user-specified distribution
     - Only suggest changes that violate constraints
   
   If Goal = D (Balanced):
     - 50% toward buffer growth
     - 30% toward risk reduction
     - 20% toward user preferences

5. Return recommended allocations with:
   - Before/after comparison
   - Impact on Health Score
   - Time to achieve goals (e.g., "Emergency fund in 8 months")
   - Risk level (low/medium/high)
```

### User Interaction Flow
```
1. User goes to Budget Simulator
2. Clicks "Optimize" button
3. System asks: "What would you like to optimize for?"
   - [ ] Build emergency fund faster
   - [ ] Improve financial health
   - [ ] Reduce debt
   - [ ] I'll tell you the distribution
4. User selects goal
5. System displays:
   - Recommended allocations (before/after)
   - Projected outcomes
   - Changes needed
6. User can:
   - Accept recommendation
   - Adjust manually
   - Undo changes
```

### Output Format
```typescript
interface OptimizationResult {
  scenario: string // "Emergency Fund Growth", "Risk Reduction", etc.
  
  current: {
    allocations: { [category: string]: number }
    health_score: number
    buffer_months: number
    debt_payoff_months: number
  }
  
  recommended: {
    allocations: { [category: string]: number }
    health_score_projected: number
    buffer_months_projected: number
    debt_payoff_months_projected: number
    time_to_goal_months: number
  }
  
  changes: {
    category: string
    current: number
    recommended: number
    delta: number
    rationale: string
  }[]
  
  constraints: {
    protected_budgets: string[]
    flexible_budgets: string[]
    immovable_allocations: number
  }
  
  risks: "low" | "medium" | "high"
  confidence: number // 0-100%
}
```

### Example
```
Current allocation:
- Emergency: R2,000/month
- Kai School: R5,000/month (protected)
- Debt: R1,000/month
- Flexible: R2,000/month (Dining, Coffee, etc.)
- Total income: R10,000/month
- Health Score: 62%

Optimizer output (Goal: "Build Emergency Fund Faster"):
Recommended:
- Emergency: R3,500/month (+R1,500)
- Kai School: R5,000/month (unchanged)
- Debt: R1,000/month (unchanged)
- Flexible: R500/month (-R1,500)

Projected outcome:
- Health Score: 74% (+12%)
- Emergency fund in 6 months (vs 10 months currently)
- Risk: Low
```

---

## 3️⃣ SPENDING VELOCITY DETECTION & ALERTS

### Purpose
Detect when user's spending rate accelerates abnormally and alert them before buffer is exhausted.

### Calculation Method (TO BE FINALIZED)

### Spending Velocity Definition
```
Current formula concept:
SpendingVelocity = Average daily spending over a rolling period

But we need to define:
- [ ] What is the rolling period? (7 days? 14 days? 30 days?)
- [ ] Should we include all transactions or exclude transfers?
- [ ] How do we handle different spending patterns (payday vs weekdays)?
- [ ] Should we exclude outliers (e.g., quarterly insurance payment)?
```

### Window Selection Question
```
Question: What time window should we analyze?

Options:
A) Current week vs last week
   Velocity = (spending this week) / (days elapsed)
   Threshold = 1.3x average of last 4 weeks
   
B) Current 7 days vs previous 7 days
   CurrentVelocity = sum(this 7 days) / 7
   PriorVelocity = sum(previous 7 days) / 7
   Acceleration = CurrentVelocity / PriorVelocity
   Alert if Acceleration > 1.5x
   
C) Current month-to-date vs expected monthly
   DaysIntoMonth = day_of_month
   MonthlyBudget = user's flexible budget total
   ExpectedDaily = MonthlyBudget / 30
   CurrentDaily = (spending so far) / DaysIntoMonth
   Alert if CurrentDaily > 1.4x ExpectedDaily
   
D) Trend analysis (is velocity accelerating?)
   v1 = velocity(week 1)
   v2 = velocity(week 2)
   v3 = velocity(week 3)
   v4 = velocity(week 4)
   Trend = (v4 - v1) / v1
   Alert if Trend > 30% (spending accelerating)

YOUR CHOICE: A / B / C / D / Other?
```

### Alert Threshold Question
```
Question: When should we alert the user?

Options:
A) Fixed threshold: Alert when velocity exceeds R200/day
   
B) Percentage of budget: Alert at 80% of monthly flexible budget spent
   
C) Days of buffer remaining: Alert when buffer < 5 days of spending
   BufferDays = CurrentBuffer / CurrentDailyVelocity
   Alert if BufferDays < 5
   
D) Trend-based: Alert when acceleration > 30% above baseline
   
E) Multi-factor: 
   - Alert level 1: 60% threshold (yellow warning)
   - Alert level 2: 80% threshold (orange warning)
   - Alert level 3: 95% threshold (red alert)

YOUR CHOICE: A / B / C / D / E?
```

### Data Exclusions
```
Question: Which transactions should we include in velocity calculation?

Typically exclude:
- Transfers between own accounts
- Recurring bills (already in budgets)
- Investment contributions (captured separately)
- Refunds/returns

Include:
- All discretionary spending
- One-time expenses
- Variable expenses

Clarification needed:
- Should we exclude sinking fund contributions?
- Should we exclude debt payments?
- How about business expenses (if user has business account)?
```

### Anomaly Handling
```
Question: How do we handle spending spikes?

Example: User spends R5,000 on car repair (one-time, not recurring)

Options:
A) Ignore outliers: Remove top 1-2 transactions before calculating
   
B) Flag as anomaly: Prompt user "This looks unusual. Is this normal?"
   
C) Bucket into categories: Only alert if *category* velocity is high
   e.g., "Dining spending up 50%" (not just total spending)
   
D) User-defined exclusions: Allow user to mark transactions as "one-time"

YOUR CHOICE: A / B / C / D / Combined?
```

### Alert Mechanism
```
Alert channels:
- [ ] In-app notification (red banner on dashboard)
- [ ] Email alert (same day if velocity exceeds threshold)
- [ ] Push notification (mobile app, if built)

Alert message example:
"🚨 Your spending pace is up 45% this week 
(R280/day vs normal R190/day). 
At this rate, your buffer will last 12 days. 
View recommendations →"
```

### Output & User Actions
```typescript
interface VelocityAlert {
  current_velocity: number        // R/day
  baseline_velocity: number        // R/day (average of last 30 days)
  acceleration: number             // % increase
  days_buffer_remaining: number
  alert_level: "warning" | "urgent" | "critical"
  triggered_at: Date
  
  recommended_actions: string[]
  // Examples:
  // - "Reduce flexible budget spending by R20/day"
  // - "Pause subscriptions ($15/month)"
  // - "Review recent transactions for duplicates"
  
  can_dismiss: boolean
  dismiss_until: Date               // Don't show same alert for 7 days
}
```

---

## 4️⃣ ELICITATION QUESTIONS FOR YOU

Please answer the following to finalize these specifications:

### Budget Health Score
```
1. What factors are most important to your financial health?
   - Emergency fund (buffer) size
   - Staying within budget allocations
   - Stable/consistent spending
   - Debt reduction progress
   - Other?

2. What should the relative weights be (40/30/20/10)?
   Current proposal: 40% buffer, 30% allocations, 20% velocity, 10% debt
   Do you agree? What would you change?

3. What should "target buffer" be?
   - 1 month of expenses (30 days)
   - 3 months of expenses (90 days)
   - User-configurable
   - Other?
```

### Budget Allocation Optimizer
```
1. What should the optimizer prioritize?
   A) Build emergency fund fastest
   B) Maximize health score
   C) Let user specify distribution
   D) Balanced approach
   E) Other?

2. Are there other protected budgets besides Kai School?
   - Kai School (R5,000)
   - Employer pension (if auto-deducted)
   - Debt payments (minimum amount)
   - Insurance premiums
   - Other?

3. How often should users run the optimizer?
   - Manual only (on-demand)
   - Weekly suggestion
   - Monthly suggestion
   - After major income/expense change
```

### Spending Velocity Detection
```
1. What time window makes most sense?
   A) Week-over-week
   B) 7-day rolling
   C) Month-to-date vs expected
   D) Trend analysis
   E) Other?

2. What alert threshold should we use?
   A) Fixed R/day threshold
   B) % of monthly budget
   C) Days of buffer remaining
   D) Trend-based (acceleration %)
   E) Multi-level alerts (60%/80%/95%)
   F) Other?

3. Should we alert on category-level velocity?
   - Example: "Dining spending up 50%" (even if total is normal)
   - Or only total spending velocity?
   - Both?

4. How should we handle anomalies?
   - Ignore outliers automatically
   - Ask user if it's normal
   - Only alert on categories
   - Let user exclude transactions
   - Other?
```

---

## 5️⃣ BUSINESS LOGIC IMPLEMENTATION CHECKLIST

Once you answer the questions above, we will:

```
For Budget Health Score:
- [ ] Finalize exact formulas for all 4 components
- [ ] Define min/max ranges
- [ ] Write unit tests for each formula
- [ ] Validate with sample data
- [ ] Add to dashboard (displayed prominently)
- [ ] Set up daily recalculation job
- [ ] Email alerts if score drops significantly

For Budget Allocation Optimizer:
- [ ] Implement optimization algorithm
- [ ] Create simulator UI/UX
- [ ] Test with various income/expense scenarios
- [ ] Add "before/after" comparison view
- [ ] Enable one-click application of recommendations
- [ ] Track recommendations vs actual outcomes

For Spending Velocity Detection:
- [ ] Implement velocity calculation
- [ ] Set up threshold monitoring
- [ ] Create alert system
- [ ] Add velocity chart to dashboard
- [ ] Test with various spending patterns
- [ ] Validate alert accuracy before launch
```

---

## Summary

This document defines the framework for three complex financial algorithms.

**Status**: ⏳ Awaiting your answers to elicitation questions

**Next**: Once answered, I will:
1. Finalize exact formulas and thresholds
2. Create detailed algorithm documentation
3. Write pseudocode for each feature
4. Create unit test specifications
5. Get your final approval before implementation begins

**Timeline**: These specifications are critical for Phase 4 (Forecasting & Advisory), which can't begin until formulas are finalized.

