import '@shopify/ui-extensions';

//@ts-ignore
declare module './src/Checkout.jsx' {
  const shopify: import('@shopify/ui-extensions/purchase.checkout.cart-line-list.render-after').Api;
  const globalThis: { shopify: typeof shopify };
}

//@ts-ignore
declare module './src/runtime-config.js' {
  const shopify: import('@shopify/ui-extensions/purchase.checkout.cart-line-list.render-after').Api;
  const globalThis: { shopify: typeof shopify };
}

//@ts-ignore
declare module './src/tip-percentages.js' {
  const shopify: import('@shopify/ui-extensions/purchase.checkout.cart-line-list.render-after').Api;
  const globalThis: { shopify: typeof shopify };
}
