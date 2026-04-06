import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
import { Form, redirect, useActionData, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

function inferShopFromReferer(request) {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    return null;
  }

  const referer = request.headers.get("referer");

  if (!referer) {
    return null;
  }

  try {
    const refererUrl = new URL(referer);
    const match = refererUrl.pathname.match(/^\/store\/([^/]+)\//);

    if (!match?.[1]) {
      return null;
    }

    return `${match[1]}.myshopify.com`;
  } catch {
    return null;
  }
}

export const loader = async ({ request }) => {
  const inferredShop = inferShopFromReferer(request);

  if (inferredShop) {
    const url = new URL(request.url);
    url.searchParams.set("shop", inferredShop);
    throw redirect(`${url.pathname}?${url.searchParams.toString()}`);
  }

  const errors = loginErrorMessage(await login(request));

  return { errors, shop: "" };
};

export const action = async ({ request }) => {
  const requestClone = request.clone();
  const errors = loginErrorMessage(await login(request));
  const formData = await requestClone.formData();
  const submittedShop = String(formData.get("shop") ?? "");

  return {
    errors,
    shop: submittedShop,
  };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const { errors, shop: initialShop } = actionData || loaderData;
  const [shop, setShop] = useState(initialShop ?? "");

  return (
    <AppProvider embedded={false}>
      <s-page>
        <Form method="post">
          <s-section heading="Log in">
            <s-text-field
              name="shop"
              label="Shop domain"
              details="example.myshopify.com"
              value={shop}
              onChange={(e) => setShop(e.currentTarget.value)}
              autocomplete="on"
              error={errors.shop}
            ></s-text-field>
            <s-button type="submit">Log in</s-button>
          </s-section>
        </Form>
      </s-page>
    </AppProvider>
  );
}
