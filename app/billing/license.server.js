import { shouldUseTestCharge } from "./env.server.js";

async function getDbClient(dbClient) {
  if (dbClient) {
    return dbClient;
  }

  const { default: defaultDbClient } = await import("../db.server.js");
  return defaultDbClient;
}

export function selectActiveOneTimePurchase(purchases = []) {
  return (
    purchases.find(
      (purchase) =>
        purchase?.status === "ACTIVE" || purchase?.status === "ACCEPTED",
    ) ?? null
  );
}

export function buildLicenseState({
  shop,
  purchases = [],
  now = new Date(),
}) {
  const activePurchase = selectActiveOneTimePurchase(purchases);

  if (!activePurchase) {
    return {
      shop,
      licenseStatus: "none",
      purchaseId: null,
      purchaseName: null,
      isTest: false,
      activatedAt: null,
    };
  }

  return {
    shop,
    licenseStatus: "active",
    purchaseId: activePurchase.id,
    purchaseName: activePurchase.name ?? null,
    isTest: Boolean(activePurchase.test),
    activatedAt: now,
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

export async function syncShopLicenseFromBilling({
  shop,
  billing,
  dbClient,
  env = process.env,
}) {
  const { LIFETIME_PLAN } = await import("./config.server.js");
  const billingCheck = await billing.check({
    plans: [LIFETIME_PLAN],
    isTest: shouldUseTestCharge(env),
  });

  const licenseState = buildLicenseState({
    shop,
    purchases: billingCheck.oneTimePurchases,
  });

  return persistLicenseState(licenseState, dbClient);
}

export async function clearShopLicense(shop, dbClient) {
  const activeDbClient = await getDbClient(dbClient);

  return activeDbClient.shopLicense.deleteMany({
    where: { shop },
  });
}
