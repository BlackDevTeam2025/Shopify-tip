# Shopify Dev Rules

MANDATORY — Dev agent phải tuân thủ trước khi viết bất kỳ code nào cho project này.

## Stack Bắt Buộc

| Layer | Technology |
|-------|-----------|
| App Shell | React Router template (`npm init @shopify/app@latest --template react`) |
| Checkout Extension | Preact + `@shopify/ui-extensions/preact` (KHÔNG dùng React) |
| Admin UI | Polaris components (`@shopify/polaris`) |
| Billing | Shopify Managed Pricing (`@shopify/shopify-api`) |
| Settings Storage | Prisma/SQLite (production: PostgreSQL) |
| Dashboard Data | Prisma + GraphQL Admin API |
| Bundle Tool | Vite (default Shopify CLI) |

## Commands Bắt Buộc

```bash
# Cài Shopify CLI
npm install -g @shopify/cli

# Scaffold app (chạy TRONG thư mục D:\shopify)
shopify app init --template react --name "support-tip-block"

# Generate checkout extension
cd support-tip-block
shopify app generate extension --template checkout_ui --name checkout-tip-block

# Dev
npm run dev

# Extension dev only
cd extensions/checkout-tip-block && npm run dev

# Build
npm run build

# Deploy
shopify app deploy
```

## Required API Scopes

Scopes phải khai báo trong `shopify.app.toml`:

```toml
scopes = "read_orders, read_products, manage_checkouts"
```

## File Structure Bắt Buộc

```
shopify-app/               # Tên app
├── app/                   # React Router app (embedded admin)
│   ├── routes/
│   │   ├── app.home.jsx               # Dashboard
│   │   ├── app.settings.tip-block.jsx  # Settings page
│   │   └── app.billing.jsx            # Billing page
│   ├── components/       # Polaris UI components (tổ chức theo feature)
│   ├── services/
│   │   └── TipStatsService.server.js   # Analytics service layer
│   ├── lib/
│   │   └── billing.server.js           # Billing utilities
│   └── shopify.server.js  # Shopify auth (auto-gen)
├── extensions/
│   └── checkout-tip-block/
│       ├── src/Checkout.jsx            # Extension entry (Preact)
│       └── shopify.extension.toml       # Extension config
├── shopify.app.toml      # CLI config + scopes
└── package.json          # Workspace root
```

## Bắt Đầu Mỗi Phase

1. Đọc `.gsd/phases/phase-X.md` đầy đủ trước khi viết code
2. Tạo task list từ phase file
3. Implement theo thứ tự task
4. Sau mỗi task: verify → commit nếu pass
5. Hết phase: verify toàn bộ phase → commit

## Immutability (Áp dụng từ global rules)

Extension state phải dùng Preact signals hoặc `useState` — không mutate objects trực tiếp.

```tsx
// SAI
const cart = shopify.cart;
cart.lines.push(newLine);

// ĐÚNG
const [lines, setLines] = useState([]);
setLines([...lines, newLine]);
```
