# ♿ ACCESSIBILITY GUIDELINES

## 1️⃣ ACCESSIBILITY STANDARDS

### WCAG 2.1 Level AA Compliance
```
Target: All pages and components
Standard: WCAG 2.1 Level AA
Principles: POUR
  P - Perceivable
  O - Operable
  U - Understandable
  R - Robust

Applies to:
- Dashboard
- Forms (transaction, budget)
- Charts and visualizations
- Error messages
- Navigation
```

### Accessibility Checklist
```
Perceivable
- [ ] Text has sufficient color contrast (4.5:1)
- [ ] Images have alt text
- [ ] Charts have data tables as fallback
- [ ] No info conveyed by color alone
- [ ] Captions for video (future)
- [ ] Large text option (120-150%)

Operable
- [ ] All interactive elements keyboard accessible
- [ ] Logical tab order
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] Skip navigation links
- [ ] Timeout warnings (if applicable)

Understandable
- [ ] Plain language (8th grade level)
- [ ] Clear error messages
- [ ] Predictable navigation
- [ ] Consistent patterns
- [ ] Form labels and instructions
- [ ] Page titles descriptive

Robust
- [ ] Valid HTML
- [ ] Proper heading structure (H1, H2, H3)
- [ ] Semantic markup
- [ ] ARIA labels where needed
- [ ] Screen reader tested (NVDA, JAWS, VoiceOver)
```

---

## 2️⃣ COLOR CONTRAST

### Minimum Ratios
```
WCAG AA:
- Normal text: 4.5:1 (black text on white OK)
- Large text (18px+): 3:1
- Graphics: 3:1

WCAG AAA (exceeds requirement):
- Normal text: 7:1
- Large text: 4.5:1
```

### Tools
```
- Contrast checker: WebAIM Contrast Checker
- Automated testing: Axe DevTools, WAVE
- Manual testing: Chrome DevTools (Lighthouse)
```

### Example: Dashboard Colors
```css
/* Status indicators */
.status-success {
  background: #2d7a3e; /* Dark green */
  color: #ffffff;      /* White */
  contrast: 6.2:1 ✅
}

.status-warning {
  background: #b89c00; /* Gold */
  color: #ffffff;      /* White */
  contrast: 6.5:1 ✅
}

.status-error {
  background: #a93a33; /* Dark red */
  color: #ffffff;      /* White */
  contrast: 5.1:1 ✅
}

/* NOT sufficient alone */
.status-default {
  background: #f5f5f5; /* Light gray */
  color: #333333;      /* Dark gray */
  contrast: 8.2:1 ✅
}
```

---

## 3️⃣ KEYBOARD NAVIGATION

### Tab Order
```
Elements tab in logical order:
1. Login button → username field → password field → submit
2. Dashboard nav → transaction button → budget button → settings
3. Transaction form → amount → date → category → description → save

Implementation:
- Natural DOM order (left-to-right, top-to-bottom)
- tabindex only if reordering needed
- Never tabindex="-1" without alternative access
```

### Focus Indicators
```css
/* All interactive elements need visible focus */
button:focus,
input:focus,
a:focus {
  outline: 3px solid #0066cc;
  outline-offset: 2px;
}

/* Don't remove focus outline */
button:focus {
  outline: none; /* ❌ WRONG */
}

/* Better: enhance focus */
button:focus {
  outline: 3px solid #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}
```

### Skip Navigation
```html
<!-- At top of every page -->
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<style>
  .skip-link {
    position: absolute;
    left: -9999px;
    z-index: 999;
  }
  
  .skip-link:focus {
    left: 0; /* Becomes visible on focus */
    top: 0;
    padding: 1rem;
    background: blue;
    color: white;
  }
</style>

<nav><!-- navigation --></nav>

<main id="main-content">
  <!-- Page content -->
</main>
```

---

## 4️⃣ FORMS & LABELS

