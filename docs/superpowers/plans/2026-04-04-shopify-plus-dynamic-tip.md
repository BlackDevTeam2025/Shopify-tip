# Shopify Plus Dynamic Tip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the tipping app into a Shopify Plus-focused dynamic tip flow that computes preset percentages from order subtotal, supports custom amount entry, and refreshes the admin settings UI to match the approved visual direction.

**Architecture:** The app settings page remains the source of truth via the existing shop metafield. The checkout UI extension is refactored away from fixed-amount cart-line logic and back toward subtotal-percentage presentation/state handling, while the runtime is gated for Plus-only production behavior. Admin UI is redesigned as a two-column marketing-plus-settings layout using Shopify app components and app-owned styling only where appropriate.

**Tech Stack:** React Router Shopify app, Shopify embedded app components, Shopify checkout UI extension (Preact), shop metafield JSON config, Vitest, existing billing/license helpers.

---

## File Map

### Modify
- `D:/khanh-dev/app/routes/app.settings.tip-block.jsx`
  - Replace fixed-amount copy and layout with the new two-column settings UI.
  - Add `percentage_display_option` control.
  - Add Plus-only messaging.
- `D:/khanh-dev/app/tip-config.server.js`
  - Restore percentage semantics for `tip_percentages`.
  - Add defaults, parsing, and migration for `percentage_display_option` and `plus_only`.
  - Preserve legacy compatibility.
- `D:/khanh-dev/extensions/checkout-ui/src/Checkout.jsx`
  - Remove fixed-amount cart-line assumptions.
  - Reintroduce subtotal-percentage calculation, custom amount mode, and Plus gating.
  - Add display label formatting based on admin option.
- `D:/khanh-dev/extensions/checkout-ui/src/runtime-config.js`
  - Ensure runtime config normalization includes the new fields.
- `D:/khanh-dev/extensions/checkout-ui/shopify.extension.toml`
  - Keep the right-column placement target unless a later runtime constraint forces a move.
- `D:/khanh-dev/tests/tip-config/tip-config.server.test.js`
  - Update expectations from fixed amounts to percentage semantics.
- `D:/khanh-dev/tests/app-routes/tip-block-settings-source.test.js`
  - Update to cover the new settings fields and default rendering.

### Create
- `D:/khanh-dev/extensions/checkout-ui/src/tip-percentages.js`
  - Small utility module for parsing percentages, computing subtotal-derived amounts, rounding, and building labels.
- `D:/khanh-dev/tests/checkout-ui/tip-percentages.test.js`
  - Unit tests for percentage parsing and subtotal math.
- `D:/khanh-dev/tests/checkout-ui/checkout-labels.test.js`
  - Unit tests for buyer-facing label formatting from display option values.

### Likely Retire or Reduce
- `D:/khanh-dev/extensions/checkout-ui/src/tip-cart-line.js`
  - Either remove entirely or shrink to the minimum needed if any pieces remain useful.
- `D:/khanh-dev/tests/checkout-ui/tip-cart-line.test.js`
  - Remove or replace once fixed-amount cart-line behavior is no longer the active path.

---

### Task 1: Update config model for percentage-based tipping

**Files:**
- Modify: `D:/khanh-dev/app/tip-config.server.js`
- Test: `D:/khanh-dev/tests/tip-config/tip-config.server.test.js`

- [ ] **Step 1: Write failing tests for the new config defaults and migration rules**

Add tests that prove:
- default `tip_percentages` are treated as percentage values such as `5,10,20`
- default `percentage_display_option` is stable
- default `plus_only` is `true`
- old saved configs without the new fields are upgraded safely
- legacy numeric variant IDs still normalize correctly

- [ ] **Step 2: Run the targeted config test file to verify failure**

Run: `npm test -- tests/tip-config/tip-config.server.test.js`
Expected: FAIL due to missing fields / outdated expectations.

- [ ] **Step 3: Implement the new config shape**

In `app/tip-config.server.js`:
- add `normalizeDisplayOption(value)`
- add `normalizePlusOnly(value)`
- change `getDefaultTipConfig()` to percentage-based defaults
- extend `buildTipRuntimeConfig()` to include `percentage_display_option` and `plus_only`
- update `buildTipConfigFromFormData()` to save those fields
- keep legacy fields readable for migration safety

- [ ] **Step 4: Re-run the targeted config tests**

