import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExtendStreamModal } from "./ExtendStreamModal";
import * as api from "../services/api";
import { Stream } from "../types/stream";

const mockStream: Stream = {
  id: "3001",
  sender: "GBYDAA3P4T3RUM7IY6SVPQGMLACUJKDI5X6WZWCVIEL2B4GGDEOGWCLK",
  recipient: "GAYVCGJY7QFHDUFFTTA45DZG5WCXSDSKR7P3QU5L73KSUAMCM4MWXYDK",
  assetCode: "USDC",
  totalAmount: 1000,
  durationSeconds: 86400 * 30, // 30 days
  startAt: 1700000000,
  createdAt: 1700000000,
  progress: {
    status: "active",
    ratePerSecond: 0.0003858,
    elapsedSeconds: 86400 * 5,
    vestedAmount: 166.6,
    remainingAmount: 833.4,
    percentComplete: 16.6,
  },
};

describe("ExtendStreamModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders current duration and submits extension", async () => {
    const extendSpy = vi.spyOn(api, "extendStream").mockResolvedValue({
      ...mockStream,
      durationSeconds: 86400 * 60,
    });
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <ExtendStreamModal
        stream={mockStream}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText(/Extend Stream #3001/i)).toBeInTheDocument();
    expect(screen.getByText("30.0 days")).toBeInTheDocument();

    const input = screen.getByLabelText(/Add Duration/i);
    fireEvent.change(input, { target: { value: "30" } });

    expect(screen.getByText(/New Total Duration:/i)).toBeInTheDocument();
    expect(screen.getByText(/60.0 days/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Extend by \+30 Days/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(extendSpy).toHaveBeenCalledWith("3001", 86400 * 30);
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});

