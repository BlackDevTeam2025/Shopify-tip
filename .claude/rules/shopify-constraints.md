# Shopify Constraints — Cấm Vi Phạm

MANDATORY — Dev agent phải TUÂN THỦ tuyệt đối. Vi phạm = rewrite.

## Checkout Extension Hard Constraints

| # | Constraint | Lý do |
|---|-----------|--------|
| C1 | **KHÔNG custom CSS** — dùng JSON design system tokens | Shopify không cho phép override CSS trong extension sandbox |
| C2 | **KHÔNG DOM manipulation** — không truy cập checkout DOM | Sandbox isolation |
| C3 | **KHÔNG arbitrary HTML** — `<script>`, `<style>`, custom elements cấm | Security |
| C4 | **KHÔNG SVG cho styling** | Không supported |
| C5 | **Bundle ≤ 64 KB** — enforce bằng build check | Shopify hard limit |
| C6 | **Dùng Preact, không React** cho extension code | Shopify extension runtime |
| C7 | **Dùng `applyCartLinesChange`** cho tip mutations | Official Cart API cho extensions |

## Branding Constraints

| Feature | Ai được dùng? | Constraint |
|---------|--------------|-----------|
| Custom brand colors | **Shopify Plus only** | Checkout Branding API |
| Default checkout styling | Tất cả merchants | Dùng design tokens |
| Custom CSS injection | **KHÔNG ai** | Không hỗ trợ |

```tsx
// Ghi rõ trong code:
/*
 * NOTE: Custom brand colors in checkout require Checkout Branding API,
 * available for Shopify Plus merchants only.
 * See: https://shopify.dev/docs/apps/checkout/branding
 *
 * Non-Plus merchants: widget uses default checkout styling.
 * This is a Shopify platform constraint — cannot be worked around.
 */
```

## Billing Constraints

| Constraint | Detail |
|-----------|--------|
| Managed Pricing = Fixed recurring only | Không hỗ trợ usage-based billing |
| Sau khi opt-in Managed Pricing → KHÔNG tạo Billing API recurring charges | Lock-in |
| Test subscriptions KHÔNG convert to paid | Shopify behavior |
| Free plan: Tip block free | Dashboard analytics = premium |

## Tip Product Constraints

| Constraint | Giải pháp |
|-----------|-----------|
| Merchant phải tự tạo tip product/variant | Hướng dẫn trong Settings page + README |
| Variant ID lưu trong metafields | Không hardcode |
| Tip price = 0 (variant), tip amount tính = % of cart | Đây là expected behavior |

## Extension Targets

| Target | Ai được dùng? | Notes |
|--------|--------------|-------|
| `purchase.checkout.block.render` | **Tất cả merchants** | Order summary — primary target |
| `purchase.checkout.information.render` | **Shopify Plus only** | Không dùng trong project này |
| `purchase.checkout.shipping.render` | **Shopify Plus only** | Không dùng |
| `purchase.checkout.payment.render` | **Shopify Plus only** | Không dùng |

→ Project này chỉ dùng **`purchase.checkout.block.render`**

## Error Handling Constraints

Extensions KHÔNG được:
- Crash checkout
- Silent fail (luôn show feedback)
- Gọi arbitrary external APIs (chỉ Shopify APIs)

```tsx
// Phải có error UI
try {
  await applyCartLinesChange({...});
} catch (error) {
  // PHẢI show feedback
  setError('Unable to add tip. Please try again.');
}
```

## Storage Constraints

| Storage | Technology |
|---------|-----------|
| Session | Prisma/SQLite (dev) / PostgreSQL (prod) |
| Settings | Prisma + PostgreSQL |
| Shopify Data | App Metafields (namespace: `tip_block_settings`) |

- Dùng Prisma cho session storage (auto-configured by Shopify CLI)
- Dùng App Metafields để lưu widget config JSON
- Dashboard data lưu trong PostgreSQL via Prisma

## Dev Environment Constraints

| Constraint | Notes |
|-----------|-------|
| Cần dev store (owner/staff account) | Không test được nếu không có |
| Ngrok tunnel cho local dev | Shopify CLI tự tạo |
| Extension preview trong checkout editor | Cần deploy trước khi preview |
| Bundle rebuild mỗi lần code change | `npm run dev` auto-reload |

## When Unsure

Nếu không chắc Shopify có hỗ trợ tính năng gì:

```
// THAY VÌ guess → viết TODO rõ ràng:
/*
 * TODO: Investigate if Shopify supports X
 * - Docs: https://shopify.dev/docs/...
 * - If supported: implement here
 * - If not: document as limitation in README
 */
```

**Điều cấm tuyệt đối:**
- ❌ Implement tính năng không có trong Shopify docs
- ❌ Giả định workaround = "chắc là được"
- ❌ Bỏ qua constraint vì "khách hàng muốn"
