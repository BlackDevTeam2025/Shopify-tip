import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const projectRoot = "/Users/blackpham/Documents/Shopify-tip";

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("SnapTip production config uses the snaptip.tech domain", () => {
  const config = readProjectFile("shopify.app.snaptip.toml");

  assert.equal(config.includes("https://example.com"), false);
  assert.equal(
    config.includes('application_url = "https://snaptip.tech"'),
    true,
  );
  assert.equal(
    config.includes('redirect_urls = [ "https://snaptip.tech/auth/callback" ]'),
    true,
  );
});

test("SnapTip production config declares only baseline webhooks before protected-data approval", () => {
  const config = readProjectFile("shopify.app.snaptip.toml");

  for (const topic of [
    'topics = [ "app/uninstalled" ]',
    'topics = [ "app/scopes_update" ]',
    'topics = [ "app_subscriptions/update" ]',
  ]) {
    assert.equal(config.includes(topic), true);
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

test("compliance webhook routes exist for App Store review", () => {
  for (const routePath of [
    "app/routes/webhooks.customers.data_request.jsx",
    "app/routes/webhooks.customers.redact.jsx",
    "app/routes/webhooks.shop.redact.jsx",
  ]) {
    assert.equal(fs.existsSync(path.join(projectRoot, routePath)), true);
  }
});

test("protected compliance webhook topics are not declared before approval", () => {
  const config = readProjectFile("shopify.app.snaptip.toml");

  for (const topic of [
    'topics = [ "orders/paid" ]',
    'topics = [ "refunds/create" ]',
    'topics = [ "orders/cancelled" ]',
    'topics = [ "customers/data_request" ]',
    'topics = [ "customers/redact" ]',
    'topics = [ "shop/redact" ]',
  ]) {
    assert.equal(config.includes(topic), false);
  }
});
