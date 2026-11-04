import { useState, useEffect, useCallback } from "react";
import type { Stream, StreamStatus } from "../types/stream";

export interface LiveStreamAmountResult {
  streamedAmount: number;
  streamedFormatted: string;
  percentComplete: number;
  isCliffActive: boolean;
  status: StreamStatus;
}

export function useLiveStreamAmount(stream: Stream): LiveStreamAmountResult {
  const calculate = useCallback((): LiveStreamAmountResult => {
    const status = stream.progress?.status || "active";
    const total = Number(stream.totalAmount) || 0;
    const duration = Number(stream.durationSeconds) || 0;
    const startAt = Number(stream.startAt) || 0;
    const stopAt = startAt + duration;
    const cliffSeconds = Number(stream.cliffSeconds) || 0;
    const cliffAt = startAt + cliffSeconds;

    if (status === "completed") {
      return {
        streamedAmount: total,
        streamedFormatted: total.toFixed(6),
        percentComplete: 100,
        isCliffActive: false,
        status,
      };
    }

    if (status === "canceled" || status === "paused") {
      const vested = Number(stream.progress?.vestedAmount) || 0;
      const pct = total > 0 ? Math.min(100, (vested / total) * 100) : 0;
      return {
        streamedAmount: vested,
        streamedFormatted: vested.toFixed(6),
        percentComplete: pct,
        isCliffActive: false,
        status,
      };
    }

    const now = Date.now() / 1000;

    if (now < startAt) {
      return {
        streamedAmount: 0,
        streamedFormatted: "0.000000",
        percentComplete: 0,
        isCliffActive: cliffSeconds > 0,
        status: "scheduled",
      };
    }

    if (cliffSeconds > 0 && now < cliffAt) {
      return {
        streamedAmount: 0,
        streamedFormatted: "0.000000",
        percentComplete: 0,
        isCliffActive: true,
        status: "active",
      };
    }

    if (duration <= 0 || now >= stopAt) {
      return {
        streamedAmount: total,
        streamedFormatted: total.toFixed(6),
        percentComplete: 100,
        isCliffActive: false,
        status: "completed",
      };
    }

    const elapsed = now - startAt;
    const rate = total / duration;
    const streamed = Math.min(total, elapsed * rate);
    const pct = total > 0 ? (streamed / total) * 100 : 0;

    return {
      streamedAmount: streamed,
      streamedFormatted: streamed.toFixed(6),
      percentComplete: Math.min(100, Math.max(0, pct)),
      isCliffActive: false,
      status: "active",
    };
  }, [
    stream.totalAmount,
    stream.durationSeconds,
    stream.startAt,
    stream.cliffSeconds,
    stream.progress?.status,
    stream.progress?.vestedAmount,
  ]);

  const [state, setState] = useState<LiveStreamAmountResult>(calculate);

  useEffect(() => {
    setState(calculate());

    const status = stream.progress?.status;
    if (status === "completed" || status === "canceled") {
      return;
    }

    const interval = setInterval(() => {
      setState(calculate());
    }, 100);

    return () => clearInterval(interval);
  }, [calculate, stream.progress?.status]);

  return state;
}

