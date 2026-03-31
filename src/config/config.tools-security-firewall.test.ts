import { describe, expect, it } from "vitest";
import { OpenClawSchema } from "./zod-schema.js";

describe("tools security firewall schema", () => {
  it("accepts security firewall configuration", () => {
    const result = OpenClawSchema.safeParse({
      tools: {
        securityFirewall: {
          enabled: true,
          profile: "office",
          ownerBypass: false,
          promptGuard: "Only handle office work.",
          audit: {
            enabled: true,
            path: "~/.openclaw/logs/security-firewall.jsonl",
          },
          rules: [
            {
              id: "external-http",
              action: "approval",
              tools: ["web_*"],
              urlHosts: ["calendar.example.com"],
            },
          ],
        },
      },
    });

    expect(result.success).toBe(true);
  });
});
