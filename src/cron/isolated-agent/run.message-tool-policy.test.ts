import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearFastTestEnv,
  loadRunCronIsolatedAgentTurn,
  mockRunCronFallbackPassthrough,
  resetRunCronIsolatedAgentTurnHarness,
  resolveCronDeliveryPlanMock,
  resolveDeliveryTargetMock,
  restoreFastTestEnv,
  runEmbeddedPiAgentMock,
  runWithModelFallbackMock,
} from "./run.test-harness.js";

const runCronIsolatedAgentTurn = await loadRunCronIsolatedAgentTurn();

function makeParams() {
  return {
    cfg: {},
    deps: {} as never,
    job: {
      id: "message-tool-policy",
      name: "Message Tool Policy",
      schedule: { kind: "every", everyMs: 60_000 },
      sessionTarget: "isolated",
      payload: { kind: "agentTurn", message: "send a message" },
      delivery: { mode: "none" },
    } as never,
    message: "send a message",
    sessionKey: "cron:message-tool-policy",
  };
}

describe("runCronIsolatedAgentTurn message tool policy", () => {
  let previousFastTestEnv: string | undefined;

  async function expectMessageToolDisabledForPlan(plan: {
    requested: boolean;
    mode: "none" | "announce";
    channel?: string;
    to?: string;
  }) {
    mockRunCronFallbackPassthrough();
    resolveCronDeliveryPlanMock.mockReturnValue(plan);
    await runCronIsolatedAgentTurn(makeParams());
    expect(runEmbeddedPiAgentMock).toHaveBeenCalledTimes(1);
    expect(runEmbeddedPiAgentMock.mock.calls[0]?.[0]?.disableMessageTool).toBe(true);
  }

  beforeEach(() => {
    previousFastTestEnv = clearFastTestEnv();
    resetRunCronIsolatedAgentTurnHarness();
    resolveDeliveryTargetMock.mockResolvedValue({
      ok: true,
      channel: "telegram",
      to: "123",
      accountId: undefined,
      error: undefined,
    });
  });

  afterEach(() => {
    restoreFastTestEnv(previousFastTestEnv);
  });

  it('disables the message tool when delivery.mode is "none"', async () => {
    await expectMessageToolDisabledForPlan({
      requested: false,
      mode: "none",
    });
  });

  it("disables the message tool when cron delivery is active", async () => {
    await expectMessageToolDisabledForPlan({
      requested: true,
      mode: "announce",
      channel: "telegram",
      to: "123",
    });
  });

  it("keeps the message tool enabled for shared callers when delivery is not requested", async () => {
    mockRunCronFallbackPassthrough();
    resolveCronDeliveryPlanMock.mockReturnValue({
      requested: false,
      mode: "none",
    });

    await runCronIsolatedAgentTurn({
      ...makeParams(),
      deliveryContract: "shared",
    });

    expect(runEmbeddedPiAgentMock).toHaveBeenCalledTimes(1);
    expect(runEmbeddedPiAgentMock.mock.calls[0]?.[0]?.disableMessageTool).toBe(false);
  });

  it("caps the cron run config with payload.permissionTier", async () => {
    mockRunCronFallbackPassthrough();
    resolveCronDeliveryPlanMock.mockReturnValue({
      requested: false,
      mode: "none",
    });
    const params = makeParams();
    const baseJob = params.job as Record<string, unknown>;

    await runCronIsolatedAgentTurn({
      ...params,
      cfg: {
        tools: { permissionTier: "dangerous" },
      },
      job: {
        ...baseJob,
        payload: {
          kind: "agentTurn",
          message: "send a message",
          permissionTier: "readonly",
        },
      } as never,
    });

    expect(runWithModelFallbackMock).toHaveBeenCalledTimes(1);
    expect(runWithModelFallbackMock.mock.calls[0]?.[0]?.cfg?.tools?.permissionTier).toBe(
      "readonly",
    );
  });
});
