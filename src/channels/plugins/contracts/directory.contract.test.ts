import { describe, expect, it } from "vitest";
import { directoryContractRegistry } from "./registry.js";
import { installChannelDirectoryContractSuite } from "./suites.js";

if (directoryContractRegistry.length === 0) {
  describe("channel directory contracts", () => {
    it("skip when the build has no registered external channel contracts", () => {
      expect(directoryContractRegistry).toEqual([]);
    });
  });
} else {
  for (const entry of directoryContractRegistry) {
    describe(`${entry.id} directory contract`, () => {
      installChannelDirectoryContractSuite({
        plugin: entry.plugin,
        coverage: entry.coverage,
        cfg: entry.cfg,
        accountId: entry.accountId,
      });
    });
  }
}