### Proper Labeling
```html
<!-- ✅ CORRECT -->
<label htmlFor="transaction-amount">Amount (R)</label>
<input 
  id="transaction-amount" 
  type="number" 
  placeholder="e.g., 250.00"
  aria-describedby="amount-help"
/>
<span id="amount-help" className="help-text">
  Enter a positive number up to R999,999,999.99
</span>

<!-- ❌ WRONG - no association -->
<label>Amount</label>
<input type="number" placeholder="250.00" />

<!-- ❌ WRONG - placeholder alone insufficient -->
<input type="number" placeholder="Amount (R)" />
```

### Error Messages
```html
<!-- Link errors to fields -->
<input 
  id="date-input" 
  type="date" 
  aria-invalid="true"
  aria-describedby="date-error"
/>
<div id="date-error" className="error">
  Date cannot be in the future. Please select today or earlier.
</div>
```

### Required Fields
```html
<!-- Mark required clearly -->
<label htmlFor="category">
  Category 
  <span aria-label="required">*</span>
</label>
<select 
  id="category"
  required
  aria-required="true"
>
  <option value="">-- Select category --</option>
  <option value="dining">Dining</option>
</select>
```

---

## 5️⃣ SEMANTIC HTML

### Proper Heading Structure
```html
<!-- ✅ CORRECT -->
<h1>Financial Advisor Dashboard</h1>

<h2>Accounts</h2>
<p>Your current account balances...</p>

<h2>Transactions</h2>
<p>Recent transactions...</p>

<h3>Spending by Category</h3>
<p>Breakdown of spending...</p>

<!-- ❌ WRONG - skipping levels -->
<h1>Dashboard</h1>
<h4>Accounts</h4> <!-- Skip h2 and h3 -->
```

### Semantic Elements
```html
<!-- Use semantic elements -->
<nav> <!-- Navigation -->
  <ul>
    <li><a href="/">Dashboard</a></li>
    <li><a href="/transactions">Transactions</a></li>
  </ul>
</nav>

<main> <!-- Main content -->
  <article> <!-- Self-contained content -->
    <h1>Budget Simulator</h1>
    <!-- content -->
  </article>
</main>

<aside> <!-- Sidebars, related info -->
  <h2>Quick Tips</h2>
</aside>

<footer> <!-- Footer -->
  <p>© 2026 Financial Advisor</p>
</footer>
```

---

## 6️⃣ ARIA LABELS & ROLES

### When to Use ARIA
```
Use ARIA ONLY when:
- HTML doesn't have semantic element (icon buttons)
- You need additional description
- You need live region updates

Don't use ARIA to fix bad HTML.
Fix HTML first, then add ARIA if needed.
```

### Common ARIA Labels
```html
<!-- Icon buttons (no visible text) -->
<button aria-label="Close dialog">
  <Icon name="x" />
</button>

<!-- Live regions (status updates) -->
<div aria-live="polite" aria-atomic="true">
  Budget created successfully
</div>

<!-- Expandable sections -->
<button 
  aria-expanded="false" 
  aria-controls="budget-details"
>
  Show Details
</button>
<div id="budget-details" hidden>
  <!-- Hidden content -->
</div>

<!-- Hidden decorative elements -->
<span aria-hidden="true">→</span>

<!-- Required fields -->
<input 
  aria-required="true"
  required
/>
```

---

## 7️⃣ VISUAL DESIGN

### Text Sizing
```css
/* Don't lock font size -->
* {
  font-size: 16px; /* ✅ Good base */
}

/* Allow user to increase -->
button {
  font-size: 1rem; /* Relative to base, scales with browser zoom */
}

/* Not this */
body {
  font-size: 16px !important; /* ❌ Blocks user zoom */
}
```

### Reading Distance
```
Line length: 45-75 characters (optimal)
Line height: 1.5x font size (minimum)
Paragraph spacing: 1.5x line height (minimum)

Example:
font-size: 16px
line-height: 24px (1.5 * 16px)
letter-spacing: normal or 0.12em max
```

### Motion & Animations
```css
/* Respect motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Don't auto-play video or audio */
<video controls>
  <source src="...">
</video>

/* Warn before redirects or page changes */
// Inform user before leaving page
window.addEventListener('beforeunload', (e) => {
  if (unsavedChanges) {
    e.preventDefault()
    e.returnValue = 'You have unsaved changes'
  }
})
```

---

## 8️⃣ CHARTS & DATA VISUALIZATION

