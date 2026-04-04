import db from "../db.server.js";
import { LIFETIME_PLAN } from "./config.server.js";
import { shouldUseTestCharge } from "./env.server.js";

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

export async function getCachedLicense(shop, dbClient = db) {
  return dbClient.shopLicense.findUnique({
    where: { shop },
  });
}

export async function persistLicenseState(licenseState, dbClient = db) {
  const existingLicense = await getCachedLicense(licenseState.shop, dbClient);
  const activatedAt =
    licenseState.licenseStatus === "active"
      ? existingLicense?.purchaseId === licenseState.purchaseId &&
        existingLicense?.activatedAt
        ? existingLicense.activatedAt
        : licenseState.activatedAt ?? new Date()
      : null;

  return dbClient.shopLicense.upsert({
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
  dbClient = db,
  env = process.env,
}) {
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

export async function clearShopLicense(shop, dbClient = db) {
  return dbClient.shopLicense.deleteMany({
    where: { shop },
  });
}
