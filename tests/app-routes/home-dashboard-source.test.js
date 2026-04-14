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

test("home route renders only data-first KPI sections", () => {
  assert.equal(routeSource.includes("Home"), true);
  assert.equal(routeSource.includes("TOTAL TIPS ·"), true);
  assert.equal(routeSource.includes("TIP ATTACH RATE ·"), true);
  assert.equal(routeSource.includes("Daily tip revenue"), true);
  assert.equal(routeSource.includes("rangeOptions.map"), true);
  assert.equal(routeSource.includes("selectedWindowDays"), true);
  assert.equal(routeSource.includes("dateTrigger"), true);
  assert.equal(routeSource.includes("buildRangeHref"), true);
  assert.equal(routeSource.includes("hoveredPoint"), true);
  assert.equal(routeSource.includes("onMouseEnter"), true);
});

test("home route removes operational snapshot cards and config summaries", () => {
  assert.equal(routeSource.includes("Search data..."), false);
  assert.equal(routeSource.includes("Store status"), false);
  assert.equal(routeSource.includes("Checkout runtime"), false);
  assert.equal(routeSource.includes("Tip setup"), false);
  assert.equal(routeSource.includes("Current tip settings"), false);
  assert.equal(routeSource.includes("Open Tip Settings"), false);
  assert.equal(routeSource.includes("Permissions granted by Shopify"), false);
  assert.equal(routeSource.includes("App access scopes"), false);
  assert.equal(routeSource.includes("Total tip amount"), false);
  assert.equal(routeSource.includes("License status"), false);
  assert.equal(routeSource.includes("Avg tip per order"), false);
  assert.equal(routeSource.includes("Contributing orders"), false);
  assert.equal(routeSource.includes("Analytics"), false);
  assert.equal(routeSource.includes("Staff Tips"), false);
  assert.equal(routeSource.includes("Payouts"), false);
});
