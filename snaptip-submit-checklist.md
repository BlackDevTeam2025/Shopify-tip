# SnapTip Submit Checklist

## Production config

- Confirm [shopify.app.snaptip.toml](/Users/blackpham/Documents/Shopify-tip/shopify.app.snaptip.toml) uses `https://snaptip.tech`
- Confirm redirect URL is `https://snaptip.tech/auth/callback`
- Keep production scopes limited to:
  - `read_orders`
  - `read_publications`
  - `write_cart_transforms`
  - `write_products`
  - `write_publications`
- Confirm production webhooks include:
  - `app/uninstalled`
  - `app_subscriptions/update`
  - `app/scopes_update`
  - `customers/data_request`
  - `customers/redact`
  - `shop/redact`

## Deploy sequence

1. Run `shopify app deploy --config shopify.app.snaptip.toml`
2. Deploy production app code to `https://snaptip.tech`
3. Reinstall the app on a clean store
4. Verify auth lands inside the embedded app without loops
5. Verify managed pricing opens and returns to the app

## Partner Dashboard

- Complete listing content in English
- Select app capabilities that match the app behavior
- Re-run automated checks after deploy
- Because the app still requests `read_orders`, complete the protected customer data declaration
- Describe the use of protected data as tip metrics and dashboard reporting
- Do not leave the app marked as “Doesn't need access to protected customer data” while `read_orders` remains in scopes

## Reviewer checklist

- Provide a clean test store
- Provide install and re-auth instructions
- Provide pricing approval steps
- Provide one checkout walkthrough showing tip apply, update, and removal
- Provide one dashboard walkthrough showing the metrics cards and trend chart

## Quality gate

- Run `npm run build`
- Run `npm test`
- Re-run Shopify automated checks
- Confirm `Home` opens cleanly
- Confirm `Setting` opens and saves cleanly
