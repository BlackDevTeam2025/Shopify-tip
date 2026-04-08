async function getDbClient(dbClient) {
  if (dbClient) {
    return dbClient;
  }

  const { default: defaultDbClient } = await import("../db.server.js");
  return defaultDbClient;
}

const SUBSCRIPTION_PRIORITY = {
  ACTIVE: 6,
  FROZEN: 5,
  ACCEPTED: 4,
  PENDING: 3,
  CANCELLED: 2,
  EXPIRED: 1,
  DECLINED: 0,
};

function normalizeStatus(status) {
  if (typeof status !== "string" || !status.trim()) {
    return "none";
  }

  return status.trim().toLowerCase();
}

function createdAtValue(subscription) {
  const timestamp = Date.parse(subscription?.createdAt ?? "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

async function executeAdminJson(admin, query, variables) {
  const response = await admin.graphql(query, variables ? { variables } : {});
  return response.json();
}

export function selectRelevantSubscription(subscriptions = []) {
  return subscriptions
    .filter(Boolean)
    .sort((left, right) => {
      const priorityDelta =
        (SUBSCRIPTION_PRIORITY[right?.status] ?? -1) -
        (SUBSCRIPTION_PRIORITY[left?.status] ?? -1);

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return createdAtValue(right) - createdAtValue(left);
    })[0] ?? null;
}

export function buildLicenseState({
  shop,
  subscriptions = [],
  cachedLicense = null,
  now = new Date(),
}) {
  const activeSubscription = selectRelevantSubscription(subscriptions);

  if (activeSubscription) {
    const normalizedStatus = normalizeStatus(activeSubscription.status);

    if (normalizedStatus !== "active") {
      return {
        shop,
        licenseStatus: normalizedStatus,
        purchaseId: activeSubscription.id ?? null,
        purchaseName: activeSubscription.name ?? null,
        isTest: Boolean(activeSubscription.test),
        activatedAt: null,
      };
    }

    return {
      shop,
      licenseStatus: "active",
      purchaseId: activeSubscription.id,
      purchaseName: activeSubscription.name ?? null,
      isTest: Boolean(activeSubscription.test),
      activatedAt: now,
    };
  }

  const cachedStatus = normalizeStatus(cachedLicense?.licenseStatus);

  if (
    cachedStatus === "frozen" ||
    cachedStatus === "cancelled" ||
    cachedStatus === "declined" ||
    cachedStatus === "expired"
  ) {
    return {
      shop,
      licenseStatus: cachedStatus,
      purchaseId: cachedLicense?.purchaseId ?? null,
      purchaseName: cachedLicense?.purchaseName ?? null,
      isTest: Boolean(cachedLicense?.isTest),
      activatedAt: null,
    };
  }

  return {
    shop,
    licenseStatus: "none",
    purchaseId: null,
    purchaseName: null,
    isTest: false,
    activatedAt: null,
  };
}

export function buildWebhookLicenseState({
  shop,
  subscription = null,
  now = new Date(),
}) {
  const normalizedStatus = normalizeStatus(subscription?.status);

  if (normalizedStatus === "active") {
    return {
      shop,
      licenseStatus: "active",
      purchaseId:
        subscription?.admin_graphql_api_id || subscription?.id || null,
      purchaseName: subscription?.name ?? null,
      isTest: Boolean(subscription?.test),
      activatedAt: now,
    };
  }

  if (
    normalizedStatus === "frozen" ||
    normalizedStatus === "cancelled" ||
    normalizedStatus === "declined" ||
    normalizedStatus === "expired"
  ) {
    return {
      shop,
      licenseStatus: normalizedStatus,
      purchaseId:
        subscription?.admin_graphql_api_id || subscription?.id || null,
      purchaseName: subscription?.name ?? null,
      isTest: Boolean(subscription?.test),
      activatedAt: null,
    };
  }

  return {
    shop,
    licenseStatus: "none",
    purchaseId: null,
    purchaseName: null,
    isTest: false,
    activatedAt: null,
  };
}

export function createBypassLicenseState(shop) {
  return {
    shop,
    licenseStatus: "bypass",
    purchaseId: null,
    purchaseName: "Development Bypass",
    isTest: true,
    activatedAt: null,
  };
}

export function isLicenseActive(licenseState) {
  return (
    licenseState?.licenseStatus === "active" ||
    licenseState?.licenseStatus === "bypass"
  );
}

export async function getCachedLicense(shop, dbClient) {
  const activeDbClient = await getDbClient(dbClient);

  return activeDbClient.shopLicense.findUnique({
    where: { shop },
  });
}

export async function persistLicenseState(licenseState, dbClient) {
  const activeDbClient = await getDbClient(dbClient);
  const existingLicense = await getCachedLicense(licenseState.shop, activeDbClient);
  const activatedAt =
    licenseState.licenseStatus === "active"
      ? existingLicense?.purchaseId === licenseState.purchaseId &&
        existingLicense?.activatedAt
        ? existingLicense.activatedAt
        : licenseState.activatedAt ?? new Date()
      : null;

  return activeDbClient.shopLicense.upsert({
    where: { shop: licenseState.shop },
    create: {
      ...licenseState,
      activatedAt,
    },
    update: {
      licenseStatus: licenseState.licenseStatus,
      purchaseId: licenseState.purchaseId,
      purchaseName: licenseState.purchaseName,
      isTest: licenseState.isTest,
      activatedAt,
    },
  });
}

export async function syncShopLicenseFromSubscription({
  shop,
  admin,
  dbClient,
}) {
  const cachedLicense = await getCachedLicense(shop, dbClient);
  const json = await executeAdminJson(
    admin,
    `#graphql
    query TipAppActiveSubscriptions {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
          createdAt
        }
      }
    }`,
  );
  const subscriptions = json.data?.currentAppInstallation?.activeSubscriptions ?? [];
  const licenseState = buildLicenseState({
    shop,
    subscriptions,
    cachedLicense,
  });

  return persistLicenseState(licenseState, dbClient);
}

export async function syncShopLicenseFromSubscriptionWebhook({
  shop,
  payload,
  admin,
  dbClient,
}) {
  const subscriptionPayload =
    payload?.app_subscription && typeof payload.app_subscription === "object"
      ? payload.app_subscription
      : payload;
  const nextState = subscriptionPayload?.status
    ? buildWebhookLicenseState({
        shop,
        subscription: subscriptionPayload,
      })
    : null;

  if (nextState) {
    return persistLicenseState(nextState, dbClient);
  }

  return syncShopLicenseFromSubscription({
    shop,
    admin,
    dbClient,
  });
}

export async function clearShopLicense(shop, dbClient) {
  const activeDbClient = await getDbClient(dbClient);

  return activeDbClient.shopLicense.deleteMany({
    where: { shop },
  });
}
