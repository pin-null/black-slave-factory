import type { OutboundSendDeps } from "../infra/outbound/send-deps.js";
import { createOutboundSendDepsFromCliSource } from "./outbound-send-mapping.js";

export type CliDeps = { [channelId: string]: unknown };

export function createDefaultDeps(): CliDeps {
  // This build retains only the internal webchat surface, so there are no
  // external channel send runtimes to lazy-load here.
  return {};
}

export function createOutboundSendDeps(deps: CliDeps): OutboundSendDeps {
  return createOutboundSendDepsFromCliSource(deps);
}

export { logWebSelfId } from "../plugins/runtime/runtime-whatsapp-boundary.js";
