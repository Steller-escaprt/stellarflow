import { useState, useId } from "react";
import { extendStream } from "../services/api";
import { Stream } from "../types/stream";

export interface ExtendStreamModalProps {
  stream: Stream;
  onClose: () => void;
  onSuccess: (updated: Stream) => void;
}

export function ExtendStreamModal({ stream, onClose, onSuccess }: ExtendStreamModalProps) {
  const [daysStr, setDaysStr] = useState("30");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  const addedDays = parseFloat(daysStr) || 0;
  const addedSeconds = Math.round(addedDays * 86400);
  const newDurationSeconds = stream.durationSeconds + addedSeconds;
  const newEndAt = stream.startAt + newDurationSeconds;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addedSeconds <= 0) {
      setError("Please enter a valid extension period greater than 0 days.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updated = await extendStream(stream.id, addedSeconds);
      onSuccess(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extend stream duration.");
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
              Extend Stream #{stream.id}
            </h2>
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              Add more streaming time to this contract
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
                <span className="muted">Current Duration:</span>
                <strong>{(stream.durationSeconds / 86400).toFixed(1)} days</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="muted">Current End Date:</span>
                <span>{new Date((stream.startAt + stream.durationSeconds) * 1000).toLocaleDateString()}</span>
              </div>
            </div>

            <div>
              <label htmlFor="extend-days" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                Add Duration (in Days)
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  id="extend-days"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="e.g. 30"
                  value={daysStr}
                  onChange={(e) => setDaysStr(e.target.value)}
                  className="input"
                  style={{ flex: 1 }}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setDaysStr("15")}
                  style={{ fontSize: "0.8rem" }}
                >
                  +15d
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setDaysStr("30")}
                  style={{ fontSize: "0.8rem" }}
                >
                  +30d
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setDaysStr("90")}
                  style={{ fontSize: "0.8rem" }}
                >
                  +90d
                </button>
              </div>
            </div>

            {addedDays > 0 && (
              <div
                style={{
                  borderLeft: "3px solid var(--accent-color, #6366f1)",
                  paddingLeft: "0.75rem",
                  fontSize: "0.82rem",
                  color: "var(--text-color, #e2e8f0)",
                }}
              >
                <div><strong>New Total Duration:</strong> {(newDurationSeconds / 86400).toFixed(1)} days</div>
                <div><strong>New End Date:</strong> {new Date(newEndAt * 1000).toLocaleString()}</div>
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || addedDays <= 0}>
              {submitting ? "Extending…" : `Extend by +${addedDays} Days`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

