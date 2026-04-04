# Shopify Tip App Billing Design

## Goal

Add a stable commercial billing flow for the Shopify tip app using a single lifetime license. Merchants must pay once to unlock the app in production. Local development and dev-store workflows should bypass billing automatically so the team can build and test without friction.

## Product Decisions

- Pricing model: one-time payment, lifetime access
- Billing enforcement in production: hard block
- Billing enforcement in development: bypass by default
- Merchant experience when unpaid: merchant only sees the license purchase page
- Merchant experience when paid: merchant can access the app and configure the tip experience
- Checkout editor role: placement only
- App settings role: source of truth for tip configuration

## Current Codebase Summary

- The embedded admin app uses `@shopify/shopify-app-react-router`
- Authentication is configured in `app/shopify.server.js`
- Admin routes currently include:
  - `app/routes/app.jsx`
  - `app/routes/app._index.jsx`
  - `app/routes/app.settings.tip-block.jsx`
- The checkout extension is implemented in `extensions/checkout-ui/src/Checkout.jsx`
- The current settings page stores JSON configuration in a shop metafield
- The current checkout extension reads `shopify.settings.value`, so admin settings and extension runtime are not connected

## Billing Architecture

### Billing Provider

Use Shopify's one-time app billing flow through `appPurchaseOneTimeCreate`.

Why this fits:

- The app has one commercial plan only
- The app does not need recurring billing, proration, or plan switching
- Shopify hosts the purchase approval step
- The app can still allow free development and testing

## Enforcement Model

Introduce an explicit environment-controlled enforcement mode:

- `BILLING_ENFORCEMENT=required`
- `BILLING_ENFORCEMENT=bypass`

Rules:

- `required`: the app checks Shopify billing state and blocks all unpaid merchants
- `bypass`: the app treats the shop as licensed and never redirects to payment

This avoids accidental reliance on `NODE_ENV` alone and makes staging behavior predictable.

## License State

### Canonical Source

The canonical source of license truth is Shopify billing status.

### Local Cache

Maintain a local cached license record per shop for speed, visibility, and webhook reconciliation.

Suggested fields:

- `shop`
- `licenseStatus`
- `purchaseId`
- `purchaseName`
- `amount`
- `currencyCode`
- `isTest`
- `activatedAt`
- `updatedAt`

Suggested statuses:

- `active`
- `pending`
- `declined`
- `none`
- `bypass`

## Route Gating

### Routes that must be gated

- `/app`
- `/app/settings/tip-block`
- any future embedded admin routes

### Routes that must remain accessible

- `/auth/*`
- `/webhooks/*`
- `/app/license`
- `/app/license/confirm`

### Behavior

When a merchant opens the embedded app:

1. Authenticate the request
2. Check whether billing enforcement is bypassed
3. If bypassed, allow access
4. If not bypassed, verify license state
5. If the merchant has no active purchase, redirect to `/app/license`
6. If the merchant has an active purchase, allow access

## License Purchase Page

Create a dedicated route at `/app/license`.

Purpose:

- act as the only visible page for unpaid merchants
- explain that the app requires a one-time lifetime purchase
- present a single primary action to unlock the app

Page content:

- app name
- one-time price
- short feature summary
- "Unlock app forever" button
- optional note that checkout block placement happens later in the checkout editor

## Purchase Flow

### Step 1: Create charge

When the merchant clicks "Unlock app forever":

1. The app calls Shopify billing to create a one-time purchase
2. Shopify returns a hosted approval URL
3. The app redirects the merchant to the Shopify approval page

Required billing inputs:

- purchase name
- price
- currency
- return URL
- test flag when appropriate

### Step 2: Merchant approval

The merchant accepts or declines the one-time purchase in Shopify's approval screen.

### Step 3: Return to app

After approval, Shopify redirects back to the app return URL, which should point to `/app/license/confirm`.

## Billing Confirmation Flow

Create a route at `/app/license/confirm`.

Behavior:

1. Authenticate the request
2. Query current billing state from Shopify
3. If an active one-time purchase exists:
   - update the local license cache
   - redirect to `/app`
4. If no active purchase exists:
   - redirect back to `/app/license`
   - optionally show an error or declined state

