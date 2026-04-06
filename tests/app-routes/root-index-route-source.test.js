import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const routeSource = fs.readFileSync(
  path.resolve("app/routes/_index/route.jsx"),
  "utf8",
);

test("root index route redirects into the embedded app instead of rendering the shop-domain login form", () => {
  assert.equal(
    routeSource.includes('redirect(search ? `/app?${search}` : "/app")'),
    true,
  );
  assert.equal(routeSource.includes("/auth/login"), false);
  assert.equal(routeSource.includes("Shop domain"), false);
});
