import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const routeSource = fs.readFileSync(
  path.resolve("app/routes/app.license.jsx"),
  "utf8",
);

test("license route copy explicitly says the app works for Shopify Plus stores", () => {
  assert.equal(routeSource.includes("This app works for Shopify Plus stores."), true);
});

test("license route renders managed pricing copy instead of one-time billing copy", () => {
  assert.equal(routeSource.includes("Choose a plan"), true);
  assert.equal(routeSource.includes("free trial"), true);
  assert.equal(routeSource.includes("Choose a plan"), true);
  assert.equal(routeSource.includes("One purchase. Ongoing access."), false);
  assert.equal(routeSource.includes("One-time lifetime license"), false);
});

test("license route links to the Shopify hosted pricing page", () => {
  assert.equal(routeSource.includes("pricingUrl"), true);
  assert.equal(routeSource.includes('target="_top"'), true);
});
