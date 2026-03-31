import { describe, expect, it } from "vitest";
import { surfaceContractRegistry } from "./registry.js";
import { installChannelSurfaceContractSuite } from "./suites.js";

if (surfaceContractRegistry.length === 0) {
  describe("channel surface contracts", () => {
    it("skip when the build has no registered external channel contracts", () => {
      expect(surfaceContractRegistry).toEqual([]);
    });
  });
} else {
  for (const entry of surfaceContractRegistry) {
    for (const surface of entry.surfaces) {
      describe(`${entry.id} ${surface} surface contract`, () => {
        installChannelSurfaceContractSuite({
          plugin: entry.plugin,
          surface,
        });
      });
    }
  }
}
