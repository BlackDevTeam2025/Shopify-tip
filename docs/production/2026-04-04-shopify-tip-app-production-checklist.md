# Shopify Tip App Production Checklist

## Goal

Ship the tip app with:

- one-time lifetime billing enabled
- app settings as the source of truth
- checkout runtime config loaded from shop metafields
- production-safe deploy and verification steps

## Required Environment Variables

Set these in production before deploying:

- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SHOPIFY_APP_URL`
- `SCOPES`
- `BILLING_ENFORCEMENT=required`
- `SHOPIFY_BILLING_TEST_MODE=false`

Optional pricing overrides:

- `SHOPIFY_LIFETIME_PLAN_NAME`
- `SHOPIFY_LIFETIME_PRICE`
- `SHOPIFY_LIFETIME_CURRENCY`

Development defaults:

- `BILLING_ENFORCEMENT=bypass`
- `SHOPIFY_BILLING_TEST_MODE=true` when testing Shopify billing redirects

## Shopify Configuration Checks

Before production deploy:

1. Confirm the app is set up as an embedded app in Shopify Partner Dashboard.
2. Confirm the billing plan name, price, and currency match product expectations.
3. Confirm the extension metafield request is present in [shopify.extension.toml](D:/khanh-dev/extensions/checkout-ui/shopify.extension.toml).
4. Confirm the webhook topic `app_purchases_one_time/update` is present in [shopify.app.toml](D:/khanh-dev/shopify.app.toml).

## Deployment Order

1. Install dependencies and generate Prisma client

```powershell
npm install
npx prisma generate --no-engine
```

2. Apply database migrations

```powershell
npx prisma migrate deploy
```

3. Verify the project locally

```powershell
npm test
npm run typecheck
npm run build
```

4. Deploy the app config and webhook changes

```powershell
shopify app deploy
```

5. Redeploy or republish the checkout extension so the metafield request is active

```powershell
shopify app deploy
```

6. Open the app in Shopify Admin and verify the license page appears for an unpaid store.

## Production Verification

### Billing

1. Open the embedded app on a production-like store without a license.
2. Confirm the merchant lands on `/app/license`.
3. Click the purchase button and complete the Shopify approval flow.
4. Confirm Shopify redirects to `/app/license/confirm`.
5. Confirm the merchant lands on `/app` after approval.

### Settings Runtime

1. Open Tip Settings.
2. Change title, percentages, and captions.
3. Save settings.
4. Re-open the page and confirm saved values are loaded back into the form.

### Checkout Runtime

1. Open the checkout editor and place the app block.
2. Start a checkout on the storefront.
3. Confirm the tip block renders with the latest app settings.
4. Confirm an unpaid store does not render the tip block.

## Operational Notes

- The app settings page now owns checkout copy and preset percentages.
- The checkout editor should only be used to place the block in checkout.
- The extension reads runtime config from the shop metafield `tip_block_settings.config`.
- One-time purchase changes are synchronized through the `app_purchases_one_time/update` webhook.

## Known Windows Note

On Windows, `prisma generate` can fail with a locked query engine DLL. If that happens during local verification, use:

```powershell
npx prisma generate --no-engine
```

## Shopify References

- [About billing for your app](https://shopify.dev/docs/apps/launch/billing)
- [Support one-time app purchases](https://shopify.dev/docs/apps/launch/billing/support-one-time-purchases)
- [Checkout UI extensions](https://shopify.dev/docs/api/checkout-ui-extensions/latest)