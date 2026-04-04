# Fixed Amount Tip Cart-Line Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace attribute-only tip saving with fixed-amount tip presets that add a real cart line and appear in checkout order summary.

**Architecture:** Keep app settings as the source of truth, but reinterpret the preset list as fixed amounts. The checkout extension will parse those preset amounts, derive the correct cart-line quantity from the configured tip variant, and use `applyCartLinesChange` to add, update, or remove the tip line. A small helper module will own parsing and cart-line payload creation so the UI component stays readable.

**Tech Stack:** Shopify Checkout UI Extensions, Preact, React Router app settings, Node test runner

---

### Task 1: Add failing tests for fixed-amount parsing and cart-line payloads

**Files:**
- Create: `D:\khanh-dev\tests\checkout-ui\tip-cart-line.test.js`
- Create: `D:\khanh-dev\extensions\checkout-ui\src\tip-cart-line.js`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal helper implementation**
- [ ] **Step 4: Run test to verify it passes**

### Task 2: Move checkout extension from attribute flow to cart-line flow

**Files:**
- Modify: `D:\khanh-dev\extensions\checkout-ui\src\Checkout.jsx`
- Reuse: `D:\khanh-dev\extensions\checkout-ui\src\tip-cart-line.js`
- Reuse: `D:\khanh-dev\extensions\checkout-ui\src\attribute-changes.js`

- [ ] **Step 1: Remove caption rotation UI and show only `caption1`**
- [ ] **Step 2: Replace preset interpretation from percentage labels to fixed amount labels**
- [ ] **Step 3: Use `applyCartLinesChange` add/update/remove payloads instead of attribute-only success flow**
- [ ] **Step 4: Keep clear error handling when variant/config/instructions are invalid**

### Task 3: Update admin copy to match fixed-amount behavior

**Files:**
- Modify: `D:\khanh-dev\app\routes\app.settings.tip-block.jsx`

- [ ] **Step 1: Update helper text from percentages to fixed amounts**
- [ ] **Step 2: Adjust tip variant helper text to explain unit-price quantity model**

### Task 4: Verify end to end build health

**Files:**
- Test: `D:\khanh-dev\tests\checkout-ui\tip-cart-line.test.js`
- Test: `D:\khanh-dev\tests\checkout-ui\attribute-changes.test.js`
- Test: `D:\khanh-dev\tests\tip-config\tip-config.server.test.js`

- [ ] **Step 1: Run `npm test`**
- [ ] **Step 2: Run `npm run typecheck`**
- [ ] **Step 3: Run `npm run build`**
