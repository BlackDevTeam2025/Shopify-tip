# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Shopify embedded app scaffold based on `shopify-app-template-react-router`. Currently a clean scaffold — the Tipping app described in project rules is planned but not yet implemented.

## Commands

```bash
npm run dev          # Full app dev (includes extension rebuild + tunnel)
npm run build        # Build app + extensions for production
npm run lint         # ESLint (airbnb-base + TypeScript rules)
npm run typecheck    # React Router typegen + tsc --noEmit
npm run setup        # Prisma generate + migrate deploy
npm run deploy       # Deploy to Shopify (requires Partner dashboard)
npx prisma studio    # Open Prisma GUI (http://localhost:5555)
```

> **Windows ARM64:** If Prisma fails with `query_engine-windows.dll.node`, set `PRISMA_CLIENT_ENGINE_TYPE=binary` in `.env`.

## Architecture

```text
khanh-dev/
├── app/                          # React Router app (Node.js host)
│   ├── root.jsx                  # App shell + Shopify App Bridge provider
│   ├── shopify.server.js         # Shopify auth client + session helpers
│   ├── db.server.js              # Prisma client singleton
│   ├── entry.server.jsx          # SSR entry
│   ├── routes.js                 # Flat-file route manifest (React Router v7)
│   └── routes/
│       ├── app._index.jsx         # Redirect → /app
│       ├── app.jsx                # Layout: App Bridge frame + nav
│       ├── auth.login/route.jsx   # GET /auth/login (Shopify OAuth initiation)
│       └── webhooks.*.jsx         # Webhook handlers (HMAC-verified)
├── extensions/
│   └── checkout-ui/              # Checkout UI Extension (Preact, deployed separately)
│       └── src/Checkout.jsx       # Extension entry — deploys via Shopify CLI
├── prisma/
│   └── schema.prisma             # SQLite dev by default
├── shopify.app.toml              # Shopify CLI config + webhooks + scopes
└── vite.config.js                # Vite + React Router plugin + HMR config
```

**MCP server:** `shopify-dev-mcp` is configured in `.mcp.json` and `.cursor/mcp.json`. This enables Shopify API introspection, GraphQL validation, and component validation via the Shopify Dev MCP tools.

## Key Patterns

### Shopify auth (server-only)

Use the `shopify` object exported from `app/shopify.server.js`. Load it in server-side `loader`/`action` functions — never in client code.

```js
export async function loader({ request }) {
  const { admin } = await shopify.authenticate.admin(request);
  const response = await admin.graphql(`query { ... }`);
  return json(await response.json());
}
```

### Embedded app navigation

- Use `<Link>` from `react-router` or `@shopify/polaris` — **not** `<a>` tags.
- Use `redirect` returned from `shopify.authenticate.admin` — **not** `react-router`'s redirect.
- Use `useSubmit` from `react-router` for form submissions.

### Webhooks

Webhooks are declared in `shopify.app.toml` (app-specific). Shopify CLI auto-syncs on deploy. Do NOT use shop-specific webhook subscriptions — they require re-authentication to update.

### Extensions

Extensions are built and deployed separately from the app. Run `npm run dev` from the repo root — the CLI handles extension rebuilding during development.

### Database

- Dev: SQLite at `prisma/dev.sqlite` (Prisma manages it).
- Prod: PostgreSQL — set `DATABASE_URL` env var with a `postgresql://` URI.
- Prisma client singleton is exported from `app/db.server.js` — import from there, never instantiate directly.

## Shopify Constraints (Non-negotiable)

| # | Rule | Reason |
| - | - | - |
| C1 | No custom CSS in extensions | Sandbox isolation — use design tokens only |
| C2 | No DOM access in extensions | Sandbox isolation |
| C3 | Extension bundle ≤ 64 KB | Shopify hard limit |
| C4 | Extension uses **Preact**, not React | Shopify extension runtime |
| C5 | Use `applyCartLinesChange` for cart mutations | Official Cart API for extensions |
| C6 | `purchase.checkout.block.render` for all merchants | Other targets are Plus-only |
| C7 | Custom brand colors via Checkout Branding API | **Plus-only only** — document this limitation |

## TypeScript

This project uses JavaScript with JSDoc types (ESLint `no-undef` + TypeScript parser). Strict TypeScript is not enforced. Enable `npm run typecheck` in CI to catch errors.

## Linting

ESLint config: `.eslintrc.cjs` — extends `airbnb-base`, `plugin:@typescript-eslint/recommended`, `plugin:react/recommended`, `plugin:jsx-a11y/recommended`. JSX files must import React (even if unused) to satisfy the rules.

## Known Gotchas

- **"table Session does not exist"** → Run `npm run setup`.
- **"nbf claim timestamp check failed"** → Machine clock out of sync; enable auto time sync.
- **"Unable to require query_engine-windows.dll.node"** → Set `PRISMA_CLIENT_ENGINE_TYPE=binary`.
- **Streaming during local dev** → Cloudflare tunnel waits for full response. Use localhost-based dev to test streaming.
