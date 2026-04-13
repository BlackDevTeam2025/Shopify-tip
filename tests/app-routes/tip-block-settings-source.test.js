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
  assert.equal(routeSource.includes("Checkout copy"), false);
  assert.equal(routeSource.includes("Checkout Preview"), false);
  assert.equal(routeSource.includes("Live preview"), true);
  assert.equal(routeSource.includes("tip-settings-layout"), true);
  assert.equal(routeSource.includes("tip-settings-preview-column"), true);
  assert.equal(routeSource.includes("Enable tipping"), true);
  assert.equal(routeSource.includes('name="enabled"'), true);
  assert.equal(routeSource.includes('name="heading"'), true);
  assert.equal(routeSource.includes('name="support_text"'), true);
  assert.equal(routeSource.includes('name="support_text_1"'), false);
  assert.equal(routeSource.includes('name="support_text_2"'), false);
  assert.equal(routeSource.includes('name="support_text_3"'), false);
  assert.equal(routeSource.includes('name="cta_label"'), true);
  assert.equal(routeSource.includes('name="thank_you_text"'), true);
  assert.equal(routeSource.includes('name="preset_1"'), true);
  assert.equal(routeSource.includes('name="preset_2"'), true);
  assert.equal(routeSource.includes('name="preset_3"'), true);
  assert.equal(routeSource.includes('name="default_tip_choice"'), true);
  assert.equal(routeSource.includes('name="tip_card_background"'), false);
  assert.equal(routeSource.includes('name="tip_card_border"'), false);
  assert.equal(routeSource.includes('name="tip_card_radius"'), false);
  assert.equal(routeSource.includes('name="apply_checkout_branding"'), false);
  assert.equal(routeSource.includes('name="custom_text_color"'), false);
  assert.equal(routeSource.includes('name="custom_border_color"'), false);
  assert.equal(routeSource.includes("Apply colors to checkout profile"), false);
  assert.equal(routeSource.includes("Support message"), true);
  assert.equal(routeSource.includes("Support message 1"), false);
  assert.equal(routeSource.includes("textarea"), true);
  assert.equal(routeSource.includes("placeholder=\"Show your appreciation\""), true);
  assert.equal(
    routeSource.includes("Support message rotation (seconds)"),
    false,
  );
  assert.equal(routeSource.includes('name="support_rotation_seconds"'), false);
  assert.equal(
    routeSource.includes("Hide tip choices until the buyer opts in"),
    false,
  );
  assert.equal(routeSource.includes("tip_variant_id"), false);
  assert.equal(routeSource.includes("Tip setup ready"), false);
  assert.equal(routeSource.includes("Tip setup needs attention"), false);
  assert.equal(routeSource.includes("Default selected preset"), true);
  assert.equal(routeSource.includes("Interactive simulation only"), true);
  assert.equal(routeSource.includes("PREVIEW_SUBTOTAL"), true);
  assert.equal(
    routeSource.includes("Edit the exact tip content buyers see in checkout."),
    true,
  );
});
