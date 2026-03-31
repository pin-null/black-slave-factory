import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultDeps } from "./deps.js";

describe("createDefaultDeps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no external channel senders in the webchat-only build", () => {
    const deps = createDefaultDeps();
    expect(deps).toEqual({});
  });
});
