import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { OpenClawConfig } from "../config/config.js";
import { resolveStateDir } from "../config/paths.js";
import type {
  SecurityFirewallConfig,
  SecurityFirewallRule,
  SecurityFirewallRuleAction,
} from "../config/types.tools.js";
import { isPathInside } from "../infra/path-guards.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { normalizeStringEntries } from "../shared/string-normalization.js";
import { compileGlobPatterns, matchesAnyGlobPattern } from "./glob-pattern.js";
import { normalizeToolName } from "./tool-policy.js";

const log = createSubsystemLogger("security-firewall");

const OFFICE_PROMPT_GUARD =
  "You are restricted to office productivity tasks. Refuse system administration, " +
  "permissions changes, software installation, arbitrary host execution, and other " +
  "non-office actions unless a trusted operator has explicitly approved them.";

const OFFICE_DANGEROUS_COMMAND_FRAGMENTS = [
  "rm -rf /",
  "rm -rf ~",
  "chmod -r 777 /",
  "chown -r /",
  "sudo ",
  "launchctl",
  "systemctl",
  "service ",
  "shutdown",
  "reboot",
  "diskutil",
  "mkfs",
  "mount ",
  "umount ",
  "passwd ",
  "> /etc/",
  ">> /etc/",
  "tee /etc/",
];

const OFFICE_SENSITIVE_PATH_PREFIXES = [
  "/etc",
  "/bin",
  "/sbin",
  "/usr",
  "/System",
  "/Library",
  "/Applications",
  "~/.ssh",
  "~/.gnupg",
  "~/.openclaw",
];

const DEFAULT_AUDIT_LOG_PATH = path.join("logs", "security-firewall.jsonl");
const STRING_WALK_MAX_DEPTH = 4;
const STRING_WALK_MAX_ENTRIES = 128;
const APPLY_PATCH_PATH_PATTERNS = [
  /^\*\*\* Add File:\s+(.+?)\s*$/u,
  /^\*\*\* Update File:\s+(.+?)\s*$/u,
  /^\*\*\* Delete File:\s+(.+?)\s*$/u,
  /^\*\*\* Move to:\s+(.+?)\s*$/u,
];

export type SecurityFirewallContext = {
  config?: OpenClawConfig;
  toolName: string;
  params: unknown;
  senderId?: string | null;
  senderName?: string | null;
  senderUsername?: string | null;
  senderE164?: string | null;
  senderIsOwner?: boolean;
  workspaceDir?: string;
  requestText?: string;
};

export type SecurityFirewallDecision = {
  action: Exclude<SecurityFirewallRuleAction, "audit"> | "allow";
  reason?: string;
  matchedRuleId?: string;
};

type ParamString = {
  keyPath: string;
  value: string;
};

type ExtractedIntent = {
  toolName: string;
  requestText?: string;
  senderId?: string;
  senderName?: string;
  senderUsername?: string;
  senderE164?: string;
  paths: string[];
  commands: string[];
  urlHosts: string[];
};

function normalizeList(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) {
    return undefined;
  }
  const normalized = normalizeStringEntries(input);
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeLowerList(input: unknown): string[] | undefined {
  const normalized = normalizeList(input);
  return normalized?.map((entry) => entry.toLowerCase());
}

function expandHomePrefix(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("~/")) {
    return trimmed;
  }
  return path.join(os.homedir(), trimmed.slice(2));
}

function resolveRulePaths(input: unknown): string[] | undefined {
  const normalized = normalizeList(input);
  return normalized?.map((entry) => path.resolve(expandHomePrefix(entry)));
}

function collectParamStrings(input: unknown, out: ParamString[], keyPath = "", depth = 0): void {
  if (depth > STRING_WALK_MAX_DEPTH || out.length >= STRING_WALK_MAX_ENTRIES) {
    return;
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed) {
      out.push({ keyPath, value: trimmed });
    }
    return;
  }
  if (Array.isArray(input)) {
    for (const entry of input) {
      collectParamStrings(entry, out, keyPath, depth + 1);
      if (out.length >= STRING_WALK_MAX_ENTRIES) {
        return;
      }
    }
    return;
  }
  if (!input || typeof input !== "object") {
    return;
  }
  for (const [key, value] of Object.entries(input)) {
    const nextKeyPath = keyPath ? `${keyPath}.${key}` : key;
    if (
      (key === "argv" || key === "args") &&
      Array.isArray(value) &&
      value.every((item) => typeof item === "string" || typeof item === "number")
    ) {
      const joined = value
        .map((item) => String(item))
        .join(" ")
        .trim();
      if (joined) {
        out.push({ keyPath: nextKeyPath, value: joined });
      }
      continue;
    }
    collectParamStrings(value, out, nextKeyPath, depth + 1);
    if (out.length >= STRING_WALK_MAX_ENTRIES) {
      return;
    }
  }
}

