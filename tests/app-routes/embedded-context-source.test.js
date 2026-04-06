import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const gateSource = fs.readFileSync(
  path.resolve("app/billing/gate.server.js"),
  "utf8",
);
const licenseSource = fs.readFileSync(
  path.resolve("app/routes/app.license.jsx"),
  "utf8",
);
const confirmSource = fs.readFileSync(
  path.resolve("app/routes/app.license.confirm.jsx"),
  "utf8",
);
const appShellSource = fs.readFileSync(
  path.resolve("app/routes/app.jsx"),
  "utf8",
);

test("billing gate uses the Shopify embedded redirect helper instead of raw react-router redirects", () => {
  assert.equal(
    gateSource.includes("function throwEmbeddedRedirect(adminContext, url)"),
    true,
  );
  assert.equal(
    gateSource.includes(
      "throwEmbeddedRedirect(adminContext, accessDecision.redirectTo)",
    ),
    true,
  );
});

test("license routes preserve embedded context on internal redirects", () => {
  assert.equal(
    licenseSource.includes('throwEmbeddedRedirect(adminContext, "/app")'),
    true,
  );
  assert.equal(
    licenseSource.includes(
      'throwEmbeddedRedirect(adminContext, "/app/license")',
    ),
    true,
  );
  assert.equal(
    confirmSource.includes('throwEmbeddedRedirect(adminContext, "/app")'),
    true,
  );
  assert.equal(
    confirmSource.includes(
      'throwEmbeddedRedirect(adminContext, "/app/license")',
    ),
    true,
  );
});

test("app shell navigation preserves the current embedded query string", () => {
  assert.equal(appShellSource.includes("useLocation"), true);
  assert.equal(appShellSource.includes("appendEmbeddedSearch"), true);
  assert.equal(
    appShellSource.includes("const homeHref = appendEmbeddedSearch"),
    true,
  );
  assert.equal(
    appShellSource.includes("const settingsHref = appendEmbeddedSearch"),
    true,
  );
});
