import type { PermissionTier } from "../config/types.tools.js";
import type { AnyAgentTool } from "./pi-tools.types.js";
import { resolveCoreToolPermissionTier } from "./tool-catalog.js";
import { normalizeToolName } from "./tool-policy.js";

const TIER_RANK: Record<PermissionTier, number> = {
  chat: 0,
  readonly: 1,
  readwrite: 2,
  dangerous: 3,
};

export function maxPermissionTier(left: PermissionTier, right: PermissionTier): PermissionTier {
  return TIER_RANK[left] >= TIER_RANK[right] ? left : right;
}

export function minPermissionTier(
  ...tiers: Array<PermissionTier | undefined>
): PermissionTier | undefined {
  const defined = tiers.filter((tier): tier is PermissionTier => Boolean(tier));
  if (defined.length === 0) {
    return undefined;
  }
  return defined.reduce((current, next) => (TIER_RANK[next] < TIER_RANK[current] ? next : current));
}

export function isPermissionTierAllowed(params: {
  required: PermissionTier;
  allowed?: PermissionTier;
}): boolean {
  if (!params.allowed) {
    return true;
  }
  return TIER_RANK[params.required] <= TIER_RANK[params.allowed];
}

function resolveDynamicPermissionTier(
  toolName: string,
  params: unknown,
): PermissionTier | undefined {
  if (toolName === "exec") {
    const host =
      typeof (params as { host?: unknown } | null | undefined)?.host === "string"
        ? (params as { host: string }).host.trim().toLowerCase()
        : "";
    if (host === "gateway" || host === "node") {
      return "dangerous";
    }
    return "readwrite";
  }
  if (toolName === "process") {
    return "readwrite";
  }
  return undefined;
}

export function resolveToolPermissionTier(params: {
  toolName: string;
  toolParams?: unknown;
  declaredTier?: PermissionTier;
  pluginId?: string;
}): PermissionTier {
  const toolName = normalizeToolName(params.toolName);
  const baseTier =
    params.declaredTier ??
    (params.pluginId ? "dangerous" : resolveCoreToolPermissionTier(toolName)) ??
    "dangerous";
  const dynamicTier = resolveDynamicPermissionTier(toolName, params.toolParams);
  return dynamicTier ? maxPermissionTier(baseTier, dynamicTier) : baseTier;
}

export function filterToolsByPermissionTier(params: {
  tools: AnyAgentTool[];
  allowedTier?: PermissionTier;
  toolMeta?: (tool: AnyAgentTool) => { pluginId: string } | undefined;
}): AnyAgentTool[] {
  if (!params.allowedTier || params.allowedTier === "dangerous") {
    return params.tools;
  }
  return params.tools.filter((tool) =>
    isPermissionTierAllowed({
      required: resolveToolPermissionTier({
        toolName: tool.name,
        declaredTier: tool.permissionTier,
        pluginId: params.toolMeta?.(tool)?.pluginId,
      }),
      allowed: params.allowedTier,
    }),
  );
}
