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

test("license route renders the detected plan for ineligible shops", () => {
  assert.equal(routeSource.includes("planDisplayName"), true);
  assert.equal(routeSource.includes("Detected current plan"), true);
});
