import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  streams: new Map<string, any>(),
  events: [] as any[],
  webhooks: [] as any[],
}));

const dbMocks = vi.hoisted(() => ({
  syncFtsIndex: vi.fn(),
  getDb: vi.fn(() => ({
    transaction: vi.fn((callback: () => any) => callback),
    prepare: vi.fn((query: string) => ({
      run: vi.fn((params: any) => {
        if (query.includes("INSERT INTO streams")) {
          mockState.streams.set(params.id, {
            id: params.id,
            sender: params.sender,
            recipient: params.recipient,
            assetCode: params.assetCode,
            totalAmount: params.totalAmount,
            durationSeconds: params.durationSeconds,
            startAt: params.startAt,
            createdAt: params.createdAt,
            canceledAt: params.canceledAt ?? undefined,
            completedAt: params.completedAt ?? undefined,
            refundedAmount: params.refundedAmount ?? undefined,
            archivedAt: params.archivedAt ?? undefined,
            pausedAt: params.pausedAt ?? undefined,
            pausedDuration: params.pausedDuration ?? 0,
            cliffSeconds: params.cliffSeconds ?? 0,
            metadata: params.metadata ? JSON.parse(params.metadata) : null,
          });
        }
      }),
      get: vi.fn((params: any) => {
        const id = typeof params === "string" ? params : params?.id;
        const s = mockState.streams.get(id);
        if (!s) return undefined;
        return {
          id: s.id,
          sender: s.sender,
          recipient: s.recipient,
          asset_code: s.assetCode,
          total_amount: s.totalAmount,
          duration_seconds: s.durationSeconds,
          start_at: s.startAt,
          created_at: s.createdAt,
          canceled_at: s.canceledAt ?? null,
          completed_at: s.completedAt ?? null,
          refunded_amount: s.refundedAmount ?? null,
          archived_at: s.archivedAt ?? null,
          paused_at: s.pausedAt ?? null,
          paused_duration: s.pausedDuration ?? 0,
          cliff_seconds: s.cliffSeconds ?? 0,
          metadata: s.metadata ? JSON.stringify(s.metadata) : null,
        };
      }),
    })),
  })),
}));

const cacheMocks = vi.hoisted(() => ({
  initCache: vi.fn(),
  getCache: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    clear: vi.fn(),
    isConnected: vi.fn(() => true),
  })),
  invalidateCacheSync: vi.fn(),
}));

const eventHistoryMocks = vi.hoisted(() => ({
  recordEventWithDb: vi.fn((_db: any, streamId: string, eventType: string, timestamp: number, actor?: string, amount?: number, metadata?: any) => {
    mockState.events.push({
      streamId,
      eventType,
      timestamp,
      actor,
      amount,
      metadata,
    });
  }),
  getClaimedTotal: vi.fn(() => 0),
  streamHasEvent: vi.fn(() => false),
}));

const webhookMocks = vi.hoisted(() => ({
  triggerWebhook: vi.fn((event: string, stream: any) => {
    mockState.webhooks.push({ event, stream });
  }),
}));

vi.mock("./db", () => ({
  getDb: dbMocks.getDb,
  syncFtsIndex: dbMocks.syncFtsIndex,
}));

vi.mock("./cache", () => ({
  initCache: cacheMocks.initCache,
  getCache: cacheMocks.getCache,
  invalidateCacheSync: cacheMocks.invalidateCacheSync,
}));

vi.mock("./eventHistory", () => ({
  recordEventWithDb: eventHistoryMocks.recordEventWithDb,
  getClaimedTotal: eventHistoryMocks.getClaimedTotal,
  streamHasEvent: eventHistoryMocks.streamHasEvent,
}));

vi.mock("./webhook", () => ({
  triggerWebhook: webhookMocks.triggerWebhook,
}));

describe("streamStore - topUpStream & extendStream", () => {
  const frozenNow = 1700000000;

  beforeEach(() => {
    vi.clearAllMocks();
    mockState.streams.clear();
    mockState.events = [];
    mockState.webhooks = [];
    vi.spyOn(Date, "now").mockReturnValue(frozenNow * 1000);
  });

  it("successfully tops up an active stream and records event & webhook", async () => {
    const { topUpStream, calculateProgress } = await import("./streamStore");
    const activeStream = {
      id: "topup-1",
      sender: "GSENDER",
      recipient: "GRECIPIENT",
      assetCode: "USDC",
      totalAmount: 100,
      durationSeconds: 1000,
      startAt: frozenNow - 200,
      createdAt: frozenNow - 200,
      pausedDuration: 0,
      cliffSeconds: 0,
    };
    mockState.streams.set("topup-1", activeStream);

    const updated = await topUpStream("topup-1", 50);
    expect(updated.totalAmount).toBe(150);

    const progress = calculateProgress(updated, frozenNow);
    expect(progress.ratePerSecond).toBe(0.15);

    expect(mockState.events).toHaveLength(1);
    expect(mockState.events[0]).toMatchObject({
      streamId: "topup-1",
      eventType: "topped_up",
      amount: 50,
      actor: "GSENDER",
    });

    expect(mockState.webhooks).toHaveLength(1);
    expect(mockState.webhooks[0].event).toBe("topped_up");
  });

  it("rejects top-up on canceled streams", async () => {
    const { topUpStream } = await import("./streamStore");
    mockState.streams.set("canceled-1", {
      id: "canceled-1",
      sender: "GSENDER",
      recipient: "GRECIPIENT",
      assetCode: "USDC",
      totalAmount: 100,
      durationSeconds: 1000,
      startAt: frozenNow - 200,
      createdAt: frozenNow - 200,
      canceledAt: frozenNow - 50,
      pausedDuration: 0,
      cliffSeconds: 0,
    });

    await expect(topUpStream("canceled-1", 20)).rejects.toThrow(
      "Only active or scheduled streams can be topped up.",
    );
  });

  it("successfully extends duration of an active stream and recalculates rate", async () => {
    const { extendStream, calculateProgress } = await import("./streamStore");
    const activeStream = {
      id: "extend-1",
      sender: "GSENDER",
      recipient: "GRECIPIENT",
      assetCode: "USDC",
      totalAmount: 200,
      durationSeconds: 1000,
      startAt: frozenNow - 200,
      createdAt: frozenNow - 200,
      pausedDuration: 0,
      cliffSeconds: 0,
    };
    mockState.streams.set("extend-1", activeStream);

    const updated = await extendStream("extend-1", 1000);
    expect(updated.durationSeconds).toBe(2000);

    const progress = calculateProgress(updated, frozenNow);
    expect(progress.ratePerSecond).toBe(0.1);

    expect(mockState.events).toHaveLength(1);
    expect(mockState.events[0]).toMatchObject({
      streamId: "extend-1",
      eventType: "extended",
      actor: "GSENDER",
    });

    expect(mockState.webhooks).toHaveLength(1);
    expect(mockState.webhooks[0].event).toBe("extended");
  });

  it("rejects extending duration by zero or negative seconds", async () => {
    const { extendStream } = await import("./streamStore");
    mockState.streams.set("extend-2", {
      id: "extend-2",
      sender: "GSENDER",
      recipient: "GRECIPIENT",
      assetCode: "USDC",
      totalAmount: 200,
      durationSeconds: 1000,
      startAt: frozenNow - 200,
      createdAt: frozenNow - 200,
      pausedDuration: 0,
      cliffSeconds: 0,
    });

    await expect(extendStream("extend-2", 0)).rejects.toThrow(
      "additionalDurationSeconds must be greater than zero.",
    );
  });
});