function looksLikePathKey(keyPath: string): boolean {
  return /(^|\.)(path|paths|file|files|dir|dirs|cwd|root|workspace|target|targetdir|destination)$/i.test(
    keyPath,
  );
}

function looksLikeCommandKey(keyPath: string): boolean {
  return /(^|\.)(cmd|command|rawcommand|script|argv|args)$/i.test(keyPath);
}

function looksLikeUrlKey(keyPath: string): boolean {
  return /(^|\.)(url|uri|endpoint|link)$/i.test(keyPath);
}

function normalizePathSample(raw: string, workspaceDir?: string): string {
  const expanded = expandHomePrefix(raw);
  if (path.isAbsolute(expanded)) {
    return path.resolve(expanded);
  }
  if (workspaceDir) {
    return path.resolve(workspaceDir, expanded);
  }
  return path.resolve(expanded);
}

function extractApplyPatchPaths(params: unknown, workspaceDir?: string): string[] {
  if (!params || typeof params !== "object") {
    return [];
  }
  const input =
    typeof (params as { input?: unknown }).input === "string"
      ? (params as { input: string }).input
      : "";
  if (!input.trim()) {
    return [];
  }
  const paths = new Set<string>();
  for (const line of input.split(/\r?\n/u)) {
    const trimmed = line.trim();
    for (const pattern of APPLY_PATCH_PATH_PATTERNS) {
      const match = pattern.exec(trimmed);
      if (!match) {
        continue;
      }
      const candidate = match[1]?.trim();
      if (candidate) {
        paths.add(normalizePathSample(candidate, workspaceDir));
      }
      break;
    }
  }
  return [...paths];
}

function extractIntent(ctx: SecurityFirewallContext): ExtractedIntent {
  const toolName = normalizeToolName(ctx.toolName);
  const paramStrings: ParamString[] = [];
  collectParamStrings(ctx.params, paramStrings);

  const commands = new Set<string>();
  const paths = new Set<string>();
  const urlHosts = new Set<string>();

  for (const entry of paramStrings) {
    if (looksLikeCommandKey(entry.keyPath)) {
      commands.add(entry.value.toLowerCase());
    }
    if (looksLikePathKey(entry.keyPath)) {
      paths.add(normalizePathSample(entry.value, ctx.workspaceDir));
    }
    if (looksLikeUrlKey(entry.keyPath)) {
      try {
        const parsed = new URL(entry.value);
        if (parsed.hostname.trim()) {
          urlHosts.add(parsed.hostname.trim().toLowerCase());
        }
      } catch {
        // ignore non-URL strings
      }
    }
  }

  if (toolName === "apply_patch") {
    for (const patchPath of extractApplyPatchPaths(ctx.params, ctx.workspaceDir)) {
      paths.add(patchPath);
    }
  }

  return {
    toolName,
    requestText: ctx.requestText?.trim() || undefined,
    senderId: ctx.senderId?.trim() || undefined,
    senderName: ctx.senderName?.trim() || undefined,
    senderUsername: ctx.senderUsername?.trim() || undefined,
    senderE164: ctx.senderE164?.trim() || undefined,
    paths: [...paths],
    commands: [...commands],
    urlHosts: [...urlHosts],
  };
}

