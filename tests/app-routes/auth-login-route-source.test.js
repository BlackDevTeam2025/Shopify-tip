import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const routeSource = fs.readFileSync(
  path.resolve("app/routes/auth.login/route.jsx"),
  "utf8",
);

test("auth login route infers the shop from the Shopify admin referer when shop is missing", () => {
  assert.equal(
    routeSource.includes("function inferShopFromReferer(request)"),
    true,
  );
  assert.equal(routeSource.includes('request.headers.get("referer")'), true);
  assert.equal(routeSource.includes("/^\\/store\\/([^/]+)\\//"), true);
  assert.equal(
    routeSource.includes('url.searchParams.set("shop", inferredShop)'),
    true,
  );
});
