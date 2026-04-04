# Shopify Tip App Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-time lifetime billing gate for the Shopify tip app so production shops must purchase a license before accessing the embedded app.

**Architecture:** Configure a single Shopify one-time billing plan in the app server, persist a local license cache in Prisma, and gate all embedded admin routes through a shared billing helper. Unpaid merchants are redirected to a dedicated license page, while development environments bypass the gate by configuration.

**Tech Stack:** React Router 7, `@shopify/shopify-app-react-router`, Shopify Billing API helpers, Prisma with SQLite, Node built-in test runner

---

## File Map

- Create: `D:\khanh-dev\app\billing\config.server.js`
- Create: `D:\khanh-dev\app\billing\env.server.js`
- Create: `D:\khanh-dev\app\billing\license.server.js`
- Create: `D:\khanh-dev\app\billing\gate.server.js`
- Create: `D:\khanh-dev\app\routes\app.license.jsx`
- Create: `D:\khanh-dev\app\routes\app.license.confirm.jsx`
- Create: `D:\khanh-dev\app\routes\webhooks.app_purchases_one_time.update.jsx`
- Create: `D:\khanh-dev\tests\billing\env.server.test.js`
- Create: `D:\khanh-dev\tests\billing\license.server.test.js`
- Modify: `D:\khanh-dev\app\shopify.server.js`
- Modify: `D:\khanh-dev\app\routes\app.jsx`
- Modify: `D:\khanh-dev\app\routes\app._index.jsx`
- Modify: `D:\khanh-dev\app\routes\app.settings.tip-block.jsx`
- Modify: `D:\khanh-dev\app\routes\webhooks.app.uninstalled.jsx`
- Modify: `D:\khanh-dev\package.json`
- Modify: `D:\khanh-dev\prisma\schema.prisma`
- Modify: `D:\khanh-dev\shopify.app.toml`

### Task 1: Add Billing Test Harness And Environment Rules

**Files:**
- Create: `D:\khanh-dev\tests\billing\env.server.test.js`
- Create: `D:\khanh-dev\app\billing\env.server.js`
- Modify: `D:\khanh-dev\package.json`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  getBillingEnforcementMode,
  shouldBypassBilling,
} from "../../app/billing/env.server.js";

test("defaults to bypass when BILLING_ENFORCEMENT is not set", () => {
  assert.equal(getBillingEnforcementMode({}), "bypass");
  assert.equal(shouldBypassBilling({}), true);
});

