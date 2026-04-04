# Checkout Extension Rules

MANDATORY — Dev agent phải tuân thủ khi implement Checkout UI Extension.

## Extension Entry (BẮT BUỘC)

Extensions dùng **Preact**, không phải React:

```tsx
import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useState} from 'preact/hooks';

export default async () => {
  render(<TipBlockExtension />, document.body);
};
```

**Điều cấm:**
- ❌ `import React from 'react'`
- ❌ `import {useState} from 'react'`
- ❌ Dùng React hooks API

## Extension Config (`shopify.extension.toml`)

```toml
api_version = "2025-10"

[[extensions]]
name = "checkout-tip-block"
type = "ui_extension"

[[extensions.targeting]]
module = "./src/Checkout.jsx"
target = "purchase.checkout.block.render"

[extensions.capabilities]
api_access = true   # Bật để query Storefront API nếu cần
```

## Cart API (Dùng Đúng API)

```tsx
import {applyCartLinesChange} from '@shopify/ui-extensions/checkout';

// ADD tip
await applyCartLinesChange({
  type: 'addCartLine',
  merchandiseId: variantId,
  quantity: 1,
});

// UPDATE tip
await applyCartLinesChange({
  type: 'updateCartLine',
  id: lineId,
  quantity: 1,
});

// REMOVE tip
await applyCartLinesChange({
  type: 'removeCartLine',
  id: lineId,
});
```

**Điều cấm:**
- ❌ Không dùng Checkout API trực tiếp
- ❌ Không dùng Storefront API (trừ khi `api_access = true`)
- ❌ Không DOM manipulation

## Available Components

### Layout
| Component | Purpose |
|-----------|---------|
| `s-stack` | Primary layout — direction, spacing, alignment |
| `s-grid` | Grid layout |

### Typography
| Component | Purpose |
|-----------|---------|
| `s-heading` | Section headings (level prop) |
| `s-text` | Body text |
| `s-banner` | Inline banners (info, critical, success, warning) |

### Interactive
| Component | Purpose |
|-----------|---------|
| `s-button` | CTA — onClick handler |
| `s-choice-list` | Radio/checkbox groups (DÙNG cho tip options) |
| `s-checkbox` | Toggle custom amount |
| `s-text-field` | Custom amount input |
| `s-select` | Dropdown |
| `s-link` | Anchor links |

### Structural
| Component | Purpose |
|-----------|---------|
| `s-form` | Wraps inputs với labels + error states |
| `s-divider` | Visual separator |
| `s-money` | Currency-aware money display |
| `s-spinner` | Loading indicator |
| `s-skeleton-*` | Loading skeletons |

## Styling (BẮT BUỘC)

Extensions dùng **JSON design system tokens** — KHÔNG custom CSS:

```tsx
// ĐÚNG — dùng design tokens
<s-stack direction="vertical" spacing="base">
  <s-heading level={2}>Add tip</s-heading>
  <s-button>Add tip</s-button>
</s-stack>

// SAI — KHÔNG BAO GIỜ
const styles = { color: 'red', fontSize: '16px' };
<div style={styles}>...</div>
```

### Design Tokens
```tsx
// Colors (scheme light)
colors: { accent, background, text, primaryButton }

// Spacing
spacing: "tight" | "base" | "loose" | "extra-loose"

// Corner Radius
cornerRadius: "none" | "base" | "large" | "full"
```

**Điều cấm:**
- ❌ `<style>` tags
- ❌ `<script>` tags
- ❌ Custom CSS files
- ❌ SVG elements cho styling
- ❌ Inline styles không phải design tokens

## Bundle Size

Extension bundle phải ≤ **64 KB** (gzip):

```bash
cd extensions/checkout-tip-block
npm run build
# Check dist/ size
```

Nếu over limit: tree-shake imports, remove unused code.

## Tip Flow (Logic Bắt Buộc)

```
User selects tip → Click "Add tip"
  → Check: tip variant ID configured?
    → NO: Show banner "Tip not configured"
    → YES:
      → Check: tip already in cart?
        → YES: UPDATE existing line (quantity = 1, new variant)
        → NO: ADD new line
  → On success: show confirmation
  → On error: show error banner

User selects "None"
  → REMOVE tip line from cart
```

### Duplicate Tip Prevention
```tsx
const existingTipLine = shopify.cart.lines.find(
  line => line.merchandise?.id === tipVariantId
);

if (existingTipLine) {
  await applyCartLinesChange({ type: 'updateCartLine', ... });
} else {
  await applyCartLinesChange({ type: 'addCartLine', ... });
}
```

## Settings Từ Metafields

```tsx
// Đọc từ metafields
const settings = await shopify.checkoutSettings([
  'tip_block_settings.caption1',
  'tip_block_settings.caption2',
  'tip_block_settings.caption3',
  'tip_block_settings.defaultTipPercent',
  'tip_block_settings.enableCustomAmount',
  'tip_block_settings.tipProductVariantId',
]);

// Fallback defaults
const captions = [
  settings['tip_block_settings.caption1'] || 'Buy our team coffee',
  // ...
];
```

## Error Handling

```tsx
// Error state UI
{somethingWentWrong && (
  <s-banner kind="critical">
    Unable to add tip. Please try again.
  </s-banner>
)}
```

## Plus-Only Constraint (Ghi rõ)

```tsx
// NOTE: Custom brand colors require Checkout Branding API,
// available for Shopify Plus merchants only.
// See: https://shopify.dev/docs/apps/checkout/branding
```
