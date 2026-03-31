---
summary: "Capability-hardening plan for office-only skills, pre-tool firewall checks, and channel integration modes"
title: Capability Hardening Plan
read_when:
  - You are reviewing the current capability-restriction design
  - You want one document covering skill restrictions, firewall hooks, and channel integration modes
status: draft
---

# Capability Hardening Plan

This document summarizes the modification plan and current implementation direction for restricting OpenClaw to an office-oriented capability boundary.

It covers four areas:

- narrowing `skill-creator`
- limiting which skills can be loaded, synced, or installed
- adding a hook-style security firewall before tool execution
- classifying the supported channel integration modes

## Goal

The target posture is:

- office productivity tasks are allowed
- system administration and host-level changes are restricted
- risky tool use is intercepted before execution
- non-office skills are rejected early
- channel onboarding follows a clear readiness model

## 1. `skill-creator` restriction plan

### Intent

`skill-creator` should no longer act as a general-purpose skill authoring assistant.
It should be constrained to office productivity workflows only.

Examples of allowed skill categories:

- calendar and schedule management
- meeting reminders and meeting notices
- task tracking
- note capture
- report drafting
- approval or back-office workflow helpers

Examples of refused categories:

- system administration
- permission changes
- shell execution
- security testing
- device control
- home automation
- entertainment or gaming
- unrestricted code execution

### Implementation direction

The `skill-creator` skill is narrowed in `skills/skill-creator/SKILL.md`.

Core changes:

- update the skill description so it explicitly targets office productivity
- add an office-only boundary section
- require newly authored skills to declare `metadata.openclaw.categories`
- require the category list to include `office`
- refuse mixed requests unless the request can be narrowed to an office-safe subset

### Expected outcome

This changes `skill-creator` from "create any skill" to "create only office-safe skills."

## 2. Skill restriction plan

### Intent

Skills should not be accepted purely because they exist on disk.
They should be classified and filtered before they are exposed to the model or installed into active workspaces.

### Config model

The restriction model is based on category policy in `skills`.

Planned and implemented config shape:

```json5
{
  skills: {
    policy: {
      allowedCategories: ["office"],
      rejectUncategorized: true,
    },
    entries: {
      "meeting-helper": {
        categories: ["office"],
      },
    },
  },
}
```

Meaning:

- `skills.policy.allowedCategories`: global allowlist of accepted skill categories
- `skills.policy.rejectUncategorized`: block skills that do not declare a category
- `skills.entries.<skill>.categories`: operator override for skill classification

### Enforcement points

The category policy should apply at multiple layers, not just at prompt rendering.

Current enforcement points:

- skill eligibility filtering before prompt inclusion
- skill status and onboarding visibility
- sync of skills into child workspaces
- skill install path

This means a blocked skill should:

- not appear in the model prompt
- not appear as eligible in skill status
- not be copied into synced sandbox or child workspaces
- not be installable through the skill installer flow

### Metadata contract

Skills should declare categories in frontmatter metadata:

```markdown
---
name: meeting-helper
description: Prepare meeting reminders and summaries
metadata: { "openclaw": { "categories": ["office", "calendar"] } }
---
```

### Recommended future hardening

Category declarations are useful, but they are still self-declared metadata.
For stricter control, the next layer should scan the actual skill content.

Recommended next step:

- inspect `SKILL.md`
- inspect referenced scripts or handler files
- reject installation when the skill behavior is not office-oriented even if its metadata claims `office`

That semantic scan should act as a second gate on top of declared categories.

## 3. Security firewall and hooks plan

### Design choice

The desired behavior looks like a security hook, but the strongest interception point is not the ordinary internal hook event system by itself.

For hard blocking, the design should use:

- a pre-tool execution firewall
- plus optional event and audit hooks

### Why not rely only on normal internal hooks

Standard internal hooks are good for:

- command events
- lifecycle automation
- logging
- memory snapshots

They are not the best place for guaranteed side-effect prevention, because many of them run after intent has already been formed and are not the narrowest execution gate.

For a real "firewall," the best interception point is the tool call boundary.

### Firewall model

The security firewall behaves like a pre-tool hook with four phases:

1. Listen
   Capture the incoming request and tool invocation attempt.
2. Extract
   Extract sender identity, request text, tool name, candidate paths, command fragments, and URL hosts.
3. Validate
   Match against policy rules, profiles, and allow or deny logic.
4. Act
   Allow, block, require approval, or audit.

### Config model

```json5
{
  tools: {
    securityFirewall: {
      enabled: true,
      profile: "office",
      ownerBypass: false,
      audit: {
        enabled: true,
        path: "~/.openclaw/logs/security-firewall.jsonl",
      },
      rules: [
        {
          id: "calendar-http",
          action: "approval",
          tools: ["web_*"],
          urlHosts: ["calendar.example.com"],
          reason: "Calendar API calls require operator approval.",
        },
      ],
    },
  },
}
```

