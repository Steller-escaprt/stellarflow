import { useEffect, useState, useId } from "react";
import { getStreamReceipt } from "../services/api";
import { StreamReceipt } from "../types/stream";

export interface StreamReceiptModalProps {
  streamId: string;
  onClose: () => void;
}

function formatTs(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function StreamReceiptModal({ streamId, onClose }: StreamReceiptModalProps) {
  const [receipt, setReceipt] = useState<StreamReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const titleId = useId();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getStreamReceipt(streamId)
      .then((data) => {
        if (active) setReceipt(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load receipt");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [streamId]);

  const handleCopyText = () => {
    if (!receipt) return;
    const s = receipt.stream;
    const text = [
      `=== STELLARFLOW PAYMENT RECEIPT ===`,
      `Receipt No: ${receipt.receiptNumber}`,
      `Date Issued: ${receipt.issuedAt}`,
      `Network: ${receipt.network}`,
      `Contract ID: ${receipt.contractId}`,
      `Stream ID: #${s.id}`,
      `Sender: ${s.sender}`,
      `Recipient: ${s.recipient}`,
      `Total Escrow: ${s.totalAmount} ${s.assetCode}`,
      `Vested: ${s.vestedAmount} ${s.assetCode} (${s.percentComplete}%)`,
      `Remaining: ${s.remainingAmount} ${s.assetCode}`,
      `Flow Rate: ${receipt.rates.perSecond} ${s.assetCode}/s (~${receipt.rates.perDay} ${s.assetCode}/day)`,
      `Schedule: ${formatTs(s.startAt)} → ${formatTs(s.endAt)}`,
      `Status: ${s.status.toUpperCase()}`,
      `Verification: Stellar On-Chain Soroban Verified`,
    ].join("\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal receipt-modal" style={{ maxWidth: "680px", width: "95%" }}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🧾</span>
            <div>
              <h2 id={titleId} style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
                Payment Stream Receipt
              </h2>
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                Official Proof of Remittance & Vesting Advice
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            aria-label="Close receipt"
            style={{ fontSize: "1.2rem", padding: "0.25rem 0.6rem" }}
          >
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ padding: "1.25rem 0" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <div className="skeleton" style={{ height: "24px", width: "60%", margin: "0 auto 1rem" }} />
              <div className="skeleton" style={{ height: "16px", width: "40%", margin: "0 auto" }} />
            </div>
          )}

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          {receipt && (
            <div className="receipt-content print-document" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Receipt Header Banner */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderBottom: "2px solid var(--border-color, #e2e8f0)",
                  paddingBottom: "1rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.05em", color: "var(--accent-color, #6366f1)" }}>
                    STELLARFLOW PROTOCOL
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>
                    Soroban Smart Contract Payment Rails
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{receipt.receiptNumber}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>
                    {new Date(receipt.issuedAt).toUTCString()}
                  </div>
                  <span
                    className={`badge badge-${receipt.stream.status}`}
                    style={{ textTransform: "uppercase", marginTop: "0.25rem", display: "inline-block" }}
                  >
                    {receipt.stream.status}
                  </span>
                </div>
              </div>

              {/* Counterparties */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  background: "var(--card-bg-subtle, rgba(255,255,255,0.03))",
                  padding: "0.85rem",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text-muted, #64748b)", marginBottom: "0.25rem" }}>
                    PAYER / SENDER
                  </div>
                  <div style={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                    {receipt.stream.sender}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text-muted, #64748b)", marginBottom: "0.25rem" }}>
                    PAYEE / RECIPIENT
                  </div>
                  <div style={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                    {receipt.stream.recipient}
                  </div>
                </div>
              </div>

              {/* Ledger Summary */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.85rem",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color, #e2e8f0)", color: "var(--text-muted, #64748b)" }}>
                    <th style={{ padding: "0.5rem 0" }}>Ledger Breakdown</th>
                    <th style={{ padding: "0.5rem 0", textAlign: "right" }}>Amount ({receipt.stream.assetCode})</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border-color-subtle, rgba(255,255,255,0.05))" }}>
                    <td style={{ padding: "0.5rem 0" }}>Total Escrow Committed</td>
                    <td style={{ padding: "0.5rem 0", textAlign: "right", fontWeight: 700 }}>
                      {receipt.stream.totalAmount.toLocaleString()} {receipt.stream.assetCode}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-color-subtle, rgba(255,255,255,0.05))" }}>
                    <td style={{ padding: "0.5rem 0" }}>Vested to Date ({receipt.stream.percentComplete}%)</td>
                    <td style={{ padding: "0.5rem 0", textAlign: "right", color: "var(--color-success, #10b981)" }}>
                      {receipt.stream.vestedAmount.toLocaleString()} {receipt.stream.assetCode}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-color-subtle, rgba(255,255,255,0.05))" }}>
                    <td style={{ padding: "0.5rem 0" }}>Remaining Unvested</td>
                    <td style={{ padding: "0.5rem 0", textAlign: "right", color: "var(--text-muted, #64748b)" }}>
                      {receipt.stream.remainingAmount.toLocaleString()} {receipt.stream.assetCode}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Flow Rate & Streaming Schedule */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "0.75rem",
                  fontSize: "0.8rem",
                  textAlign: "center",
                }}
              >
                <div style={{ padding: "0.6rem", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "6px" }}>
                  <div style={{ color: "var(--text-muted, #64748b)", fontSize: "0.72rem" }}>Flow Rate / sec</div>
                  <div style={{ fontWeight: 700, marginTop: "0.2rem" }}>{receipt.rates.perSecond} {receipt.stream.assetCode}</div>
                </div>
                <div style={{ padding: "0.6rem", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "6px" }}>
                  <div style={{ color: "var(--text-muted, #64748b)", fontSize: "0.72rem" }}>Equivalent / Day</div>
                  <div style={{ fontWeight: 700, marginTop: "0.2rem" }}>{receipt.rates.perDay.toLocaleString()} {receipt.stream.assetCode}</div>
                </div>
                <div style={{ padding: "0.6rem", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "6px" }}>
                  <div style={{ color: "var(--text-muted, #64748b)", fontSize: "0.72rem" }}>Equivalent / Month</div>
                  <div style={{ fontWeight: 700, marginTop: "0.2rem" }}>{receipt.rates.perMonth.toLocaleString()} {receipt.stream.assetCode}</div>
                </div>
              </div>

              {/* Schedule Dates */}
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted, #64748b)", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>Start:</strong> {formatTs(receipt.stream.startAt)}
                </div>
                {receipt.stream.cliffSeconds ? (
                  <div>
                    <strong>Cliff:</strong> {(receipt.stream.cliffSeconds / 86400).toFixed(1)} days
                  </div>
                ) : null}
                <div>
                  <strong>End:</strong> {formatTs(receipt.stream.endAt)}
                </div>
              </div>

              {/* Cryptographic verification footer */}
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted, #64748b)",
                  borderTop: "1px dashed var(--border-color, #cbd5e1)",
                  paddingTop: "0.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  🔒 <strong>Network:</strong> {receipt.network} · <strong>Contract:</strong>{" "}
                  <code style={{ fontSize: "0.7rem" }}>{receipt.contractId.slice(0, 10)}...{receipt.contractId.slice(-6)}</code>
                </div>
                <div>{receipt.verification.protocol}</div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={handleCopyText}
              disabled={!receipt}
            >
              {copied ? "✓ Copied!" : "📋 Copy Receipt Text"}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handlePrint}
              disabled={!receipt}
            >
              🖨️ Print / Save PDF
            </button>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

