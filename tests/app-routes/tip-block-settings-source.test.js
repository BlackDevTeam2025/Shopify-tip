import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const routeSource = fs.readFileSync(
  path.resolve("app/routes/app.settings.tip-block.jsx"),
  "utf8",
);

test("tip block settings route uses JSX prop casing required by Polaris web components", () => {
  assert.equal(routeSource.includes("default-value="), false);
  assert.equal(routeSource.includes("default-checked="), false);
});

test("tip block settings route uses the new fixed-preset admin controls", () => {
  assert.equal(routeSource.includes("Display Format"), false);
  assert.equal(routeSource.includes('name="percentage_display_option"'), false);
  assert.equal(routeSource.includes('name="tip_percentages"'), false);
  assert.equal(routeSource.includes("Checkout Preview"), false);
  assert.equal(routeSource.includes("previewWrap"), false);
  assert.equal(routeSource.includes("Behavior"), true);
  assert.equal(routeSource.includes("Allow custom amount"), true);
  assert.equal(
    routeSource.includes("Hide tip choices until the buyer opts in"),
    true,
  );
  assert.equal(routeSource.includes("tip_variant_id"), true);
});
