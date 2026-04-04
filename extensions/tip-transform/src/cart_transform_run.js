// @ts-check

/**
 * @typedef {import("../generated/api").CartTransformRunInput} CartTransformRunInput
 * @typedef {import("../generated/api").CartTransformRunResult} CartTransformRunResult
 */

/**
 * @type {CartTransformRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

const TIP_SOURCE_VALUE = 'dynamic_subtotal';

function normalizeMoney(value) {
  const amount = Number.parseFloat(String(value ?? '').trim());

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount.toFixed(2);
}

/**
 * @param {CartTransformRunInput} input
 * @returns {CartTransformRunResult}
 */
export function cartTransformRun(input) {
  const lines = input?.cart?.lines ?? [];
  const operations = lines
    .filter((line) => line?.tipSource?.value === TIP_SOURCE_VALUE)
    .map((line) => {
      const normalizedAmount = normalizeMoney(line?.tipAmount?.value);

      if (!normalizedAmount) {
        return null;
      }

      return {
        lineUpdate: {
          cartLineId: line.id,
          title: line?.tipLabel?.value ?? 'Tip',
          price: {
            adjustment: {
              fixedPricePerUnit: {
                amount: normalizedAmount,
              },
            },
          },
        },
      };
    })
    .filter(Boolean);

  if (operations.length === 0) {
    return NO_CHANGES;
  }

  return {operations};
}
