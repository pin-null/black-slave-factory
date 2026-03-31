export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  formatTrimmedAllowFromEntries,
  getChatChannelMeta,
  looksLikeIMessageTargetId,
  normalizeIMessageMessagingTarget,
  resolveIMessageConfigAllowFrom,
  resolveIMessageConfigDefaultTo,
  IMessageConfigSchema,
  type ChannelPlugin,
  type IMessageAccountConfig,
} from "openclaw/plugin-sdk/imessage-core";
export {
  PAIRING_APPROVED_MESSAGE,
  collectStatusIssuesFromLastError,
  resolveChannelMediaMaxBytes,
} from "openclaw/plugin-sdk/channel-runtime";
export {
  resolveIMessageGroupRequireMention,
  resolveIMessageGroupToolPolicy,
} from "./src/group-policy.js";

export { monitorIMessageProvider } from "./src/monitor.js";
export type { MonitorIMessageOpts } from "./src/monitor.js";
export { probeIMessage } from "./src/probe.js";
export { sendMessageIMessage } from "./src/send.js";