This route is the authoritative post-purchase handshake for unlocking the app.

## Webhook Synchronization

Subscribe to Shopify's one-time purchase update webhook.

Use the webhook to:

- reconcile purchase state changes outside the redirect flow
- refresh local license cache
- support recovery if the merchant closes the browser during purchase

The existing uninstall webhook should remain and clear or deactivate local data as needed.

## Checkout Extension Runtime Gating

Hard-blocking the embedded app is necessary but not sufficient.

Reason:

- a merchant may already have placed the checkout block previously
- checkout can still render the extension separately from app admin navigation

Therefore, the checkout extension also needs runtime gating.

### Runtime requirement

The extension must read an app-controlled runtime config that includes an `enabled` flag.

Rules:

- if unpaid: `enabled = false`, extension renders nothing
- if paid: `enabled = true`, extension renders the configured tip UI

This ensures production behavior remains consistent even if a block was already placed in the checkout editor.

## Settings Ownership

### Source of truth

Tip configuration should live in the app, not in checkout editor extension settings.

The app settings page should own:

- widget title
- caption text
- tip presets
- custom amount toggle
- any supported display options
- any tip product mapping or runtime identifiers

### Checkout editor responsibility

The checkout editor should only control:

- whether the block is added
- where the block is placed

This keeps merchant configuration centralized and aligns with the product requirement that settings belong to the app.

## Styling Constraints

Checkout UI extensions inherit merchant branding and do not allow arbitrary CSS overrides.

Implications:

- do not promise free-form color control for the checkout block
- prefer constrained display options such as tone or presentation modes
- keep label, captions, percentages, and behavior configurable

## Recommended Runtime Config Shape

Suggested stored config structure:

```json
{
  "enabled": true,
  "licensed": true,
  "widget_title": "Leave a tip",
  "tip_percentages": "10,15,20",
  "custom_amount_enabled": true,
  "caption1": "Support our team",
  "caption2": "A small tip goes a long way",
  "caption3": "Thank you for your support"
}
```

Notes:

- `enabled` should be derived from billing state and app activation rules
- the extension should consume this runtime config instead of relying on `shopify.settings.value` for business settings

## Production and Development Rules

### Development

- bypass billing by default
- allow app access without purchase
- allow extension runtime config to behave as licensed for local testing

### Production

- require a valid active one-time purchase before granting access
- redirect unpaid merchants to the license page
- disable extension runtime rendering when unpaid

## Failure Handling

### Merchant declines charge

- keep merchant on or return merchant to `/app/license`
- show a concise declined or not-yet-approved state

### Merchant closes billing tab

- next app visit still routes to `/app/license`
- local cache is reconciled on next verification

### Merchant reinstalls app

- app re-checks Shopify billing state
- if the one-time purchase remains active, the merchant regains access

### Shopify billing mismatch

- treat Shopify as source of truth
- refresh local cache rather than trusting stale local status

## Security and Operational Notes

- never trust client-side billing state alone
- do billing verification server-side in route loaders/actions
- keep license page accessible after authentication so unpaid merchants are not trapped
- do not expose app functionality via ungated routes

## Implementation Outline

1. Add Shopify billing configuration for the lifetime plan
2. Add a license persistence model and sync helper
3. Add a centralized billing gate for embedded app routes
4. Add `/app/license` and `/app/license/confirm`
5. Add webhook handling for one-time purchase updates
6. Refactor app settings to become the source of truth for tip config
7. Publish runtime config for the checkout extension
8. Update the checkout extension to render only when runtime config is enabled

## Acceptance Criteria

- In development, the app opens normally without purchase
- In production, an unpaid merchant only sees the license page
- In production, a paid merchant can access the app immediately after approval
- The app stays unlocked across normal future visits for licensed merchants
- The checkout extension does not render for unpaid merchants
- The app settings page becomes the authoritative place for tip configuration
- Checkout editor is only required for block placement

## Open Questions for Implementation

- exact one-time price and currency
- whether runtime config should be stored in a shop metafield, app-owned metafield, or backend-backed API layer
- whether the first commercial release should support fixed tip presets only or also dynamic percentage-based charging logic