Run: `npm test -- tests/tip-config/tip-config.server.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add D:/khanh-dev/app/tip-config.server.js D:/khanh-dev/tests/tip-config/tip-config.server.test.js
git commit -m "refactor: restore percentage tip config semantics"
```

### Task 2: Add percentage math utilities

**Files:**
- Create: `D:/khanh-dev/extensions/checkout-ui/src/tip-percentages.js`
- Test: `D:/khanh-dev/tests/checkout-ui/tip-percentages.test.js`
- Test: `D:/khanh-dev/tests/checkout-ui/checkout-labels.test.js`

- [ ] **Step 1: Write failing tests for parsing, rounding, and label formatting**

Cover:
- parsing `5,10,20` into numeric percentages
- ignoring invalid values
- calculating amount from subtotal
- rounding to currency minor units
- formatting labels for display modes like:
  - `Add 20% ($7.50) Tip Amount`
  - `20%`
  - amount-heavy display variant

- [ ] **Step 2: Run the new targeted tests to verify failure**

Run:
- `npm test -- tests/checkout-ui/tip-percentages.test.js`
- `npm test -- tests/checkout-ui/checkout-labels.test.js`
Expected: FAIL because the files do not exist yet.

- [ ] **Step 3: Implement the utility module**

In `extensions/checkout-ui/src/tip-percentages.js`, add focused helpers:
- `parseTipPercentages(raw)`
- `calculateSubtotalTipAmount({ subtotal, percentage })`
- `roundCurrencyAmount(amount)`
- `formatTipOptionLabel({ percentage, amount, currencyCode, displayOption })`
- `isValidCustomAmount(value)`

- [ ] **Step 4: Re-run the new targeted tests**

Run:
- `npm test -- tests/checkout-ui/tip-percentages.test.js`
- `npm test -- tests/checkout-ui/checkout-labels.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add D:/khanh-dev/extensions/checkout-ui/src/tip-percentages.js D:/khanh-dev/tests/checkout-ui/tip-percentages.test.js D:/khanh-dev/tests/checkout-ui/checkout-labels.test.js
git commit -m "feat: add subtotal percentage tip utilities"
```

### Task 3: Redesign the admin settings page

**Files:**
- Modify: `D:/khanh-dev/app/routes/app.settings.tip-block.jsx`
- Test: `D:/khanh-dev/tests/app-routes/tip-block-settings-source.test.js`

- [ ] **Step 1: Write failing tests for the new settings fields and initial rendering**

Cover:
- `Title`
- `Percentages`
- `Percentages display option`
- `Allow custom amount`
- `Checkout caption`
- presence of Plus-only informational copy

- [ ] **Step 2: Run the settings route test file to verify failure**

Run: `npm test -- tests/app-routes/tip-block-settings-source.test.js`
Expected: FAIL because current UI and field labels are different.

- [ ] **Step 3: Implement the new settings layout**

In `app/routes/app.settings.tip-block.jsx`:
- replace current stacked sections with a two-column composition
- create a left informational panel with bold heading + feature bullets
- create a right settings card with rounded controls
- replace fixed-amount helper text with subtotal percentage language
- add a `percentage_display_option` select control
- add Plus-only explanatory copy
- keep data submission fully compatible with the server action

- [ ] **Step 4: Re-run the settings route tests**

Run: `npm test -- tests/app-routes/tip-block-settings-source.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add D:/khanh-dev/app/routes/app.settings.tip-block.jsx D:/khanh-dev/tests/app-routes/tip-block-settings-source.test.js
git commit -m "feat: redesign tip settings page for dynamic percentage tips"
```

### Task 4: Refactor checkout extension UI back to subtotal percentage flow

**Files:**
- Modify: `D:/khanh-dev/extensions/checkout-ui/src/Checkout.jsx`
- Modify: `D:/khanh-dev/extensions/checkout-ui/src/runtime-config.js`
- Modify or remove: `D:/khanh-dev/extensions/checkout-ui/src/tip-cart-line.js`
- Test: `D:/khanh-dev/tests/checkout-ui/tip-cart-line.test.js`
- Test: `D:/khanh-dev/tests/checkout-ui/tip-percentages.test.js`
- Test: `D:/khanh-dev/tests/checkout-ui/checkout-labels.test.js`

- [ ] **Step 1: Add or adjust failing tests for checkout selection behavior**

Cover behavior expectations around:
- reading the new runtime config fields
- deriving tip amounts from subtotal
- switching between preset percentage and custom amount mode
- not showing fixed-amount-specific copy