function buildOfficeProfileRules(): SecurityFirewallRule[] {
  return [
    {
      id: "office-admin-tools",
      action: "block",
      tools: ["cron", "gateway", "nodes", "whatsapp_login"],
      reason: "system administration tools are outside the office-only capability boundary",
    },
    {
      id: "office-shell-execution",
      action: "block",
      tools: ["exec", "process"],
      reason: "shell execution is outside the office-only capability boundary",
    },
    {
      id: "office-dangerous-exec",
      action: "block",
      tools: ["exec", "process"],
      commandContains: OFFICE_DANGEROUS_COMMAND_FRAGMENTS,
      reason: "dangerous host command pattern detected",
    },
    {
      id: "office-sensitive-files",
      action: "approval",
      tools: ["read", "write", "edit", "apply_patch"],
      pathPrefixes: OFFICE_SENSITIVE_PATH_PREFIXES,
      reason: "sensitive filesystem path requires explicit approval",
    },
    {
      id: "office-outside-workspace-writes",
      action: "approval",
      tools: ["write", "edit", "apply_patch"],
      outsideWorkspace: true,
      reason: "writes outside the agent workspace require explicit approval",
    },
    {
      id: "office-external-services",
      action: "approval",
      tools: ["browser", "message", "web_fetch", "web_search"],
      reason: "external service access requires explicit approval in office mode",
    },
    {
      id: "office-outside-workspace-read-audit",
      action: "audit",
      tools: ["read"],
      outsideWorkspace: true,
      reason: "outside-workspace read was allowed but recorded for audit",
    },
  ];
}

function resolveFirewallConfig(config?: OpenClawConfig): SecurityFirewallConfig | undefined {
  const firewall = config?.tools?.securityFirewall;
  if (!firewall?.enabled) {
    return undefined;
  }
  return firewall;
}

function resolvePromptGuard(config?: OpenClawConfig): string | undefined {
  const firewall = resolveFirewallConfig(config);
  if (!firewall) {
    return undefined;
  }
  const configured = firewall.promptGuard?.trim();
  if (configured) {
    return configured;
  }
  if (firewall.profile === "office") {
    return OFFICE_PROMPT_GUARD;
  }
  return undefined;
}

function getAuditLogPath(firewall: SecurityFirewallConfig): string {
  const configured = firewall.audit?.path?.trim();
  if (configured) {
    return path.resolve(expandHomePrefix(configured));
  }
  return path.join(resolveStateDir(), DEFAULT_AUDIT_LOG_PATH);
}

async function appendAuditRecord(params: {
  firewall: SecurityFirewallConfig;
  decision: SecurityFirewallRuleAction;
  ctx: SecurityFirewallContext;
  intent: ExtractedIntent;
  rule: SecurityFirewallRule;
}): Promise<void> {
  const auditEnabled = params.firewall.audit?.enabled ?? true;
  if (!auditEnabled) {
    return;
  }
  const auditPath = getAuditLogPath(params.firewall);
  const payload = {
    ts: new Date().toISOString(),
    action: params.decision,
    toolName: params.intent.toolName,
    ruleId: params.rule.id,
    reason: params.rule.reason,
    senderId: params.intent.senderId,
    senderName: params.intent.senderName,
    senderUsername: params.intent.senderUsername,
    senderE164: params.intent.senderE164,
    requestText: params.intent.requestText,
    paths: params.intent.paths,
    commands: params.intent.commands,
    urlHosts: params.intent.urlHosts,
  };
  try {
    await fs.mkdir(path.dirname(auditPath), { recursive: true });
    await fs.appendFile(auditPath, `${JSON.stringify(payload)}\n`, "utf8");
  } catch (err) {
    log.warn(`failed to append security-firewall audit log: ${String(err)}`);
  }
}

function matchSender(rule: SecurityFirewallRule, intent: ExtractedIntent): boolean {
  const senderIds = normalizeList(rule.senderIds);
  if (!senderIds || senderIds.length === 0) {
    return true;
  }
  const patterns = compileGlobPatterns({
    raw: senderIds,
    normalize: (value) => value.trim().toLowerCase(),
  });
  const values = [intent.senderId, intent.senderUsername, intent.senderE164, intent.senderName]
    .map((value) => value?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value));
  return values.some((value) => matchesAnyGlobPattern(value, patterns));
}

function matchTool(rule: SecurityFirewallRule, toolName: string): boolean {
  const tools = normalizeList(rule.tools);
  if (!tools || tools.length === 0) {
    return true;
  }
  const patterns = compileGlobPatterns({
    raw: tools,
    normalize: normalizeToolName,
  });
  return matchesAnyGlobPattern(toolName, patterns);
}

function matchRequest(rule: SecurityFirewallRule, requestText?: string): boolean {
  const requestContains = normalizeLowerList(rule.requestContains);
  if (!requestContains || requestContains.length === 0) {
    return true;
  }
  const normalized = requestText?.trim().toLowerCase() ?? "";
  return requestContains.some((fragment) => normalized.includes(fragment));
}

