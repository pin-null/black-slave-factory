import type { PermissionTier } from "../config/types.tools.js";
import { minPermissionTier, resolveToolPermissionTier } from "./tool-permission-tier.js";
import type { AnyAgentTool } from "./tools/common.js";

export type PermissionSnapshot = {
  tier: PermissionTier;
  allowedCapabilities: string[];
  blockedCapabilities: string[];
  notes: string[];
};

const PERMISSION_SECTION_HEADING = "## Runtime Permissions (enforced)";

const TIER_ALLOWED_CAPABILITIES: Record<PermissionTier, string[]> = {
  chat: ["Pure text conversation, document drafting, and knowledge Q&A"],
  readonly: [
    "Pure text conversation, document drafting, and knowledge Q&A",
    "Read-only tools: file reads, data queries, and read-only plugin/tools",
  ],
  readwrite: [
    "Pure text conversation, document drafting, and knowledge Q&A",
    "Read-only tools: file reads, data queries, and read-only plugin/tools",
    "Read/write tools: file edits, sandbox code execution, and internal APIs",
  ],
  dangerous: [
    "Pure text conversation, document drafting, and knowledge Q&A",
    "Read-only tools: file reads, data queries, and read-only plugin/tools",
    "Read/write tools: file edits, sandbox code execution, and internal APIs",
    "High-risk tools: browser control, host/system operations, and external API actions",
  ],
};

const TIER_BLOCKED_CAPABILITIES: Record<PermissionTier, string[]> = {
  chat: ["Read-only tools", "Read/write tools", "High-risk tools"],
  readonly: ["Read/write tools", "High-risk tools"],
  readwrite: ["High-risk tools"],
  dangerous: [],
};

function resolveHighestToolTier(
  tools?: Array<Pick<AnyAgentTool, "name" | "permissionTier">>,
): PermissionTier | undefined {
  const resolvedTiers = (tools ?? [])
    .map((tool) =>
      resolveToolPermissionTier({
        toolName: tool.name,
        declaredTier: tool.permissionTier,
      }),
    )
    .filter(Boolean);
  if (resolvedTiers.length === 0) {
    return undefined;
  }
  return resolvedTiers.reduce((current, next) =>
    TIER_ALLOWED_CAPABILITIES[next].length > TIER_ALLOWED_CAPABILITIES[current].length
      ? next
      : current,
  );
}

function buildPermissionNotes(params: {
  tier: PermissionTier;
  tools?: Array<Pick<AnyAgentTool, "name" | "permissionTier">>;
}) {
  const normalizedToolNames = new Set(
    (params.tools ?? []).map((tool) => String(tool.name).trim().toLowerCase()).filter(Boolean),
  );
  const notes: string[] = [];
  if (params.tier !== "dangerous" && normalizedToolNames.has("exec")) {
    notes.push(
      "`exec` is limited to sandbox/local use; gateway/node hosts require dangerous tier.",
    );
  }
  return notes;
}

export function buildPermissionSnapshot(params?: {
  configuredTier?: PermissionTier;
  tools?: Array<Pick<AnyAgentTool, "name" | "permissionTier">>;
}): PermissionSnapshot {
  const derivedTier = resolveHighestToolTier(params?.tools);
  const tier = minPermissionTier(params?.configuredTier, derivedTier) ?? derivedTier ?? "chat";
  return {
    tier,
    allowedCapabilities: [...TIER_ALLOWED_CAPABILITIES[tier]],
    blockedCapabilities: [...TIER_BLOCKED_CAPABILITIES[tier]],
    notes: buildPermissionNotes({ tier, tools: params?.tools }),
  };
}

export function formatPermissionSnapshotSection(snapshot: PermissionSnapshot): string {
  return [
    PERMISSION_SECTION_HEADING,
    `Current permission tier: ${snapshot.tier}`,
    "Allowed capabilities:",
    ...snapshot.allowedCapabilities.map((line) => `- ${line}`),
    ...(snapshot.blockedCapabilities.length > 0
      ? ["Blocked capabilities:", ...snapshot.blockedCapabilities.map((line) => `- ${line}`)]
      : []),
    ...(snapshot.notes.length > 0
      ? ["Special limits:", ...snapshot.notes.map((line) => `- ${line}`)]
      : []),
  ].join("\n");
}

export function appendPermissionSnapshotToSystemPrompt(params: {
  systemPrompt: string;
  permissionSnapshot: PermissionSnapshot;
}): string {
  const basePrompt = params.systemPrompt.trim();
  if (!basePrompt) {
    return formatPermissionSnapshotSection(params.permissionSnapshot);
  }
  if (basePrompt.includes(PERMISSION_SECTION_HEADING)) {
    return basePrompt;
  }
  return `${basePrompt}\n\n${formatPermissionSnapshotSection(params.permissionSnapshot)}`;
}
