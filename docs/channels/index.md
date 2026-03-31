---
summary: "The retained chat surface for this build"
read_when:
  - You want to know which chat surface is still available
  - You need the retained WebChat entry point
title: "Chat Channels"
---

# Chat Channels

This build retains only the internal Gateway WebChat surface.
External chat channels are intentionally removed from runtime registration, setup flows, and the install catalog.

## Supported channels

- [WebChat](/web/webchat) — Gateway WebChat UI over WebSocket.

## Notes

- WebChat does not require a third-party messaging provider.
- Access is controlled by Gateway auth and Control UI availability.
- Historical per-channel docs now redirect back here.
- For setup details, see [WebChat](/web/webchat).
