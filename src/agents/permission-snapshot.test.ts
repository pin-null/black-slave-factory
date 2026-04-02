import { describe, expect, it } from "vitest";
import {
  appendPermissionSnapshotToSystemPrompt,
  buildPermissionSnapshot,
  formatPermissionSnapshotSection,
} from "./permission-snapshot.js";

describe("permission-snapshot", () => {
  it("defaults to chat when no tools are available", () => {
    expect(buildPermissionSnapshot()).toEqual({
      tier: "chat",
      allowedCapabilities: ["Pure text conversation, document drafting, and knowledge Q&A"],
      blockedCapabilities: ["Read-only tools", "Read/write tools", "High-risk tools"],
      notes: [],
    });
  });

  it("derives readonly and readwrite tiers from available tools", () => {
    expect(buildPermissionSnapshot({ tools: [{ name: "read" }] }).tier).toBe("readonly");
    expect(buildPermissionSnapshot({ tools: [{ name: "write" }] }).tier).toBe("readwrite");
  });

  it("adds an exec note when dangerous hosts are not available", () => {
    const snapshot = buildPermissionSnapshot({ tools: [{ name: "exec" }] });
    expect(snapshot.tier).toBe("readwrite");
    expect(snapshot.notes).toContain(
      "`exec` is limited to sandbox/local use; gateway/node hosts require dangerous tier.",
    );
  });

  it("formats a stable enforced permission section", () => {
    const text = formatPermissionSnapshotSection(
      buildPermissionSnapshot({ tools: [{ name: "read" }, { name: "write" }] }),
    );
    expect(text).toContain("## Runtime Permissions (enforced)");
    expect(text).toContain("Current permission tier: readwrite");
    expect(text).toContain("Blocked capabilities:");
  });

  it("appends the enforced permission section only once", () => {
    const snapshot = buildPermissionSnapshot({ tools: [{ name: "read" }] });
    const first = appendPermissionSnapshotToSystemPrompt({
      systemPrompt: "Base prompt",
      permissionSnapshot: snapshot,
    });
    const second = appendPermissionSnapshotToSystemPrompt({
      systemPrompt: first,
      permissionSnapshot: snapshot,
    });
    expect(first).toContain("## Runtime Permissions (enforced)");
    expect(second).toBe(first);
  });
});
