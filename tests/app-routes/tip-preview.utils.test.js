import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_SUPPORT_ROTATION_SECONDS,
  MAX_SUPPORT_ROTATION_SECONDS,
  MIN_SUPPORT_ROTATION_SECONDS,
  PREVIEW_SUBTOTAL,
  buildPreviewPresets,
  calculatePreviewTipAmount,
  getPreviewSupportMessage,
  isPreviewCustomAmountValid,
  normalizePreviewSupportRotationSeconds,
  resolvePreviewDefaultSelection,
} from "../../app/tip-preview.utils.js";

test("preview presets normalize invalid entries and keep three choices", () => {
  const presets = buildPreviewPresets({
    preset_1: "abc",
    preset_2: "17",
    preset_3: "300",
  });

  assert.deepEqual(
    presets.map((preset) => [preset.key, preset.value]),
    [
      ["preset_1", 10],
      ["preset_2", 17],
      ["preset_3", 20],
    ],
  );
});

test("preview uses default selected preset from config", () => {
  const presets = buildPreviewPresets({
    preset_1: "11",
    preset_2: "16",
    preset_3: "22",
  });

  const selected = resolvePreviewDefaultSelection("preset_3", presets);
  assert.equal(selected, "preset_3");
});

test("preview falls back to preset_2 when default is invalid", () => {
  const presets = buildPreviewPresets({
    preset_1: "11",
    preset_2: "16",
    preset_3: "22",
  });

  const selected = resolvePreviewDefaultSelection("invalid_value", presets);
  assert.equal(selected, "preset_2");
});

test("preview calculates percentage tip amount from subtotal $100", () => {
  const presets = buildPreviewPresets({
    preset_1: "10",
    preset_2: "15",
    preset_3: "20",
  });
  const amount = calculatePreviewTipAmount({
    selection: "preset_2",
    customAmount: "",
    presets,
    subtotal: PREVIEW_SUBTOTAL,
  });

  assert.equal(amount, 15);
});

test("preview custom amount validation and tip amount calculation", () => {
  assert.equal(isPreviewCustomAmountValid(""), false);
  assert.equal(isPreviewCustomAmountValid("-1"), false);
  assert.equal(isPreviewCustomAmountValid("12.34"), true);

  const amount = calculatePreviewTipAmount({
    selection: "custom",
    customAmount: "12.34",
    presets: buildPreviewPresets(),
    subtotal: PREVIEW_SUBTOTAL,
  });
  assert.equal(amount, 12.34);
});

test("preview support message picks the first non-empty configured line", () => {
  const message = getPreviewSupportMessage({
    support_text_1: "",
    support_text: "",
    support_text_2: "Tips go directly to staff.",
    support_text_3: "Thanks for supporting.",
  });

  assert.equal(message, "Tips go directly to staff.");
});

test("preview support rotation seconds falls back and clamps safely", () => {
  assert.equal(
    normalizePreviewSupportRotationSeconds(""),
    DEFAULT_SUPPORT_ROTATION_SECONDS,
  );
  assert.equal(
    normalizePreviewSupportRotationSeconds("2"),
    MIN_SUPPORT_ROTATION_SECONDS,
  );
  assert.equal(normalizePreviewSupportRotationSeconds("15"), 15);
  assert.equal(
    normalizePreviewSupportRotationSeconds("999"),
    MAX_SUPPORT_ROTATION_SECONDS,
  );
});
