import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { StreamReceiptModal } from "./StreamReceiptModal";
import * as api from "../services/api";

const mockReceipt: api.StreamReceipt = {
  receiptNumber: "SF-REC-1001-1700000000",
  issuedAt: "2026-11-03T10:00:00.000Z",
  network: "Stellar Testnet",
  contractId: "CCJW2RLIN4MQQ4DAJMMR3F5QPDA6QYTKXJMEVI3XOTDBTBCLBB553J74",
  stream: {
    id: "1001",
    sender: "GBYDAA3P4T3RUM7IY6SVPQGMLACUJKDI5X6WZWCVIEL2B4GGDEOGWCLK",
    recipient: "GAYVCGJY7QFHDUFFTTA45DZG5WCXSDSKR7P3QU5L73KSUAMCM4MWXYDK",
    assetCode: "USDC",
    totalAmount: 1500,
    status: "active",
    percentComplete: 50,
    vestedAmount: 750,
    remainingAmount: 750,
    startAt: 1700000000,
    durationSeconds: 86400,
    endAt: 1700086400,
  },
  rates: {
    perSecond: 0.01736,
    perHour: 62.5,
    perDay: 1500,
    perMonth: 45000,
  },
  verification: {
    isImmutableOnChain: true,
    protocol: "StellarFlow Payment Stream v1.0",
  },
};

describe("StreamReceiptModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders receipt details after fetching from api", async () => {
    vi.spyOn(api, "getStreamReceipt").mockResolvedValue(mockReceipt);
    const onClose = vi.fn();

    render(<StreamReceiptModal streamId="1001" onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText("SF-REC-1001-1700000000")).toBeInTheDocument();
    });

    expect(screen.getByText(/STELLARFLOW PROTOCOL/i)).toBeInTheDocument();
    expect(screen.getAllByText(/1,500 USDC/i)).toHaveLength(2);
    expect(screen.getAllByText(/750 USDC/i)).toHaveLength(2);
    expect(screen.getByText(mockReceipt.stream.sender)).toBeInTheDocument();
    expect(screen.getByText(mockReceipt.stream.recipient)).toBeInTheDocument();
  });

  it("triggers window.print when print button is clicked", async () => {
    vi.spyOn(api, "getStreamReceipt").mockResolvedValue(mockReceipt);
    const printMock = vi.fn();
    window.print = printMock;
    const onClose = vi.fn();

    render(<StreamReceiptModal streamId="1001" onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText("SF-REC-1001-1700000000")).toBeInTheDocument();
    });

    const printBtn = screen.getByRole("button", { name: /Print \/ Save PDF/i });
    fireEvent.click(printBtn);
    expect(printMock).toHaveBeenCalled();
  });

  it("copies receipt text to clipboard", async () => {
    vi.spyOn(api, "getStreamReceipt").mockResolvedValue(mockReceipt);
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });

    render(<StreamReceiptModal streamId="1001" onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("SF-REC-1001-1700000000")).toBeInTheDocument();
    });

    const copyBtn = screen.getByRole("button", { name: /Copy Receipt Text/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    });
  });
});
