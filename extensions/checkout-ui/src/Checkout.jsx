import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useMemo, useRef, useState} from 'preact/hooks';
import {getTipRuntimeConfigFromAppMetafields} from './runtime-config';
import {
  calculateSubtotalTipAmount,
  formatTipOptionLabel,
  isValidCustomAmount,
  parseTipPercentages,
} from './tip-percentages';

const TIP_SOURCE_ATTRIBUTE = 'tip_source';
const TIP_MODE_ATTRIBUTE = 'tip_mode';
const TIP_PERCENTAGE_ATTRIBUTE = 'tip_percentage';
const TIP_AMOUNT_ATTRIBUTE = 'tip_amount';
const TIP_LABEL_ATTRIBUTE = 'tip_label';
const TIP_SOURCE_VALUE = 'dynamic_subtotal';

function formatCurrency(amount, currencyCode = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

function findTipLine(lines = [], tipVariantId = '') {
  return lines.find((line) => line?.merchandise?.id === tipVariantId) ?? null;
}

function getCheckoutSubtotal(lines = [], tipVariantId = '') {
  return lines.reduce((total, line) => {
    if (tipVariantId && line?.merchandise?.id === tipVariantId) {
      return total;
    }

    const amount = Number.parseFloat(line?.cost?.totalAmount?.amount ?? '0');
    return Number.isFinite(amount) ? total + amount : total;
  }, 0);
}

function buildTipLineAttributes({mode, percentage, amount, label}) {
  const attributes = [
    {key: TIP_SOURCE_ATTRIBUTE, value: TIP_SOURCE_VALUE},
    {key: TIP_MODE_ATTRIBUTE, value: mode},
    {key: TIP_AMOUNT_ATTRIBUTE, value: String(amount)},
    {key: TIP_LABEL_ATTRIBUTE, value: label},
  ];

  if (percentage) {
    attributes.push({key: TIP_PERCENTAGE_ATTRIBUTE, value: String(percentage)});
  }

  return attributes;
}

function buildAddTipLineChange({merchandiseId, attributes}) {
  return {
    type: 'addCartLine',
    merchandiseId,
    quantity: 1,
    attributes,
  };
}

function buildUpdateTipLineChange({id, attributes}) {
  return {
    type: 'updateCartLine',
    id,
    quantity: 1,
    attributes,
  };
}

function buildRemoveTipLineChange({id, quantity}) {
  return {
    type: 'removeCartLine',
    id,
    quantity,
  };
}

function getAttributeValue(attributes = [], key) {
  return attributes.find((attribute) => attribute?.key === key)?.value ?? '';
}

function getInitialSelection({existingTipLine, percentages}) {
  const savedMode = getAttributeValue(existingTipLine?.attributes, TIP_MODE_ATTRIBUTE);
  const savedPercentage = getAttributeValue(existingTipLine?.attributes, TIP_PERCENTAGE_ATTRIBUTE);
  const savedAmount = getAttributeValue(existingTipLine?.attributes, TIP_AMOUNT_ATTRIBUTE);

  if (savedMode === 'custom' && isValidCustomAmount(savedAmount)) {
    return {
      selectedTip: 'custom',
      customAmount: savedAmount,
    };
  }

  if (
    savedMode === 'percentage' &&
    savedPercentage &&
    percentages.includes(Number(savedPercentage))
  ) {
    return {
      selectedTip: savedPercentage,
      customAmount: '',
    };
  }

  return {
    selectedTip: percentages[0] ? String(percentages[0]) : 'none',
    customAmount: '',
  };
}

function getDesiredTipPayload({
  selectedTip,
  isCustomSelected,
  isCustomAmountValid,
  customAmount,
  tipAmount,
  selectionLabel,
}) {
  if (selectedTip === 'none') {
    return null;
  }

  if (isCustomSelected && !isCustomAmountValid) {
    return null;
  }

  if (tipAmount <= 0) {
    return null;
  }

  return {
    mode: isCustomSelected ? 'custom' : 'percentage',
    percentage: isCustomSelected ? null : Number(selectedTip),
    amount: tipAmount,
    label: selectionLabel,
    customAmount: isCustomSelected ? customAmount : '',
  };
}

function getExistingTipPayload(existingTipLine) {
  if (!existingTipLine) {
    return null;
  }

  const mode = getAttributeValue(existingTipLine.attributes, TIP_MODE_ATTRIBUTE);
  const percentage = getAttributeValue(existingTipLine.attributes, TIP_PERCENTAGE_ATTRIBUTE);
  const amount = getAttributeValue(existingTipLine.attributes, TIP_AMOUNT_ATTRIBUTE);
  const label = getAttributeValue(existingTipLine.attributes, TIP_LABEL_ATTRIBUTE);

  return {
    mode,
    percentage,
    amount,
    label,
  };
}

function tipPayloadMatches(existingPayload, nextPayload) {
  if (!existingPayload && !nextPayload) {
    return true;
  }

  if (!existingPayload || !nextPayload) {
    return false;
  }

  return (
    existingPayload.mode === nextPayload.mode &&
    String(existingPayload.percentage ?? '') === String(nextPayload.percentage ?? '') &&
    String(existingPayload.amount ?? '') === String(nextPayload.amount) &&
    String(existingPayload.label ?? '') === String(nextPayload.label ?? '')
  );
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

function chunkOptions(values = [], size = 2) {
  const chunks = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

function buildOptionRows(percentages = [], customAmountEnabled = false) {
  const rows = chunkOptions(percentages, 2);

  if (customAmountEnabled) {
    if (rows.length === 0 || rows[rows.length - 1].length === 2) {
      rows.push([{value: 'custom', label: 'Custom amount'}]);
    } else {
      rows[rows.length - 1].push({value: 'custom', label: 'Custom amount'});
    }
  }

  rows.push([{value: 'none', label: 'No thanks'}]);

  return rows;
}

export default async () => {
  render(<TipBlockExtension />, document.body);
};

function TipBlockExtension() {
  const settings = getTipRuntimeConfigFromAppMetafields(shopify.appMetafields.value);

  if (!settings?.enabled) {
    return null;
  }

  const tipVariantId = settings.tip_variant_id?.trim();
  const lines = shopify.lines?.value ?? [];
  const instructions = shopify.instructions?.value;
  const applyCartLinesChange = shopify.applyCartLinesChange;
  const currencyCode = lines?.[0]?.cost?.totalAmount?.currencyCode ?? 'USD';
  const percentages = parseTipPercentages(settings.tip_percentages);
  const optionRows = buildOptionRows(percentages, settings.custom_amount_enabled);
  const existingTipLine = findTipLine(lines, tipVariantId);
  const subtotal = getCheckoutSubtotal(lines, tipVariantId);
  const initialSelection = getInitialSelection({existingTipLine, percentages});

  const [selectedTip, setSelectedTip] = useState(initialSelection.selectedTip);
  const [customAmount, setCustomAmount] = useState(initialSelection.customAmount);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasUserInteractedRef = useRef(false);

  const isCustomSelected = selectedTip === 'custom';
  const isCustomAmountValid = !isCustomSelected || isValidCustomAmount(customAmount);
  const tipAmount = useMemo(() => {
    if (selectedTip === 'none') {
      return 0;
    }

    if (isCustomSelected) {
      return isCustomAmountValid ? Number.parseFloat(customAmount) : 0;
    }

    return calculateSubtotalTipAmount({
      subtotal,
      percentage: Number(selectedTip),
    });
  }, [customAmount, isCustomAmountValid, isCustomSelected, selectedTip, subtotal]);

  const selectionLabel = isCustomSelected
    ? `Custom tip (${formatCurrency(tipAmount, currencyCode)})`
    : formatTipOptionLabel({
        percentage: Number(selectedTip),
        amount: tipAmount,
        currencyCode,
        displayOption: settings.percentage_display_option,
      });

  const desiredTipPayload = getDesiredTipPayload({
    selectedTip,
    isCustomSelected,
    isCustomAmountValid,
    customAmount,
    tipAmount,
    selectionLabel,
  });
  const existingTipPayload = getExistingTipPayload(existingTipLine);

  const handleApplyTip = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!settings.transform_active) {
      setErrorMessage('Dynamic pricing is not ready for this store yet. Open the app settings page once to let Shopify enable the Cart Transform, then refresh checkout.');
      return;
    }

    if (!tipVariantId) {
      setErrorMessage('Tip product variant is not configured yet.');
      return;
    }

    if (subtotal <= 0 && !isCustomSelected) {
      setErrorMessage('Tip percentages need a positive subtotal before they can be applied.');
      return;
    }

    if (isCustomSelected && !isCustomAmountValid) {
      setErrorMessage('Custom amount must be greater than 0.');
      return;
    }

    if (typeof applyCartLinesChange !== 'function') {
      setErrorMessage('Checkout cannot update tip lines in this payment flow.');
      return;
    }

    const attributes = buildTipLineAttributes({
      mode: isCustomSelected ? 'custom' : 'percentage',
      percentage: isCustomSelected ? null : Number(selectedTip),
      amount: tipAmount,
      label: selectionLabel,
    });

    setIsLoading(true);
    try {
      const change = existingTipLine
        ? buildUpdateTipLineChange({id: existingTipLine.id, attributes})
        : buildAddTipLineChange({merchandiseId: tipVariantId, attributes});
      const result = await applyCartLinesChange(change);

      if (result?.type === 'error') {
        throw new Error(result.message ?? 'Unknown error');
      }

      setSuccessMessage('Tip line saved. Shopify Plus pricing should update the order summary automatically.');
    } catch (error) {
      setErrorMessage(`Unable to apply tip: ${error?.message ?? 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTip = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!existingTipLine) {
      setSuccessMessage('No saved tip line to remove.');
      return;
    }

    if (!canRemoveTipLine(instructions) || typeof applyCartLinesChange !== 'function') {
      setErrorMessage('Checkout cannot remove tip lines in this payment flow.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await applyCartLinesChange(
        buildRemoveTipLineChange({id: existingTipLine.id, quantity: existingTipLine.quantity}),
      );

      if (result?.type === 'error') {
        throw new Error(result.message ?? 'Unknown error');
      }

      setSuccessMessage('Tip removed from the checkout.');
    } catch (error) {
      setErrorMessage(`Unable to remove tip: ${error?.message ?? 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasUserInteractedRef.current || isLoading) {
      return;
    }

    if (!settings.transform_active) {
      return;
    }

    if (selectedTip === 'none') {
      if (existingTipLine) {
        handleRemoveTip();
      }
      return;
    }

    if (!desiredTipPayload || tipPayloadMatches(existingTipPayload, desiredTipPayload)) {
      return;
    }

    const timeoutId = setTimeout(() => {
      handleApplyTip();
    }, isCustomSelected ? 350 : 0);

    return () => clearTimeout(timeoutId);
  }, [
    selectedTip,
    customAmount,
    tipAmount,
    settings.transform_active,
    existingTipLine?.id,
    existingTipPayload?.amount,
    existingTipPayload?.label,
    existingTipPayload?.mode,
    existingTipPayload?.percentage,
    desiredTipPayload?.amount,
    desiredTipPayload?.label,
    desiredTipPayload?.mode,
    desiredTipPayload?.percentage,
    isCustomSelected,
    isLoading,
  ]);

  return (
    <s-grid
      background="subdued"
      border="base"
      borderRadius="large-100"
      padding="base"
      gap="base"
    >
      <s-stack gap="small" inline-size="100%">
        <s-stack direction="inline" gap="small" align-items="center">
          <s-text type="strong">Tip</s-text>
        </s-stack>
        <s-text type="small" tone="neutral">{settings.widget_title}</s-text>
        <s-text type="small" tone="subdued">{settings.caption1}</s-text>
      </s-stack>

      <s-stack gap="small" inline-size="100%">
        {optionRows.map((row, rowIndex) => (
          <s-grid key={`row-${rowIndex}`} gridTemplateColumns="1fr 1fr" gap="small">
            {row.map((option) => {
              const optionValue =
                typeof option === 'number' ? String(option) : option.value;
              const optionLabel =
                typeof option === 'number' ? `${option}%` : option.label;
              const isSelected = selectedTip === optionValue;

              return (
                <s-button
                  key={optionValue}
                  inlineSize="fill"
                  variant={isSelected ? 'primary' : 'secondary'}
                  tone={isSelected ? 'accent' : undefined}
                  onClick={() => {
                    hasUserInteractedRef.current = true;
                    setSelectedTip(optionValue);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                >
                  {optionLabel}
                </s-button>
              );
            })}
            {row.length === 1 && <s-box inlineSize="fill" />}
          </s-grid>
        ))}
      </s-stack>

      {selectedTip === 'custom' && settings.custom_amount_enabled && (
        <s-text-field
          name="custom-amount"
          value={customAmount}
          onChange={(e) => {
            hasUserInteractedRef.current = true;
            setCustomAmount(e.currentTarget.value);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          label="Custom amount"
        />
      )}

      {selectedTip !== 'none' && tipAmount > 0 && (
        <s-stack gap="small" inline-size="100%">
          <s-text type="small" tone="subdued">
            Subtotal: {formatCurrency(subtotal, currencyCode)}
          </s-text>
          <s-stack direction="inline" gap="small" align-items="center">
            <s-text type="small" tone="subdued">Tip total</s-text>
            <s-text type="strong">{formatCurrency(tipAmount, currencyCode)}</s-text>
          </s-stack>
        </s-stack>
      )}

      {!settings.transform_active && (
        <s-banner tone="warning">
          Dynamic pricing is not ready for this store yet. Open the app settings page once to let Shopify enable the Cart Transform, then refresh checkout.
        </s-banner>
      )}

      {errorMessage && <s-banner tone="critical">{errorMessage}</s-banner>}

      {isLoading && (
        <s-text type="small" tone="subdued">
          Updating your order summary...
        </s-text>
      )}
    </s-grid>
  );
}
