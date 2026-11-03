import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useLiveStreamAmount } from "./useLiveStreamAmount";
import { Stream } from "../types/stream";

describe("useLiveStreamAmount", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates continuous vesting accurately over time", () => {
    const now = 1000000;
    vi.setSystemTime(now * 1000);

    const mockStream: Stream = {
      id: "stream-1",
      sender: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      recipient: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      totalAmount: 1000,
      durationSeconds: 1000,
      startAt: now,
      createdAt: now,
      assetCode: "USDC",
      progress: {
        status: "active",
        ratePerSecond: 1,
        elapsedSeconds: 0,
        vestedAmount: 0,
        remainingAmount: 1000,
        percentComplete: 0,
      },
    };

    const { result } = renderHook(() => useLiveStreamAmount(mockStream));
    expect(result.current.streamedAmount).toBe(0);
    expect(result.current.percentComplete).toBe(0);

    // Fast-forward 500 seconds (50% through duration)
    act(() => {
      vi.advanceTimersByTime(500 * 1000);
    });

    expect(result.current.streamedAmount).toBeCloseTo(500, 1);
    expect(result.current.percentComplete).toBeCloseTo(50, 1);
    expect(result.current.streamedFormatted).toBe("500.000000");
  });

  it("respects cliff timing before vesting begins", () => {
    const now = 1000000;
    vi.setSystemTime(now * 1000);

    const mockStream: Stream = {
      id: "stream-2",
      sender: "GAAA",
      recipient: "GBBB",
      totalAmount: 1000,
      durationSeconds: 1000,
      startAt: now,
      cliffSeconds: 300, // 300s cliff
      createdAt: now,
      assetCode: "USDC",
      progress: {
        status: "active",
        ratePerSecond: 1,
        elapsedSeconds: 0,
        vestedAmount: 0,
        remainingAmount: 1000,
        percentComplete: 0,
      },
    };

    const { result } = renderHook(() => useLiveStreamAmount(mockStream));
    
    // Fast-forward 200 seconds (before cliff)
    act(() => {
      vi.advanceTimersByTime(200 * 1000);
    });
    expect(result.current.isCliffActive).toBe(true);
    expect(result.current.streamedAmount).toBe(0);

    // Fast-forward another 150 seconds (total 350s, past cliff)
    act(() => {
      vi.advanceTimersByTime(150 * 1000);
    });
    expect(result.current.isCliffActive).toBe(false);
    expect(result.current.streamedAmount).toBeCloseTo(350, 1);
  });
});

