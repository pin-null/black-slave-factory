---
summary: "Readiness checklist for the retained WebChat surface"
read_when:
  - You want to verify that WebChat is ready to use
  - You need the retained channel readiness checklist after external channel removal
title: "Channel Integration Conditions"
---

# Channel Integration Conditions

This build keeps only the internal Gateway WebChat surface.
External messaging channels are removed from active runtime registration, so the readiness model is now much smaller.

## Unified readiness model

Use this model for WebChat:

| Check           | What it means                                        | Typical source of truth                   | Why it matters                                        |
| --------------- | ---------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| Gateway running | The Gateway process is online                        | `/health`, process state                  | WebChat cannot connect unless the Gateway is live     |
| UI enabled      | Control UI and WebChat surface are exposed           | `gateway.controlUi` config                | Without this, there is no browser chat surface        |
| Auth valid      | Browser or client has valid Gateway auth             | Gateway auth mode + client token/password | Prevents unauthorized WebSocket access                |
| Access allowed  | Origin or trusted-proxy checks permit the connection | Gateway auth / connection policy          | A live Gateway can still reject the client connection |

## Decision order

In practice, WebChat readiness is best checked in this order:

1. Gateway is running.
2. Control UI is enabled.
3. Auth material is correct.
4. The browser or client connection passes access policy.

### WebChat

Minimum conditions:

- Gateway is running.
- Control UI is enabled.
- Gateway auth permits the browser or client connection.

Typical blockers:

- gateway not started
- auth token or password mismatch
- trusted-proxy or origin policy mismatch

See [WebChat](/web/webchat).
