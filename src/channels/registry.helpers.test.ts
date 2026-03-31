import { describe, expect, it } from "vitest";
import {
  formatChannelSelectionLine,
  listChatChannels,
  normalizeChatChannelId,
} from "./registry.js";

describe("channel registry helpers", () => {
  it("keeps a minimal legacy built-in normalization surface for internal compatibility", () => {
    expect(normalizeChatChannelId(" imsg ")).toBeNull();
    expect(normalizeChatChannelId("googlechat")).toBeNull();
    expect(normalizeChatChannelId("gchat")).toBeNull();
    expect(normalizeChatChannelId("google-chat")).toBeNull();
    expect(normalizeChatChannelId("internet-relay-chat")).toBe("irc");
    expect(normalizeChatChannelId("telegram")).toBe("telegram");
    expect(normalizeChatChannelId("web")).toBeNull();
    expect(normalizeChatChannelId("nope")).toBeNull();
  });

  it("exposes no built-in external channels in the default order", () => {
    expect(listChatChannels()).toEqual([]);
  });

  it("does not include MS Teams by default", () => {
    const channels = listChatChannels();
    expect(channels.some((channel) => channel.id === "msteams")).toBe(false);
  });

  it("formats selection lines for retained metadata entries", () => {
    const line = formatChannelSelectionLine(
      {
        id: "webchat",
        label: "WebChat",
        selectionLabel: "WebChat",
        docsPath: "/web/webchat",
        blurb: "internal Gateway chat surface",
      },
      (path, label) => [label, path].filter(Boolean).join(":"),
    );
    expect(line).toContain("Docs: webchat:/web/webchat");
    expect(line).toContain("WebChat");
  });
});
