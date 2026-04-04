# Tip App Polish And Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the core merchant-facing UI for the tip app and document the production rollout steps for billing, runtime config, and extension deployment.

**Architecture:** Keep all behavior intact while improving clarity and visual hierarchy on the license page, tip settings page, and checkout block. Add a production checklist document that describes environment variables, Shopify deploy steps, and verification steps now that the extension reads runtime metafields.

**Tech Stack:** React Router 7, Shopify embedded app web components, Checkout UI Extensions with Preact, Node test runner, Markdown docs

---

### Task 1: Polish Merchant License Page

**Files:**
- Modify: `D:\khanh-dev\app\routes\app.license.jsx`

- [ ] Rework the layout into a cleaner commerce-style purchase surface
- [ ] Highlight the one-time price, included features, and merchant outcome after purchase
- [ ] Keep the existing billing action unchanged
- [ ] Run `npm run build`

### Task 2: Polish Tip Settings Page

**Files:**
- Modify: `D:\khanh-dev\app\routes\app.settings.tip-block.jsx`

- [ ] Improve section hierarchy and copy
- [ ] Add a compact runtime summary for merchants
- [ ] Keep loader/action behavior intact
- [ ] Run `npm run typecheck`

### Task 3: Polish Checkout Tip Block

**Files:**
- Modify: `D:\khanh-dev\extensions\checkout-ui\src\Checkout.jsx`
- Modify: `D:\khanh-dev\extensions\checkout-ui\package.json`

- [ ] Improve copy and visual structure while staying within Shopify checkout component constraints
- [ ] Remove demo-like strings and odd glyphs
- [ ] Silence the module-type warning in extension tests
- [ ] Run `npm run build`

### Task 4: Add Production Readiness Checklist

**Files:**
- Create: `D:\khanh-dev\docs\production\2026-04-04-shopify-tip-app-production-checklist.md`

- [ ] Document required env vars for production
- [ ] Document Shopify deploy sequence for app config, billing, and extension metafield config
- [ ] Add manual verification checklist for dev, staging, and production
- [ ] Reference official Shopify docs links

### Task 5: Verify End-To-End

**Files:**
- Test: `D:\khanh-dev\tests\billing\env.server.test.js`
- Test: `D:\khanh-dev\tests\billing\license.server.test.js`
- Test: `D:\khanh-dev\tests\tip-config\tip-config.server.test.js`
- Test: `D:\khanh-dev\tests\tip-config\checkout-runtime.test.js`

- [ ] Run `npm test`
- [ ] Run `npm run typecheck`
- [ ] Run `npm run build`
