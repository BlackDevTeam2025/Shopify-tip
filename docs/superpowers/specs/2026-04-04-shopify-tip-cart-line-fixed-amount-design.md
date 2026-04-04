# Shopify Tip Cart-Line Fixed Amount Design

## Goal

Change the checkout tip experience from percentage-based cart attributes to fixed-amount tip presets that add a real cart line, so the selected tip appears in the order summary on the right side of checkout.

## Product Decisions

- Remove the `Next message` button
- Show only one caption in checkout, using `caption1`
- Reinterpret `tip_percentages` as fixed preset amounts for now
- Keep `tip_variant_id` as the variant that represents the tip product
- Add or update a real cart line when a buyer selects a tip
- Keep `No thanks` as the way to remove an applied tip

## Why This Change Is Needed

The current extension only writes checkout attributes. Attributes can store metadata, but they do not create a merchandise line item, so nothing appears in the order summary.

A real summary entry requires `applyCartLinesChange` with a real variant.

## Runtime Model

### Preset amounts

`tip_percentages` now means comma-separated fixed amounts in shop currency units, for example:

- `50000,100000,200000`
- `5,10,20`

### Tip variant

`tip_variant_id` must point to a product variant used as the tip SKU.

Assumption for v1:

- the variant price is the base unit amount
- the selected preset amount must divide evenly by the variant price
- quantity = selected amount / base unit price

If the amount does not divide evenly, the extension should show a clear error and avoid creating an incorrect cart line.

## Checkout Behavior

When the buyer selects a tip and clicks add:

1. Read the selected fixed amount
2. Find any existing tip cart line for the configured variant
3. Calculate the required quantity from the variant price
4. Add the line if it does not exist
5. Update the line quantity if it already exists
6. Remove any attribute-only success language that implies the tip is saved when no line exists

When the buyer selects `No thanks`:

1. Remove the existing tip line for the configured variant if present
2. Clear any tip-related attributes still used by legacy flow

## Settings Page

The admin settings page should keep the same field layout for now, but helper text must explain that presets are fixed amounts, not percentages.

## Safety Rules

- If `tip_variant_id` is empty, show a clear error in checkout
- If the tip variant cannot be matched to a cart line price model, show a clear error
- If checkout instructions disallow line changes, show a clear error
- Do not silently fall back to attribute-only saving for this flow
