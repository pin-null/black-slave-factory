import { describe, expect, it } from "vitest";
import { actionContractRegistry } from "./registry.js";
import { installChannelActionsContractSuite } from "./suites.js";

if (actionContractRegistry.length === 0) {
  describe("channel action contracts", () => {
    it("skip when the build has no registered external channel contracts", () => {
      expect(actionContractRegistry).toEqual([]);
    });
  });
} else {
  for (const entry of actionContractRegistry) {
    describe(`${entry.id} actions contract`, () => {
      installChannelActionsContractSuite({
        plugin: entry.plugin,
        cases: entry.cases as never,
        unsupportedAction: entry.unsupportedAction as never,
      });
    });
  }
}
