import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const routeSource = fs.readFileSync(
  "D:/khanh-dev/app/routes/app.settings.tip-block.jsx",
  "utf8",
);

test("tip block settings route uses JSX prop casing required by Polaris web components", () => {
  assert.equal(routeSource.includes("default-value="), false);
  assert.equal(routeSource.includes("default-checked="), false);
  assert.equal(routeSource.includes("defaultValue="), true);
  assert.equal(routeSource.includes("defaultChecked="), true);
});

test("tip block settings route includes dynamic percentage settings controls", () => {
  assert.equal(routeSource.includes("Flexible"), true);
  assert.equal(routeSource.includes("Tipping Configuration"), true);
  assert.equal(routeSource.includes("Preset Percentages"), true);
  assert.equal(routeSource.includes('name="percentage_display_option"'), true);
  assert.equal(routeSource.includes("Dynamic pricing layer"), true);
  assert.equal(routeSource.includes("Runtime Preview"), true);
});
