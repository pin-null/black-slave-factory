import { describe, expect, it } from "vitest";
import { threadingContractRegistry } from "./registry.js";
import { installChannelThreadingContractSuite } from "./suites.js";

if (threadingContractRegistry.length === 0) {
  describe("channel threading contracts", () => {
    it("skip when the build has no registered external channel contracts", () => {
      expect(threadingContractRegistry).toEqual([]);
    });
  });
} else {
  for (const entry of threadingContractRegistry) {
    describe(`${entry.id} threading contract`, () => {
      installChannelThreadingContractSuite({
        plugin: entry.plugin,
      });
    });
  }
}
