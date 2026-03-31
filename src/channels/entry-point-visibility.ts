import type { ChannelMeta } from "./plugins/types.js";

export function shouldExposeChannelInEntryPoints(params: {
  cfg: unknown;
  meta: Pick<ChannelMeta, "id" | "deprecated">;
  env?: NodeJS.ProcessEnv;
}): boolean {
  void params;
  // This build intentionally removes all external channel entry points.
  return false;
}