### Accessible Charts
```html
<!-- Recharts (accessible out of box) -->
<ResponsiveContainer width="100%" height={300}>
  <BarChart 
    data={data}
    role="img"
    aria-label="Monthly spending by category"
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="category" />
    <YAxis />
    <Bar dataKey="amount" />
  </BarChart>
</ResponsiveContainer>

<!-- Provide data table as alternative -->
<table 
  className="sr-only" /* Screen reader only */
  aria-label="Monthly spending by category"
>
  <thead>
    <tr>
      <th>Category</th>
      <th>Amount (R)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Dining</td>
      <td>500</td>
    </tr>
    <!-- More rows -->
  </tbody>
</table>
```

### Color + Patterns
```html
<!-- Don't rely on color alone -->
<legend>Transaction Status</legend>

<!-- Use color + icon -->
<span className="status success">
  <Icon name="check" /> Completed
</span>

<span className="status error">
  <Icon name="alert" /> Failed
</span>

<span className="status warning">
  <Icon name="info" /> Pending
</span>
```

---

## 9️⃣ TESTING FOR ACCESSIBILITY

### Manual Testing Checklist
```
Keyboard:
- [ ] Tab through entire page
- [ ] Can focus all interactive elements
- [ ] Focus order is logical
- [ ] No keyboard traps
- [ ] Can activate buttons with Enter/Space
- [ ] Can dismiss modals with Escape

Screen Reader (NVDA on Windows, JAWS, VoiceOver on Mac):
- [ ] All text readable
- [ ] Images have alt text
- [ ] Links have descriptive text
- [ ] Form fields have labels
- [ ] Error messages associated to fields
- [ ] Navigation landmarks identified

Vision:
- [ ] Page readable with zoom 200%
- [ ] Color contrast sufficient
- [ ] No info conveyed by color alone
- [ ] Works in grayscale

Mobile:
- [ ] Touch targets ≥ 44x44 pixels
- [ ] No horizontal scrolling
- [ ] Readable without horizontal zoom
```

### Automated Testing
```typescript
// Jest + Axe for automated accessibility testing
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('dashboard has no accessibility violations', async () => {
  const { container } = render(<Dashboard />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Tools
```
- Axe DevTools (Chrome extension)
- WAVE (Firefox extension)
- Lighthouse (Chrome DevTools)
- NVDA (Windows screen reader, free)
- JAWS (Windows, paid, professional)
- VoiceOver (Mac, built-in)
- TalkBack (Android, built-in)
```

---

## 🔟 ACCESSIBILITY COMPONENTS CHECKLIST

### Dashboard
- [ ] Can navigate with keyboard
- [ ] All cards have proper headings
- [ ] Charts have alt text and data tables
- [ ] Status indicators use color + icon
- [ ] Links clearly distinguish from text
- [ ] Enough contrast (normal + light modes)

### Forms
- [ ] Labels properly associated with inputs
- [ ] Error messages linked to fields
- [ ] Required field indicator accessible
- [ ] Form instructions clear
- [ ] Help text associated with fields
- [ ] Submit button clearly labeled

### Navigation
- [ ] Logo is a link to home
- [ ] Active page indicated
- [ ] Breadcrumbs (if present)
- [ ] Menu keyboard accessible
- [ ] Skip link present
- [ ] Site map available

### Tables
- [ ] Header cells use `<th>` not `<td>`
- [ ] Row/column scopes defined
- [ ] Summary of data structure
- [ ] Caption if needed
- [ ] Sortable columns indicate current sort

---

## Summary

✅ **WCAG 2.1 Level AA**: Target standard for all pages  
✅ **Color Contrast**: 4.5:1 minimum for normal text  
✅ **Keyboard Navigation**: All features keyboard accessible  
✅ **Focus Indicators**: Visible focus on all interactive elements  
✅ **Labels**: All form fields properly labeled  
✅ **Semantic HTML**: Proper headings, landmarks, elements  
✅ **ARIA**: Used only when HTML insufficient  
✅ **Charts**: Alt text + data table fallbacks  
✅ **Motion**: Respects reduced motion preference  
✅ **Testing**: Automated (Axe) + manual (keyboard, screen reader)  
