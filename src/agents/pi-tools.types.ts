import type { AgentTool } from "@mariozechner/pi-agent-core";
import type { PermissionTier } from "../config/types.tools.js";

// oxlint-disable-next-line typescript/no-explicit-any
export type AnyAgentTool = AgentTool<any, unknown> & {
  ownerOnly?: boolean;
  permissionTier?: PermissionTier;
};
