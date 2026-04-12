import db from "./db.server.js";

export async function eraseShopData(shop, dbClient = db) {
  await dbClient.tipMetricRefundEvent.deleteMany({ where: { shop } });
  await dbClient.tipMetric.deleteMany({ where: { shop } });
  await dbClient.shopLicense.deleteMany({ where: { shop } });
  await dbClient.session.deleteMany({ where: { shop } });
}

