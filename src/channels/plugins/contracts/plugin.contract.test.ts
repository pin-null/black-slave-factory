import { describe, expect, it } from "vitest";
import { pluginContractRegistry } from "./registry.js";
import { installChannelPluginContractSuite } from "./suites.js";

if (pluginContractRegistry.length === 0) {
  describe("channel plugin contracts", () => {
    it("skip when the build has no registered external channel contracts", () => {
      expect(pluginContractRegistry).toEqual([]);
    });
  });
} else {
  for (const entry of pluginContractRegistry) {
    describe(`${entry.id} plugin contract`, () => {
      installChannelPluginContractSuite({
        plugin: entry.plugin,
      });
    });
  }
}
