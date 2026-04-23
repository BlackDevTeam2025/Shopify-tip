import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const projectRoot = "/Users/blackpham/Documents/Shopify-tip";

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("SnapTip production config uses the snaptip.tech domain", () => {
  const config = readProjectFile("shopify.app.toml");

  assert.equal(config.includes("https://example.com"), false);
  assert.equal(
    config.includes('application_url = "https://snaptip.tech/auth/start"'),
    true,
  );
  assert.equal(
    config.includes('redirect_urls = [ "https://snaptip.tech/auth/callback" ]'),
    true,
  );
});

test("SnapTip production config declares baseline and compliance webhooks", () => {
  const config = readProjectFile("shopify.app.toml");

  for (const topic of [
    'topics = [ "app/uninstalled" ]',
    'topics = [ "app/scopes_update" ]',
    'topics = [ "app_subscriptions/update" ]',
  ]) {
    assert.equal(config.includes(topic), true);
  }

  assert.equal(
    config.includes(
      'compliance_topics = [ "customers/data_request", "customers/redact", "shop/redact" ]',
    ),
    true,
  );
  assert.equal(
    config.includes('uri = "https://snaptip.tech/webhooks/compliance"'),
    true,
  );
});

test("SnapTip production config keeps only scopes used by production flows", () => {
  const config = readProjectFile("shopify.app.toml");

  for (const scope of [
    "read_orders",
    "read_publications",
    "write_cart_transforms",
    "write_products",
    "write_publications",
  ]) {
    assert.equal(config.includes(scope), true);
  }

  for (const removedScope of [
    "write_metaobject_definitions",
    "write_metaobjects",
  ]) {
    assert.equal(config.includes(removedScope), false);
  }
});

test("env example is aligned with SnapTip managed pricing defaults", () => {
  const envExample = readProjectFile(".env.example");

  assert.equal(
    envExample.includes("SHOPIFY_APP_URL=https://snaptip.tech"),
    true,
  );
  assert.equal(
    envExample.includes("SHOPIFY_MANAGED_PRICING_APP_HANDLE=snaptip"),
    true,
  );
});

test("compliance webhook route exists for App Store review", () => {
  const routePath = "app/routes/webhooks.compliance.jsx";
  const source = readProjectFile(routePath);

  assert.equal(fs.existsSync(path.join(projectRoot, routePath)), true);
  assert.equal(source.includes("authenticate.webhook(request)"), true);
  assert.equal(source.includes('status: 401'), true);
});

test("protected order metrics topics stay out of production config until protected customer data is approved", () => {
  const config = readProjectFile("shopify.app.toml");

  for (const topic of [
    'topics = [ "orders/paid" ]',
    'topics = [ "refunds/create" ]',
    'topics = [ "orders/cancelled" ]',
  ]) {
    assert.equal(config.includes(topic), false);
  }
});