function matchCommands(rule: SecurityFirewallRule, commands: string[]): boolean {
  const commandContains = normalizeLowerList(rule.commandContains);
  if (!commandContains || commandContains.length === 0) {
    return true;
  }
  return commands.some((command) => commandContains.some((fragment) => command.includes(fragment)));
}

function matchPaths(rule: SecurityFirewallRule, paths: string[], workspaceDir?: string): boolean {
  const prefixes = resolveRulePaths(rule.pathPrefixes);
  const needsOutsideWorkspace = rule.outsideWorkspace === true;
  const workspaceRoot = workspaceDir ? path.resolve(workspaceDir) : undefined;
  let matchedPrefixes = prefixes === undefined || prefixes.length === 0;
  let matchedOutsideWorkspace = !needsOutsideWorkspace;

  for (const candidate of paths) {
    const normalized = path.resolve(candidate);
    if (!matchedPrefixes && prefixes) {
      const insideWorkspace = workspaceRoot ? isPathInside(workspaceRoot, normalized) : false;
      if (!insideWorkspace) {
        matchedPrefixes = prefixes.some(
          (prefix) => normalized === prefix || normalized.startsWith(`${prefix}${path.sep}`),
        );
      }
    }
    if (!matchedOutsideWorkspace && workspaceRoot) {
      matchedOutsideWorkspace = !isPathInside(workspaceRoot, normalized);
    }
  }

  return matchedPrefixes && matchedOutsideWorkspace;
}

function matchUrlHosts(rule: SecurityFirewallRule, urlHosts: string[]): boolean {
  const hosts = normalizeLowerList(rule.urlHosts);
  if (!hosts || hosts.length === 0) {
    return true;
  }
  return urlHosts.some((host) => hosts.includes(host));
}

function ruleMatches(params: {
  rule: SecurityFirewallRule;
  ctx: SecurityFirewallContext;
  intent: ExtractedIntent;
}): boolean {
  if (params.rule.ownerOnly === true && params.ctx.senderIsOwner !== true) {
    return false;
  }
  return (
    matchTool(params.rule, params.intent.toolName) &&
    matchSender(params.rule, params.intent) &&
    matchRequest(params.rule, params.intent.requestText) &&
    matchCommands(params.rule, params.intent.commands) &&
    matchPaths(params.rule, params.intent.paths, params.ctx.workspaceDir) &&
    matchUrlHosts(params.rule, params.intent.urlHosts)
  );
}

function buildDecisionReason(
  action: Exclude<SecurityFirewallRuleAction, "audit">,
  toolName: string,
  rule: SecurityFirewallRule,
): string {
  const detail = rule.reason?.trim();
  if (action === "approval") {
    return detail
      ? `Security firewall approval required for ${toolName}: ${detail}.`
      : `Security firewall approval required for ${toolName}.`;
  }
  return detail
    ? `Security firewall blocked ${toolName}: ${detail}.`
    : `Security firewall blocked ${toolName}.`;
}

function resolveRules(firewall: SecurityFirewallConfig): SecurityFirewallRule[] {
  return [
    ...(firewall.rules ?? []),
    ...(firewall.profile === "office" ? buildOfficeProfileRules() : []),
  ];
}

export function resolveSecurityFirewallPromptGuard(config?: OpenClawConfig): string | undefined {
  return resolvePromptGuard(config);
}

export async function evaluateSecurityFirewall(
  ctx: SecurityFirewallContext,
): Promise<SecurityFirewallDecision | undefined> {
  const firewall = resolveFirewallConfig(ctx.config);
  if (!firewall) {
    return undefined;
  }
  if (firewall.ownerBypass === true && ctx.senderIsOwner === true) {
    return undefined;
  }

  const intent = extractIntent(ctx);
  for (const rule of resolveRules(firewall)) {
    if (!ruleMatches({ rule, ctx, intent })) {
      continue;
    }
    await appendAuditRecord({
      firewall,
      decision: rule.action,
      ctx,
      intent,
      rule,
    });
    if (rule.action === "audit") {
      continue;
    }
    return {
      action: rule.action,
      reason: buildDecisionReason(rule.action, intent.toolName, rule),
      matchedRuleId: rule.id,
    };
  }

  return undefined;
}
