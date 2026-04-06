import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { getTipRuntimeConfigFromAppMetafields } from "./runtime-config";
import {
  FIXED_TIP_PERCENTAGES,
  calculateSubtotalTipAmount,
  formatPercentageTipLabel,
  isValidCustomAmount,
} from "./tip-percentages";

const TIP_SOURCE_ATTRIBUTE = "_tip_source";
const TIP_MODE_ATTRIBUTE = "_tip_mode";
const TIP_PERCENTAGE_ATTRIBUTE = "_tip_percentage";
const TIP_AMOUNT_ATTRIBUTE = "_tip_amount";
const TIP_LABEL_ATTRIBUTE = "_tip_label";
const TIP_SOURCE_VALUE = "dynamic_subtotal";
const DEFAULT_SELECTION = String(
  FIXED_TIP_PERCENTAGES[1] ?? FIXED_TIP_PERCENTAGES[0] ?? "18",
);

function formatCurrency(amount, currencyCode = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

function findTipLine(lines = [], tipVariantId = "") {
  return lines.find((line) => line?.merchandise?.id === tipVariantId) ?? null;
}

function getCheckoutSubtotal(lines = [], tipVariantId = "") {
  return lines.reduce((total, line) => {
    if (tipVariantId && line?.merchandise?.id === tipVariantId) {
      return total;
    }

    const amount = Number.parseFloat(line?.cost?.totalAmount?.amount ?? "0");
    return Number.isFinite(amount) ? total + amount : total;
  }, 0);
}

function buildTipLineAttributes({ mode, percentage, amount, label }) {
  const attributes = [
    { key: TIP_SOURCE_ATTRIBUTE, value: TIP_SOURCE_VALUE },
    { key: TIP_MODE_ATTRIBUTE, value: mode },
    { key: TIP_AMOUNT_ATTRIBUTE, value: String(amount) },
    { key: TIP_LABEL_ATTRIBUTE, value: label },
  ];

  if (percentage) {
    attributes.push({
      key: TIP_PERCENTAGE_ATTRIBUTE,
      value: String(percentage),
    });
  }

  return attributes;
}

function buildAddTipLineChange({ merchandiseId, attributes }) {
  return {
    type: "addCartLine",
    merchandiseId,
    quantity: 1,
    attributes,
  };
}

function buildUpdateTipLineChange({ id, attributes }) {
  return {
    type: "updateCartLine",
    id,
    quantity: 1,
    attributes,
  };
}

function buildRemoveTipLineChange({ id, quantity }) {
  return {
    type: "removeCartLine",
    id,
    quantity,
  };
}

function getAttributeValue(attributes = [], key) {
  return attributes.find((attribute) => attribute?.key === key)?.value ?? "";
}

function canAddTipLine(instructions) {
  return instructions?.lines?.canAddCartLine !== false;
}

function canUpdateTipLine(instructions) {
  return instructions?.lines?.canUpdateCartLine !== false;
}

function canRemoveTipLine(instructions) {
  return instructions?.lines?.canRemoveCartLine !== false;
}

function getInitialSelection({
  existingTipLine,
  hideUntilOptIn,
  customAmountEnabled,
}) {
  const savedMode = getAttributeValue(
    existingTipLine?.attributes,
    TIP_MODE_ATTRIBUTE,
  );
  const savedPercentage = getAttributeValue(
    existingTipLine?.attributes,
    TIP_PERCENTAGE_ATTRIBUTE,
  );
  const savedAmount = getAttributeValue(
    existingTipLine?.attributes,
    TIP_AMOUNT_ATTRIBUTE,
  );

  if (
    savedMode === "custom" &&
    customAmountEnabled &&
    isValidCustomAmount(savedAmount)
  ) {
    return {
      selectedTip: "custom",
      customAmount: savedAmount,
      optionsExpanded: true,
    };
  }

  if (
    savedMode === "percentage" &&
    FIXED_TIP_PERCENTAGES.includes(Number(savedPercentage))
  ) {
    return {
      selectedTip: savedPercentage,
      customAmount: "",
      optionsExpanded: true,
    };
  }

  return {
    selectedTip: DEFAULT_SELECTION,
    customAmount: "",
    optionsExpanded: !hideUntilOptIn,
  };
}

function buildTipChoices({ subtotal, currencyCode, customAmountEnabled }) {
  const fixedChoices = FIXED_TIP_PERCENTAGES.map((percentage) => ({
    key: String(percentage),
    primaryLabel: `${percentage}%`,
    secondaryLabel: formatCurrency(
      calculateSubtotalTipAmount({ subtotal, percentage }),
      currencyCode,
    ),
  }));

  if (customAmountEnabled) {
    fixedChoices.push({
      key: "custom",
      primaryLabel: "Custom",
      secondaryLabel: "Choose amount",
    });
  }

  fixedChoices.push({
    key: "none",
    primaryLabel: "None",
    secondaryLabel: formatCurrency(0, currencyCode),
  });

  return fixedChoices;
}

export default async () => {
  render(<TipBlockExtension />, document.body);
};

function TipBlockExtension() {
  const settings = getTipRuntimeConfigFromAppMetafields(
    shopify.appMetafields.value,
  );

  if (!settings?.enabled) {
    return null;
  }

  const tipVariantId = settings.tip_variant_id?.trim();
  const lines = shopify.lines?.value ?? [];
  const instructions = shopify.instructions?.value;
  const applyCartLinesChange = shopify.applyCartLinesChange;
  const currencyCode = lines?.[0]?.cost?.totalAmount?.currencyCode ?? "USD";
  const existingTipLine = findTipLine(lines, tipVariantId);
  const subtotal = getCheckoutSubtotal(lines, tipVariantId);
  const initialSelection = getInitialSelection({
    existingTipLine,
    hideUntilOptIn: settings.hide_until_opt_in,
    customAmountEnabled: settings.custom_amount_enabled,
  });
  const [selectedTip, setSelectedTip] = useState(initialSelection.selectedTip);
  const [customAmount, setCustomAmount] = useState(
    initialSelection.customAmount,
  );
  const [optionsExpanded, setOptionsExpanded] = useState(
    initialSelection.optionsExpanded,
  );
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const choices = useMemo(
    () =>
      buildTipChoices({
        subtotal,
        currencyCode,
        customAmountEnabled: settings.custom_amount_enabled,
      }),
    [currencyCode, settings.custom_amount_enabled, subtotal],
  );

  useEffect(() => {
    const nextSelection = getInitialSelection({
      existingTipLine,
      hideUntilOptIn: settings.hide_until_opt_in,
      customAmountEnabled: settings.custom_amount_enabled,
    });

    setSelectedTip(nextSelection.selectedTip);
    setCustomAmount(nextSelection.customAmount);
    setOptionsExpanded(nextSelection.optionsExpanded);
  }, [
    existingTipLine?.id,
    getAttributeValue(existingTipLine?.attributes, TIP_MODE_ATTRIBUTE),
    getAttributeValue(existingTipLine?.attributes, TIP_PERCENTAGE_ATTRIBUTE),
    getAttributeValue(existingTipLine?.attributes, TIP_AMOUNT_ATTRIBUTE),
    settings.hide_until_opt_in,
    settings.custom_amount_enabled,
  ]);

  const isCustomSelected = selectedTip === "custom";
  const isNoneSelected = selectedTip === "none";
  const isCustomAmountValid =
    !isCustomSelected || isValidCustomAmount(customAmount);
  const tipAmount = useMemo(() => {
    if (isNoneSelected) {
      return 0;
    }

    if (isCustomSelected) {
      return isCustomAmountValid ? Number.parseFloat(customAmount) : 0;
    }

    return calculateSubtotalTipAmount({
      subtotal,
      percentage: Number(selectedTip),
    });
  }, [
    customAmount,
    isCustomAmountValid,
    isCustomSelected,
    isNoneSelected,
    selectedTip,
    subtotal,
  ]);

  const selectionLabel = isCustomSelected
    ? `Custom tip (${formatCurrency(tipAmount, currencyCode)})`
    : isNoneSelected
      ? "No tip"
      : formatPercentageTipLabel({
          percentage: Number(selectedTip),
          amount: tipAmount,
          currencyCode,
        });

  const primaryActionLabel =
    isNoneSelected && existingTipLine ? "Remove tip" : settings.cta_label;
  const disablePrimaryAction =
    isLoading || (isCustomSelected && !isCustomAmountValid);

  const handleApplyTip = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!settings.transform_active) {
      setErrorMessage(
        "Dynamic pricing is not ready for this store yet. Open the app settings page once to let Shopify enable the Cart Transform, then refresh checkout.",
      );
      return;
    }

    if (!tipVariantId) {
      setErrorMessage("Tip product variant is not configured yet.");
      return;
    }

    if (subtotal <= 0 && !isCustomSelected) {
      setErrorMessage(
        "Tip percentages need a positive subtotal before they can be applied.",
      );
      return;
    }

    if (isCustomSelected && !isCustomAmountValid) {
      setErrorMessage("Custom amount must be greater than 0.");
      return;
    }

    if (typeof applyCartLinesChange !== "function") {
      setErrorMessage("Checkout cannot update tip lines in this payment flow.");
      return;
    }

    if (existingTipLine && !canUpdateTipLine(instructions)) {
      setErrorMessage(
        "Checkout cannot update the tip line in this payment flow.",
      );
      return;
    }

    if (!existingTipLine && !canAddTipLine(instructions)) {
      setErrorMessage("Checkout cannot add a tip line in this payment flow.");
      return;
    }

    const attributes = buildTipLineAttributes({
      mode: isCustomSelected ? "custom" : "percentage",
      percentage: isCustomSelected ? null : Number(selectedTip),
      amount: tipAmount,
      label: selectionLabel,
    });

    setIsLoading(true);
    try {
      const change = existingTipLine
        ? buildUpdateTipLineChange({ id: existingTipLine.id, attributes })
        : buildAddTipLineChange({ merchandiseId: tipVariantId, attributes });
      const result = await applyCartLinesChange(change);

      if (result?.type === "error") {
        throw new Error(result.message ?? "Unknown error");
      }

      setSuccessMessage(
        "Tip line saved. Shopify Plus pricing should update automatically.",
      );
      setOptionsExpanded(true);
    } catch (error) {
      setErrorMessage(
        `Unable to apply tip: ${error?.message ?? "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTip = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!existingTipLine) {
      if (settings.hide_until_opt_in) {
        setOptionsExpanded(false);
      }
      setSuccessMessage("Tip removed from the checkout.");
      return;
    }

    if (
      !canRemoveTipLine(instructions) ||
      typeof applyCartLinesChange !== "function"
    ) {
      setErrorMessage("Checkout cannot remove tip lines in this payment flow.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await applyCartLinesChange(
        buildRemoveTipLineChange({
          id: existingTipLine.id,
          quantity: existingTipLine.quantity,
        }),
      );

      if (result?.type === "error") {
        throw new Error(result.message ?? "Unknown error");
      }

      setSelectedTip(DEFAULT_SELECTION);
      setCustomAmount("");
      setOptionsExpanded(!settings.hide_until_opt_in);
      setSuccessMessage("Tip removed from the checkout.");
    } catch (error) {
      setErrorMessage(
        `Unable to remove tip: ${error?.message ?? "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (isNoneSelected) {
      await handleRemoveTip();
      return;
    }

    await handleApplyTip();
  };

  if (!optionsExpanded) {
    return (
      <s-grid
        background="subdued"
        border="base"
        borderRadius="large-100"
        padding="base"
        gap="base"
      >
        <s-stack gap="small" inline-size="100%">
          <s-text type="strong">{settings.heading}</s-text>
          <s-text type="small" tone="subdued">
            {settings.support_text}
          </s-text>
        </s-stack>
        <s-button
          variant="primary"
          inlineSize="fill"
          onClick={() => {
            setOptionsExpanded(true);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
        >
          {settings.cta_label}
        </s-button>
        {errorMessage && <s-banner tone="critical">{errorMessage}</s-banner>}
        {successMessage && <s-banner tone="success">{successMessage}</s-banner>}
      </s-grid>
    );
  }

  return (
    <s-grid
      background="subdued"
      border="base"
      borderRadius="large-100"
      padding="base"
      gap="base"
    >
      <s-stack gap="small" inline-size="100%">
        <s-text type="strong">{settings.heading}</s-text>
        <s-text type="small" tone="subdued">
          {settings.support_text}
        </s-text>
      </s-stack>

      <s-grid gridTemplateColumns="1fr 1fr" gap="small">
        {choices.map((choice) => {
          const isSelected = selectedTip === choice.key;

          return (
            <s-press-button
              key={choice.key}
              inlineSize="fill"
              pressed={isSelected}
              onClick={() => {
                setSelectedTip(choice.key);
                setErrorMessage(null);
                setSuccessMessage(null);

                if (choice.key !== "custom") {
                  setCustomAmount("");
                }
              }}
            >
              <s-stack gap="extra-tight" inline-size="100%">
                <s-text type="strong">{choice.primaryLabel}</s-text>
                <s-text type="small" tone="subdued">
                  {choice.secondaryLabel}
                </s-text>
              </s-stack>
            </s-press-button>
          );
        })}
      </s-grid>

      {isCustomSelected && settings.custom_amount_enabled && (
        <s-grid
          gridTemplateColumns="auto 1fr auto"
          gap="small"
          alignItems="center"
        >
          <s-box padding="small" border="base" borderRadius="base">
            <s-text type="strong">-</s-text>
          </s-box>
          <s-text-field
            name="custom-amount"
            value={customAmount}
            onChange={(event) => {
              setCustomAmount(event.currentTarget.value);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            label="Custom amount"
          />
          <s-box padding="small" border="base" borderRadius="base">
            <s-text type="strong">+</s-text>
          </s-box>
        </s-grid>
      )}

      {/*
        Temporary hide for the tip/subtotal summary block.
        Keep this block in place so it can be restored without rebuilding the logic.
      {!isNoneSelected && tipAmount > 0 && (
        <s-stack gap="small" inline-size="100%">
          <s-text type="small" tone="subdued">
            Estimated tip: {formatCurrency(tipAmount, currencyCode)}
          </s-text>
          <s-text type="small" tone="subdued">
            Subtotal: {formatCurrency(subtotal, currencyCode)}
          </s-text>
        </s-stack>
      )}
      */}

      <s-button
        variant="primary"
        inlineSize="fill"
        loading={isLoading}
        disabled={disablePrimaryAction}
        onClick={handlePrimaryAction}
      >
        {primaryActionLabel}
      </s-button>

      <s-text type="small" tone="subdued">
        {settings.thank_you_text}
      </s-text>

      {!settings.transform_active && (
        <s-banner tone="warning">
          Dynamic pricing is not ready for this store yet. Open the app settings
          page once to let Shopify enable the Cart Transform, then refresh
          checkout.
        </s-banner>
      )}

      {errorMessage && <s-banner tone="critical">{errorMessage}</s-banner>}
      {successMessage && <s-banner tone="success">{successMessage}</s-banner>}
    </s-grid>
  );
}
