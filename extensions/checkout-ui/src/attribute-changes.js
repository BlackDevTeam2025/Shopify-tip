export function buildUpdateAttributeChange(key, value) {
  return {
    type: "updateAttribute",
    key,
    value,
  };
}

export function buildRemoveAttributeChange(key) {
  return {
    type: "removeAttribute",
    key,
  };
}

export function canUpdateCheckoutAttributes(instructions) {
  return instructions?.attributes?.canUpdateAttributes !== false;
}
