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

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Shopify-tip** (406 symbols, 751 relationships, 30 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/Shopify-tip/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Shopify-tip/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Shopify-tip/clusters` | All functional areas |
| `gitnexus://repo/Shopify-tip/processes` | All execution flows |
| `gitnexus://repo/Shopify-tip/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