test("requires billing when BILLING_ENFORCEMENT=required", () => {
  assert.equal(
    getBillingEnforcementMode({ BILLING_ENFORCEMENT: "required" }),
    "required",
  );
  assert.equal(
    shouldBypassBilling({ BILLING_ENFORCEMENT: "required" }),
    false,
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/billing/env.server.test.js`
Expected: FAIL because `app/billing/env.server.js` does not exist yet

- [ ] **Step 3: Write minimal implementation**

```js
export function getBillingEnforcementMode(env = process.env) {
  return env.BILLING_ENFORCEMENT === "required" ? "required" : "bypass";
}

export function shouldBypassBilling(env = process.env) {
  return getBillingEnforcementMode(env) === "bypass";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/billing/env.server.test.js`
Expected: PASS

- [ ] **Step 5: Add a test script**

Add `"test": "node --test tests/**/*.test.js"` to `package.json`

### Task 2: Add License Selection And Persistence Helpers

**Files:**
- Create: `D:\khanh-dev\tests\billing\license.server.test.js`
- Create: `D:\khanh-dev\app\billing\license.server.js`
- Modify: `D:\khanh-dev\prisma\schema.prisma`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { selectActiveOneTimePurchase } from "../../app/billing/license.server.js";

test("prefers an ACTIVE one-time purchase", () => {
  const purchase = selectActiveOneTimePurchase([
    { id: "1", status: "DECLINED", test: false, name: "Lifetime" },
    { id: "2", status: "ACTIVE", test: false, name: "Lifetime" },
  ]);

  assert.deepEqual(purchase, {
    id: "2",
    status: "ACTIVE",
    test: false,
    name: "Lifetime",
  });
});

test("returns null when there is no active purchase", () => {
  assert.equal(
    selectActiveOneTimePurchase([{ id: "1", status: "DECLINED" }]),
    null,
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/billing/license.server.test.js`
Expected: FAIL because `app/billing/license.server.js` does not exist yet

- [ ] **Step 3: Write minimal implementation**

```js
export function selectActiveOneTimePurchase(purchases = []) {
  return purchases.find((purchase) => purchase?.status === "ACTIVE") ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/billing/license.server.test.js`
Expected: PASS

- [ ] **Step 5: Add the Prisma model**

Add a `ShopLicense` model with:

- `shop` as primary key
- `licenseStatus`
- `purchaseId`
- `purchaseName`
- `isTest`
- `updatedAt`
- `activatedAt`

### Task 3: Configure Shopify Billing Plan

**Files:**
- Create: `D:\khanh-dev\app\billing\config.server.js`
- Modify: `D:\khanh-dev\app\shopify.server.js`

- [ ] **Step 1: Add billing constants**

Create plan constants for:

- plan key
- plan name
- amount
- currency

- [ ] **Step 2: Configure the one-time plan in `shopify.server.js`**

Use Shopify billing config with:

```js
billing: {
  [LIFETIME_PLAN]: {
    amount: 49,
    currencyCode: "USD",
    interval: BillingInterval.OneTime,
  },
}
```

- [ ] **Step 3: Export plan constants**

Export the plan key and helpers needed by route loaders and actions.

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

### Task 4: Add Shared Billing Gate

**Files:**
- Create: `D:\khanh-dev\app\billing\gate.server.js`
- Modify: `D:\khanh-dev\app\routes\app.jsx`

- [ ] **Step 1: Write the gate helper**

Implement a helper that:

- authenticates through an already-created admin context
- bypasses when `BILLING_ENFORCEMENT=bypass`
- checks Shopify billing when enforcement is required
- syncs local license cache
- redirects unpaid merchants to `/app/license`

- [ ] **Step 2: Wire the gate into the app layout loader**

Update `app/routes/app.jsx` so all child routes inherit billing enforcement.

- [ ] **Step 3: Exempt license routes**

Ensure `/app/license` and `/app/license/confirm` are not trapped in a redirect loop.

- [ ] **Step 4: Verify manually**

Run: `npm run typecheck`
Expected: PASS

### Task 5: Build License Purchase And Confirm Routes

**Files:**
- Create: `D:\khanh-dev\app\routes\app.license.jsx`
- Create: `D:\khanh-dev\app\routes\app.license.confirm.jsx`

- [ ] **Step 1: Create `/app/license` loader**

Behavior:

- authenticate admin
- if already licensed, redirect to `/app`
- otherwise render license page

- [ ] **Step 2: Create `/app/license` action**

Behavior:

- call `billing.request`
- use one-time lifetime plan
- use `isTest` only when billing is bypassed or explicitly configured
- set `returnUrl` to `/app/license/confirm`

- [ ] **Step 3: Create `/app/license/confirm` loader**

Behavior:

- authenticate admin
- query billing state
- sync local cache
- redirect licensed shops to `/app`
- redirect unpaid shops back to `/app/license`

- [ ] **Step 4: Add minimal embedded UI**

Include:

- app name
- one-time pricing copy
- single primary CTA

### Task 6: Add Billing Webhook Sync

**Files:**
- Create: `D:\khanh-dev\app\routes\webhooks.app_purchases_one_time.update.jsx`
- Modify: `D:\khanh-dev\app\routes\webhooks.app.uninstalled.jsx`
- Modify: `D:\khanh-dev\shopify.app.toml`

- [ ] **Step 1: Register the webhook topic**

Add `APP_PURCHASES_ONE_TIME_UPDATE` to `shopify.app.toml`

- [ ] **Step 2: Implement the webhook route**

Behavior:

- authenticate webhook
- record the latest purchase state in `ShopLicense`

- [ ] **Step 3: Update uninstall cleanup**

Delete or reset `ShopLicense` when the app is uninstalled

- [ ] **Step 4: Deploy-time note**

Remember this webhook requires `shopify app deploy` or config sync to register with Shopify

### Task 7: Gate Existing Admin Screens

**Files:**
- Modify: `D:\khanh-dev\app\routes\app._index.jsx`
- Modify: `D:\khanh-dev\app\routes\app.settings.tip-block.jsx`

- [ ] **Step 1: Remove any assumptions that these routes are reachable unpaid**

Keep them under the app layout gate, with no separate bypasses.

- [ ] **Step 2: Verify authenticated licensed access**

Make sure loaders/actions still work after the shared gate is introduced.

- [ ] **Step 3: Run manual smoke test**

Check:

- unpaid production-like env -> `/app/license`
- paid env -> app loads
- bypass env -> app loads without purchase

### Task 8: Verification

**Files:**
- Test: `D:\khanh-dev\tests\billing\env.server.test.js`
- Test: `D:\khanh-dev\tests\billing\license.server.test.js`

- [ ] **Step 1: Run focused automated tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Confirm billing routes build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Manual verification checklist**

Verify:

- dev mode bypasses license
- production mode redirects unpaid merchants to license
- paid merchants return to `/app`
- uninstall removes cached license data
