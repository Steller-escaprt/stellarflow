import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TopUpStreamModal } from "./TopUpStreamModal";
import * as api from "../services/api";
import { Stream } from "../types/stream";

const mockStream: Stream = {
  id: "2001",
  sender: "GBYDAA3P4T3RUM7IY6SVPQGMLACUJKDI5X6WZWCVIEL2B4GGDEOGWCLK",
  recipient: "GAYVCGJY7QFHDUFFTTA45DZG5WCXSDSKR7P3QU5L73KSUAMCM4MWXYDK",
  assetCode: "USDC",
  totalAmount: 100,
  durationSeconds: 1000,
  startAt: 1700000000,
  createdAt: 1700000000,
  progress: {
    status: "active",
    ratePerSecond: 0.1,
    elapsedSeconds: 200,
    vestedAmount: 20,
    remainingAmount: 80,
    percentComplete: 20,
  },
};

describe("TopUpStreamModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders stream details and submits top-up", async () => {
    const topUpSpy = vi.spyOn(api, "topUpStream").mockResolvedValue({
      ...mockStream,
      totalAmount: 150,
    });
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <TopUpStreamModal
        stream={mockStream}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText(/Top Up Stream #2001/i)).toBeInTheDocument();
    expect(screen.getByText("100 USDC")).toBeInTheDocument();

    const input = screen.getByLabelText(/Additional Amount/i);
    fireEvent.change(input, { target: { value: "50" } });

    expect(screen.getByText(/New Total Escrow:/i)).toBeInTheDocument();
    expect(screen.getByText(/150.00 USDC/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Deposit \+50 USDC/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(topUpSpy).toHaveBeenCalledWith("2001", 50);
      expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ totalAmount: 150 }));
      expect(onClose).toHaveBeenCalled();
    });
  });
});

