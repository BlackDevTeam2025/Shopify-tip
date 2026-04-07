import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const routeSource = fs.readFileSync(
  path.resolve("app/routes/app._index.jsx"),
  "utf8",
);

test("home route removes the Shopify template demo content", () => {
  assert.equal(routeSource.includes("Congrats on creating a new Shopify app"), false);
  assert.equal(routeSource.includes("Generate a product"), false);
  assert.equal(routeSource.includes("metaobject"), false);
  assert.equal(routeSource.includes("fetcher.submit"), false);
  assert.equal(routeSource.includes("Search data..."), false);
  assert.equal(routeSource.includes("The dashboard tracks app readiness"), false);
});

test("home route renders the operational dashboard sections", () => {
  assert.equal(routeSource.includes("Home"), true);
  assert.equal(routeSource.includes("Store status"), true);
  assert.equal(routeSource.includes("License status"), true);
  assert.equal(routeSource.includes("Checkout runtime"), true);
  assert.equal(routeSource.includes("Current tip settings"), true);
  assert.equal(routeSource.includes("Open Tip Settings"), true);
});

test("home route keeps the simplified operational content and avoids fake dashboard chrome", () => {
  assert.equal(routeSource.includes("Search data..."), false);
  assert.equal(routeSource.includes("Permissions granted by Shopify"), false);
  assert.equal(routeSource.includes("App access scopes"), false);
  assert.equal(routeSource.includes("Analytics"), false);
  assert.equal(routeSource.includes("Staff Tips"), false);
  assert.equal(routeSource.includes("Payouts"), false);
});
