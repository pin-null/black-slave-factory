import { describe, expect, it } from "vitest";
import { statusContractRegistry } from "./registry.js";
import { installChannelStatusContractSuite } from "./suites.js";

if (statusContractRegistry.length === 0) {
  describe("channel status contracts", () => {
    it("skip when the build has no registered external channel contracts", () => {
      expect(statusContractRegistry).toEqual([]);
    });
  });
} else {
  for (const entry of statusContractRegistry) {
    describe(`${entry.id} status contract`, () => {
      installChannelStatusContractSuite({
        plugin: entry.plugin,
        cases: entry.cases as never,
      });
    });
  }
}
