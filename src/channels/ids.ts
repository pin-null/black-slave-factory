// Keep built-in channel IDs in a leaf module so shared config/sandbox code can
// reference them without importing channel registry helpers that may pull in
// plugin runtime state.
export type ChatChannelId =
  | "telegram"
  | "whatsapp"
  | "discord"
  | "irc"
  | "slack"
  | "signal"
  | "imessage"
  | "line";

export const REMOVED_CHAT_CHANNEL_IDS = ["googlechat"] as const;

// External channels are intentionally removed from the active runtime/UI.
// Keep the display order empty while preserving the full built-in id list for
// internal compatibility layers such as config normalization and outbound
// routing.
export const CHAT_CHANNEL_ORDER: readonly ChatChannelId[] = [];

export const CHANNEL_IDS = [
  "telegram",
  "whatsapp",
  "discord",
  "irc",
  "slack",
  "signal",
  "imessage",
  "line",
] as const satisfies readonly ChatChannelId[];
