import { describe, expect, it } from "vitest";
import { shouldExposeChannelInEntryPoints } from "./entry-point-visibility.js";

describe("shouldExposeChannelInEntryPoints", () => {
  it("hides non-deprecated external channels in the webchat-only build", () => {
    expect(
      shouldExposeChannelInEntryPoints({
        cfg: {},
        meta: { id: "telegram", deprecated: false },
      }),
    ).toBe(false);
  });

  it("keeps configured legacy channels hidden in the webchat-only build", () => {
    expect(
      shouldExposeChannelInEntryPoints({
        cfg: {},
        meta: { id: "legacychat", deprecated: true },
      }),
    ).toBe(false);

    expect(
      shouldExposeChannelInEntryPoints({
        cfg: {
          channels: {
            legacychat: {
              token: "configured",
            },
          },
        },
        meta: { id: "legacychat", deprecated: true },
      }),
    ).toBe(false);
  });
});
