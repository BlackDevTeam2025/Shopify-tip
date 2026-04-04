import path from "path";
import fs from "fs";
import { describe, test, expect } from "vitest";
import { cartTransformRun } from "../src/cart_transform_run";

describe("Cart transform fixtures", () => {
  const fixturesDir = path.join(__dirname, "fixtures");
  const fixtureFiles = fs
    .readdirSync(fixturesDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.join(fixturesDir, file));

  fixtureFiles.forEach((fixtureFile) => {
    test(`runs ${path.relative(fixturesDir, fixtureFile)}`, async () => {
      const fixture = JSON.parse(fs.readFileSync(fixtureFile, "utf8")).payload;
      const result = cartTransformRun(fixture.input);
      expect(result).toEqual(fixture.output);
    });
  });
});