### Restriction levels

The intended restriction levels are:

| Level      | Meaning                                   | Typical use                                                    |
| ---------- | ----------------------------------------- | -------------------------------------------------------------- |
| `block`    | hard-stop before execution                | dangerous shell, gateway admin, destructive system operations  |
| `approval` | execution should pause for human approval | sensitive reads or writes, external service calls, data export |
| `audit`    | execution may continue but must be logged | low-risk but sensitive visibility actions                      |

### Office baseline profile

The office profile is meant to:

- block shell execution as a general office boundary
- block admin-style tools such as gateway or cron control
- require approval for sensitive filesystem access
- require approval for selected external-service calls
- audit some out-of-workspace reads
- append a prompt guard that reminds the model it is restricted to office work

### Relationship to hooks

There are two hook-related roles here:

- **internal hooks**
  Good for lifecycle automation, logging, memory snapshots, and bootstrap augmentation.
- **security firewall**
  Good for blocking or gating tool execution before side effects happen.

In other words:

- ordinary hooks are event-driven automation
- the firewall is a capability-enforcement gate

### Current limitation

The `approval` action is currently best treated as an approval-required block signal, not yet as a fully integrated universal UI approval-card flow.

That means:

- `block` is a real hard stop
- `audit` is a real audit trail
- `approval` means "stop here and require operator approval logic"

The next phase would be to wire this into a first-class approval UX.

## 4. Channel integration modes

### Intent

Channels do not all integrate the same way.
To reason about readiness and support, it helps to split them by onboarding model.

### Unified readiness order

Every channel should be evaluated in this order:

1. plugin loaded
2. account enabled
3. configuration valid
4. link or transport connected
5. DM or group access policy allows the message

That produces the practical readiness chain:

`loaded -> enabled -> configured -> linked/connected -> access allowed`

### Channel integration families

#### A. Token or secret direct connection

These channels are brought up with bot tokens, API tokens, secrets, or app credentials.

Examples:

- Telegram
- Discord
- Slack
- Mattermost
- Feishu
- IRC
- Nostr
- Tlon
- Twitch
- Zalo

Typical blocker:

- wrong or missing credential

#### B. QR or login bound session

These channels require logging a real account into OpenClaw through a QR or device-link flow.

Examples:

- WhatsApp
- Zalo Personal

Typical blocker:

- login session never linked or expired

#### C. Local bridge or helper-backed integration

These channels depend on a local host helper, CLI, or bridge service.

Examples:

- Signal

Typical blocker:

- helper not installed, not reachable, or missing host permissions

#### D. Webhook or callback delivery

These channels depend on the provider being able to call back into the gateway.

Examples:

- LINE
- Microsoft Teams
- Nextcloud Talk
- Synology Chat

Typical blocker:

- callback URL not reachable or secret mismatch

#### E. Built-in web surface

This is OpenClaw's own web surface rather than a third-party messaging app.

Example:

- [WebChat](/web/webchat)

Typical blocker:

- gateway auth or Control UI access policy

## Recommended operating model

If the goal is a controlled office assistant, the recommended stack is:

- `tools.securityFirewall.enabled = true`
- `tools.securityFirewall.profile = "office"`
- `skills.policy.allowedCategories = ["office"]`
- `skills.policy.rejectUncategorized = true`
- `skill-creator` kept office-only
- non-office skills rejected from install and sync paths

This combination gives:

- model-level narrowing
- load-time skill filtering
- install-time skill restriction
- execution-time tool interception

## Suggested next phase

To complete the design, the next phase should add two things:

1. A real approval workflow for firewall `approval` actions.
2. Content scanning for newly imported skills so category policy is not only metadata-driven.

## Implementation map

The current design and implementation touch these main surfaces:

- `skills/skill-creator/SKILL.md`
- `src/agents/skills/config.ts`
- `src/agents/skills-status.ts`
- `src/agents/skills/workspace.ts`
- `src/agents/skills-install.ts`
- `src/agents/security-firewall.ts`
- `src/agents/pi-tools.before-tool-call.ts`
- `src/auto-reply/reply/get-reply-run.ts`
- `src/config/types.skills.ts`
- `src/config/types.tools.ts`
- `src/config/zod-schema.ts`
- `src/config/zod-schema.agent-runtime.ts`

For channel integration classification and readiness logic, see also:

- [Channel Integration Conditions](/channels/integration-conditions)
- [Chat Channels](/channels)
- [Hooks](/automation/hooks)
