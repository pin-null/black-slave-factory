import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluateSecurityFirewall,
  resolveSecurityFirewallPromptGuard,
} from "./security-firewall.js";

describe("security firewall", () => {
  it("returns the office prompt guard when the office profile is enabled", () => {
    const promptGuard = resolveSecurityFirewallPromptGuard({
      tools: {
        securityFirewall: {
          enabled: true,
          profile: "office",
        },
      },
    });

    expect(promptGuard).toContain("office productivity tasks");
  });

  it("blocks shell execution in the office profile", async () => {
    const decision = await evaluateSecurityFirewall({
      config: {
        tools: {
          securityFirewall: {
            enabled: true,
            profile: "office",
          },
        },
      },
      toolName: "exec",
      params: { cmd: "ls" },
      requestText: "list the working directory",
      workspaceDir: "/tmp/workspace",
    });

    expect(decision).toMatchObject({
      action: "block",
      matchedRuleId: "office-shell-execution",
    });
    expect(decision?.reason).toContain("outside the office-only capability boundary");
  });

  it("marks sensitive file reads as approval-required in the office profile", async () => {
    const decision = await evaluateSecurityFirewall({
      config: {
        tools: {
          securityFirewall: {
            enabled: true,
            profile: "office",
            audit: { enabled: false },
          },
        },
      },
      toolName: "read",
      params: { path: "/etc/hosts" },
      requestText: "read the host configuration",
      workspaceDir: "/tmp/workspace",
    });

    expect(decision).toMatchObject({
      action: "approval",
      matchedRuleId: "office-sensitive-files",
    });
  });

  it("allows reads inside the default workspace under the state directory", async () => {
    const workspaceDir = path.join(os.homedir(), ".openclaw", "workspace");
    const decision = await evaluateSecurityFirewall({
      config: {
        tools: {
          securityFirewall: {
            enabled: true,
            profile: "office",
            audit: { enabled: false },
          },
        },
      },
      toolName: "read",
      params: { path: path.join(workspaceDir, "AGENTS.md") },
      requestText: "read the local workspace instructions",
      workspaceDir,
    });

    expect(decision).toBeUndefined();
  });

  it("marks apply_patch edits to sensitive paths as approval-required", async () => {
    const decision = await evaluateSecurityFirewall({
      config: {
        tools: {
          securityFirewall: {
            enabled: true,
            profile: "office",
            audit: { enabled: false },
          },
        },
      },
      toolName: "apply_patch",
      params: {
        input: [
          "*** Begin Patch",
          "*** Update File: /etc/hosts",
          "@@",
          "-127.0.0.1 localhost",
          "+127.0.0.1 localhost",
          "*** End Patch",
        ].join("\n"),
      },
      requestText: "patch the system hosts file",
      workspaceDir: "/tmp/workspace",
    });

    expect(decision).toMatchObject({
      action: "approval",
      matchedRuleId: "office-sensitive-files",
    });
  });

  it("marks apply_patch edits outside the workspace as approval-required", async () => {
    const decision = await evaluateSecurityFirewall({
      config: {
        tools: {
          securityFirewall: {
            enabled: true,
            profile: "office",
            audit: { enabled: false },
          },
        },
      },
      toolName: "apply_patch",
      params: {
        input: ["*** Begin Patch", "*** Add File: ../outside.txt", "+hello", "*** End Patch"].join(
          "\n",
        ),
      },
      requestText: "write a file outside the workspace",
      workspaceDir: "/tmp/workspace",
    });

    expect(decision).toMatchObject({
      action: "approval",
      matchedRuleId: "office-outside-workspace-writes",
    });
  });

  it("allows owners to bypass the firewall when ownerBypass is enabled", async () => {
    const decision = await evaluateSecurityFirewall({
      config: {
        tools: {
          securityFirewall: {
            enabled: true,
            profile: "office",
            ownerBypass: true,
          },
        },
      },
      toolName: "exec",
      params: { cmd: "ls" },
      senderIsOwner: true,
      workspaceDir: "/tmp/workspace",
    });

    expect(decision).toBeUndefined();
  });
});
