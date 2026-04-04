# Shopify Plus Dynamic Tip Design

**Date:** 2026-04-04

## Goal

Bring the tipping app back to the original product direction:
- tip choices are based on **order subtotal percentages**
- buyers can optionally enter a **custom tip amount**
- the feature is treated as **Shopify Plus only in production**
- the admin settings page should follow the clean visual direction from the provided mockup

## Product Decision

This version of the product targets:
- **development stores** for local/dev testing
- **Shopify Plus merchants** for production use

Non-Plus production stores are out of scope for this phase.

## Why This Direction

The earlier fixed-amount cart-line approach broadens compatibility, but it breaks the original product requirement. The requested product is:
- percentage-based tipping
- custom tip entry
- tip value derived from checkout subtotal

That pushes the implementation toward a dynamic checkout pipeline instead of fixed preset cart lines.

## User Experience

### Admin settings

The app settings page becomes the source of truth for tip behavior and follows the mockup structure:

- Left marketing column
  - product wordmark / heading
  - large headline
  - short feature bullets
- Right settings card
  - rounded, compact, high-clarity form controls
  - simple labels
  - single-column layout
  - instant visual summary / helper copy

Planned settings:
- `Title`
- `Percentages`
- `Percentages display option`
- `Allow custom amount`
- `Checkout caption`

### Checkout experience

The checkout block remains in the order summary area and uses Shopify-native components.

Buyer flow:
- see the configured title + caption
- choose a preset percentage based on subtotal
- or choose custom amount if enabled
- see the computed amount before applying
- apply / update / remove the tip

Display examples:
- `Add 10% ($8.86) tip`
- `10%`
- `Custom amount`

The exact wording depends on the selected display option from admin settings.

## Runtime Model

### Source of truth

The app-owned shop metafield remains the canonical configuration source for the extension.

The saved config must support:
- `widget_title`
- `tip_percentages`
- `percentage_display_option`
- `custom_amount_enabled`
- `caption1`
- `plus_only`
- optional legacy fields preserved only for migration compatibility

### Percentage calculation

Preset percentages are applied to the current **order subtotal** in checkout.

Rules:
- subtotal source should come from checkout lines / totals available in the extension runtime
- values are rounded to the shop currency minor unit
- zero or negative subtotal means tip options are disabled
- custom amount is entered as an absolute currency amount, not a percentage

### Dynamic tip application

This phase assumes a dynamic implementation path suitable for Plus-only behavior.

High-level design:
1. Checkout UI extension captures the buyer's tip selection.
2. The selection is stored in checkout-accessible state.
3. A dynamic pricing layer applies the resulting tip amount to checkout.

The implementation should be structured so the UI layer and the pricing layer are separated cleanly.

## Store Eligibility

### Supported
- development stores for testing
- Shopify Plus stores in production

### Unsupported for this phase
- non-Plus production stores

Behavior on unsupported stores:
- admin app should clearly indicate that dynamic subtotal-based tipping requires Shopify Plus
- checkout runtime should fail closed and avoid rendering misleading controls

## Admin UI Design Direction

The settings page should borrow the mockup's visual system while staying compatible with the embedded Shopify app environment.

Design goals:
- softer layout with more whitespace
- stronger typography hierarchy
- rounded inputs/cards
- lightweight marketing panel on the left
- clean settings card on the right
- clear separation between feature explanation and editable fields

The admin page does not need to mimic the mockup pixel-for-pixel, but it should clearly feel like the same design language.

## Migration Strategy

The repo currently contains a fixed-amount implementation path. This needs to be migrated back toward percentage semantics.

Migration steps:
- preserve existing config loading logic
- reinterpret `tip_percentages` as percentage values again
- introduce `percentage_display_option`
- keep legacy fields readable so saved stores do not hard-break
- remove fixed-amount-specific copy from admin and checkout

## Error Handling

### Admin
- invalid percentage input should show a clear validation error
- unsupported display option values should fall back safely

### Checkout
- unsupported store / unsupported runtime => hide or disable block with clear messaging
- subtotal unavailable => disable apply action
- pricing layer failure => show concise error and avoid stale success state

## Testing Strategy

Test coverage should include:
- config parsing and migration
- percentage parsing
- subtotal-based amount calculation
- display label formatting
- checkout interaction state transitions
- unsupported-store gating
- admin form data handling and defaults

## Open Constraint

This design intentionally treats dynamic subtotal-based tipping as a **Plus-only production feature**. If product strategy later changes to support all merchants, the architecture should pivot back to a fixed-amount model or another non-dynamic fallback.
