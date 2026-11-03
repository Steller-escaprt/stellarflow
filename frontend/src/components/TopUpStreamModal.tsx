import { useState, useId } from "react";
import { topUpStream } from "../services/api";
import { Stream } from "../types/stream";

export interface TopUpStreamModalProps {
  stream: Stream;
  onClose: () => void;
  onSuccess: (updated: Stream) => void;
}

export function TopUpStreamModal({ stream, onClose, onSuccess }: TopUpStreamModalProps) {
  const [amountStr, setAmountStr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  const addedAmount = parseFloat(amountStr) || 0;
  const newTotal = stream.totalAmount + addedAmount;
  const newRate = stream.durationSeconds > 0 ? (newTotal / stream.durationSeconds) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addedAmount <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updated = await topUpStream(stream.id, addedAmount);
      onSuccess(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to top up stream.");
    } finally {
      setSubmitting(false);
    }
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
      <div className="modal" style={{ maxWidth: "480px", width: "95%" }}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 id={titleId} style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
              Top Up Stream #{stream.id}
            </h2>
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              Add tokens to extend or increase employee payout
            </span>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem 0" }}>
            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}

            <div
              style={{
                background: "var(--card-bg-subtle, rgba(255,255,255,0.03))",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span className="muted">Current Total:</span>
                <strong>{stream.totalAmount} {stream.assetCode}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="muted">Recipient:</span>
                <span style={{ fontFamily: "monospace" }}>{stream.recipient.slice(0, 6)}...{stream.recipient.slice(-6)}</span>
              </div>
            </div>

            <div>
              <label htmlFor="topup-amount" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                Additional Amount ({stream.assetCode})
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  id="topup-amount"
                  type="number"
                  step="any"
                  min="0.000001"
                  placeholder="e.g. 500"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="input"
                  style={{ flex: 1 }}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setAmountStr("100")}
                  style={{ fontSize: "0.8rem" }}
                >
                  +100
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setAmountStr("500")}
                  style={{ fontSize: "0.8rem" }}
                >
                  +500
                </button>
              </div>
            </div>

            {addedAmount > 0 && (
              <div
                style={{
                  borderLeft: "3px solid var(--accent-color, #6366f1)",
                  paddingLeft: "0.75rem",
                  fontSize: "0.82rem",
                  color: "var(--text-color, #e2e8f0)",
                }}
              >
                <div><strong>New Total Escrow:</strong> {newTotal.toFixed(2)} {stream.assetCode}</div>
                <div><strong>Adjusted Flow Rate:</strong> {(newRate * 86400).toFixed(2)} {stream.assetCode} / day</div>
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || addedAmount <= 0}>
              {submitting ? "Topping up…" : `Deposit +${addedAmount || 0} ${stream.assetCode}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

