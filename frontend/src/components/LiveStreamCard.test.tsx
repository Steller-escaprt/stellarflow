import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LiveStreamCard } from "./LiveStreamCard";
import { Stream } from "../types/stream";

describe("LiveStreamCard", () => {
  const mockStream: Stream = {
    id: "stream-xyz",
    sender: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    recipient: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
    totalAmount: 250,
    durationSeconds: 3600,
    startAt: Math.floor(Date.now() / 1000) - 1800,
    createdAt: Math.floor(Date.now() / 1000) - 1800,
    assetCode: "USDC",
    progress: {
      status: "active",
      ratePerSecond: 0.0694,
      elapsedSeconds: 1800,
      vestedAmount: 125,
      remainingAmount: 125,
      percentComplete: 50,
    },
  };

  it("renders stream details, live balance, and asset code", () => {
    const onOpenDetail = vi.fn();
    render(
      <LiveStreamCard
        stream={mockStream}
        onOpenDetail={onOpenDetail}
        onCancel={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
      />
    );

    expect(screen.getAllByText("USDC").length).toBeGreaterThan(0);
    expect(screen.getByText("Active")).toBeDefined();
    expect(screen.getByText(/250/)).toBeDefined();

    const card = screen.getByTestId("stream-card-stream-xyz");
    fireEvent.click(card);
    expect(onOpenDetail).toHaveBeenCalledWith("stream-xyz");
  });
});
