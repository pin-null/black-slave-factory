import { CHANNEL_IDS, CHAT_CHANNEL_ORDER, type ChatChannelId } from "./ids.js";
import type { ChannelMeta } from "./plugins/types.js";
import type { ChannelId } from "./plugins/types.js";
export { CHANNEL_IDS, CHAT_CHANNEL_ORDER, REMOVED_CHAT_CHANNEL_IDS } from "./ids.js";
export type { ChatChannelId } from "./ids.js";

export type ChatChannelMeta = ChannelMeta;
const REGISTRY_STATE = Symbol.for("openclaw.pluginRegistryState");

type RegisteredChannelPluginEntry = {
  plugin: {
    id?: string | null;
    meta?: { aliases?: string[] | null } | null;
  };
};

function listRegisteredChannelPluginEntries(): RegisteredChannelPluginEntry[] {
  const globalState = globalThis as typeof globalThis & {
    [REGISTRY_STATE]?: { registry?: { channels?: RegisteredChannelPluginEntry[] | null } | null };
  };
  return globalState[REGISTRY_STATE]?.registry?.channels ?? [];
}

const buildHiddenMeta = (
  id: ChatChannelId,
  label: string,
  docsPath = "/channels",
): ChannelMeta => ({
  id,
  label,
  selectionLabel: label,
  detailLabel: label,
  docsPath,
  docsLabel: id,
  blurb: "",
  deprecated: true,
});

const CHAT_CHANNEL_META: Record<ChatChannelId, ChannelMeta> = {
  telegram: buildHiddenMeta("telegram", "Telegram"),
  whatsapp: buildHiddenMeta("whatsapp", "WhatsApp"),
  discord: buildHiddenMeta("discord", "Discord"),
  irc: buildHiddenMeta("irc", "IRC"),
  slack: buildHiddenMeta("slack", "Slack"),
  signal: buildHiddenMeta("signal", "Signal"),
  imessage: buildHiddenMeta(
    "imessage",
    "iMessage (Legacy)",
    "/gateway/configuration-reference#imessage",
  ),
  line: buildHiddenMeta("line", "LINE"),
};

export const CHAT_CHANNEL_ALIASES: Record<string, ChatChannelId> = {
  "internet-relay-chat": "irc",
};

const normalizeChannelKey = (raw?: string | null): string | undefined => {
  const normalized = raw?.trim().toLowerCase();
  return normalized || undefined;
};

export function listChatChannels(): ChatChannelMeta[] {
  return CHAT_CHANNEL_ORDER.map((id) => CHAT_CHANNEL_META[id]);
}

export function listChatChannelAliases(): string[] {
  return Object.keys(CHAT_CHANNEL_ALIASES);
}

export function getChatChannelMeta(id: ChatChannelId): ChatChannelMeta {
  return CHAT_CHANNEL_META[id];
}

export function normalizeChatChannelId(raw?: string | null): ChatChannelId | null {
  const normalized = normalizeChannelKey(raw);
  if (!normalized) {
    return null;
  }
  const resolved = CHAT_CHANNEL_ALIASES[normalized] ?? normalized;
  return CHANNEL_IDS.includes(resolved) ? resolved : null;
}

// Channel docking: prefer this helper in shared code. Importing from
// `src/channels/plugins/*` can eagerly load channel implementations.
export function normalizeChannelId(raw?: string | null): ChatChannelId | null {
  return normalizeChatChannelId(raw);
}

// Normalizes registered channel plugins (bundled or external).
//
// Keep this light: we do not import channel plugins here (those are "heavy" and can pull in
// monitors, web login, etc). The plugin registry must be initialized first.
export function normalizeAnyChannelId(raw?: string | null): ChannelId | null {
  const key = normalizeChannelKey(raw);
  if (!key) {
    return null;
  }

  const hit = listRegisteredChannelPluginEntries().find((entry) => {
    const id = String(entry.plugin.id ?? "")
      .trim()
      .toLowerCase();
    if (id && id === key) {
      return true;
    }
    return (entry.plugin.meta?.aliases ?? []).some((alias) => alias.trim().toLowerCase() === key);
  });
  return hit?.plugin.id ?? null;
}

export function formatChannelPrimerLine(meta: ChatChannelMeta): string {
  return `${meta.label}: ${meta.blurb}`;
}

export function formatChannelSelectionLine(
  meta: ChatChannelMeta,
  docsLink: (path: string, label?: string) => string,
): string {
  const docsPrefix = meta.selectionDocsPrefix ?? "Docs:";
  const docsLabel = meta.docsLabel ?? meta.id;
  const docs = meta.selectionDocsOmitLabel
    ? docsLink(meta.docsPath)
    : docsLink(meta.docsPath, docsLabel);
  const extras = (meta.selectionExtras ?? []).filter(Boolean).join(" ");
  return `${meta.label} — ${meta.blurb} ${docsPrefix ? `${docsPrefix} ` : ""}${docs}${extras ? ` ${extras}` : ""}`;
}