- [ ] **Step 2: Run the targeted checkout tests to verify failure**

Run: `npm test -- tests/checkout-ui`
Expected: FAIL because current extension is still fixed-amount-based.

- [ ] **Step 3: Implement the checkout refactor**

In `extensions/checkout-ui/src/Checkout.jsx`:
- remove fixed-amount parsing and related copy
- derive subtotal from checkout runtime data
- compute preset amounts from percentages
- format labels based on `percentage_display_option`
- keep custom amount as an absolute amount
- add Plus-only unsupported-store messaging / fail-closed behavior
- keep success/error state transitions coherent

In `extensions/checkout-ui/src/runtime-config.js`:
- normalize the new fields from app metafields

In `extensions/checkout-ui/src/tip-cart-line.js`:
- either remove fixed-amount-specific helpers or reduce it to only what still fits the new architecture

- [ ] **Step 4: Re-run the targeted checkout tests**

Run: `npm test -- tests/checkout-ui`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add D:/khanh-dev/extensions/checkout-ui/src/Checkout.jsx D:/khanh-dev/extensions/checkout-ui/src/runtime-config.js D:/khanh-dev/extensions/checkout-ui/src/tip-cart-line.js D:/khanh-dev/tests/checkout-ui
 git commit -m "refactor: restore subtotal percentage tip checkout flow"
```

### Task 5: Add store eligibility gating and copy

**Files:**
- Modify: `D:/khanh-dev/app/routes/app.settings.tip-block.jsx`
- Modify: `D:/khanh-dev/extensions/checkout-ui/src/Checkout.jsx`
- Possibly modify: `D:/khanh-dev/app/billing/gate.server.js`
- Test: relevant route/checkout tests

- [ ] **Step 1: Write failing tests for Plus-only messaging and fallback behavior**

Cover:
- admin settings page explains that dynamic subtotal tipping is for Shopify Plus
- checkout block does not mislead when runtime support is missing

- [ ] **Step 2: Run the targeted tests to verify failure**

Run: `npm test -- tests/app-routes/tip-block-settings-source.test.js tests/checkout-ui`
Expected: FAIL.

- [ ] **Step 3: Implement the eligibility messaging**

- add a clear Plus-only notice in admin settings
- add guardrails in checkout so unsupported environments fail closed with concise messaging or hidden controls
- avoid claiming fixed-amount compatibility in this path

- [ ] **Step 4: Re-run the targeted tests**

Run: `npm test -- tests/app-routes/tip-block-settings-source.test.js tests/checkout-ui`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add D:/khanh-dev/app/routes/app.settings.tip-block.jsx D:/khanh-dev/extensions/checkout-ui/src/Checkout.jsx D:/khanh-dev/app/billing/gate.server.js D:/khanh-dev/tests/app-routes/tip-block-settings-source.test.js D:/khanh-dev/tests/checkout-ui
 git commit -m "feat: add plus-only messaging for dynamic tip flow"
```

### Task 6: Remove stale fixed-amount language and verify app-wide behavior

**Files:**
- Modify: any remaining references found by search
- Possibly remove: `D:/khanh-dev/tests/checkout-ui/tip-cart-line.test.js`

- [ ] **Step 1: Search for stale fixed-amount wording and assumptions**

Run: `rg -n "fixed amount|fixed amounts|tip cart line|divide evenly|preset amounts" D:/khanh-dev`
Expected: find remaining stale references.

- [ ] **Step 2: Remove or rewrite stale references**

Update docs, helper text, and tests so the repo consistently describes subtotal-based percentage tipping for this path.

- [ ] **Step 3: Run the full project verification suite**

Run:
- `npm test`
- `npm run typecheck`
- `npm run build`

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add D:/khanh-dev
git commit -m "chore: clean up fixed-amount tip remnants"
```

---

## Verification Checklist

Before calling the work complete:
- admin settings page renders the new two-column design
- settings save and reload correctly
- `tip_percentages` behaves as percentages, not currency amounts
- checkout labels show subtotal-derived values
- custom amount mode still works in the UI layer
- Plus-only messaging is visible and accurate
- full test, typecheck, and build suite passes

## Notes for Execution

- Keep the current billing/license gate intact unless the new Plus-only product requirement forces a small copy change.
- Do not promise pixel-perfect parity with the provided visual mockup inside checkout UI extensions; use Shopify-native components there.
- Preserve backward compatibility for existing saved metafield configs wherever cheap to do so.
