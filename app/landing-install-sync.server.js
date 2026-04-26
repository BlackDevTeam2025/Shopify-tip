const SHOP_INSTALL_SYNC_QUERY = `#graphql
  query SnapTipInstallSyncShopInfo {
    shop {
      name
      email
      myshopifyDomain
    }
  }
`;

const DEFAULT_INSTALL_SYNC_URL =
  "https://snaptip.tech/internal/installations/shopify";

function getInstallSyncConfig() {
  const token = String(
    process.env.INTERNAL_SYNC_SECRET ||
      process.env.SNAPTIP_INTERNAL_SYNC_SECRET ||
      "",
  ).trim();
  const url = String(
    process.env.SNAPTIP_INSTALL_SYNC_URL || DEFAULT_INSTALL_SYNC_URL,
  ).trim();

  return { token, url };
}

async function fetchShopInfo(admin) {
  try {
    const response = await admin.graphql(SHOP_INSTALL_SYNC_QUERY);
    const payload = await response.json();
    return payload?.data?.shop || {};
  } catch (error) {
    console.warn("SnapTip install sync: unable to read shop info", error);
    return {};
  }
}

export async function syncLandingInstallation({
  admin,
  session,
  source = "embedded_app",
}) {
  const shop = String(session?.shop || "").trim().toLowerCase();
  if (!shop || !admin) {
    return { ok: false, skipped: true, reason: "missing_shop_or_admin" };
  }

  const { token, url } = getInstallSyncConfig();
  if (!token || !url) {
    return { ok: false, skipped: true, reason: "missing_sync_config" };
  }

  const shopInfo = await fetchShopInfo(admin);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-snaptip-internal-token": token,
      },
      body: JSON.stringify({
        shop,
        email: shopInfo.email || "",
        name: shopInfo.name || "",
        myshopifyDomain: shopInfo.myshopifyDomain || shop,
        scope: session?.scope || "",
        source,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn("SnapTip install sync failed", {
        status: response.status,
        body,
      });
      return { ok: false, status: response.status };
    }

    return { ok: true };
  } catch (error) {
    console.warn("SnapTip install sync request failed", error);
    return { ok: false, error };
  }
}
