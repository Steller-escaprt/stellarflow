import { useState, useEffect, FormEvent } from "react";
import {
  estimateCreateStreamFee,
  getConfig,
  type StreamFeeEstimate,
} from "../services/api";
// Form Draft Autosave [Verified]: Survives refresh, clears on submit/discard, aligns with fields.
import { useDraftAutosave } from "../hooks/useDraftAutosave";
import { CreateStreamPayload, CreateSplitStreamPayload } from "../types/stream";
import {
  FieldErrors,
  FormValues,
  isStellarAccount,
  validateForm,
  isFormValid,
} from "../hooks/useFormValidation";

type StreamMode = "single" | "split" | "payroll";

export interface PayrollRow {
  name: string;
  recipient: string;
  amount: string;
  durationDays: string;
  cliffDays: string;
}

interface SplitRecipient {
  address: string;
  percentage: string;
}

interface CreateStreamFormProps {
  onCreate: (payload: CreateStreamPayload) => Promise<void>;
  onCreateSplit?: (payload: CreateSplitStreamPayload) => Promise<void>;
  onCreateBatch?: (payloads: CreateStreamPayload[]) => Promise<void>;
  apiError?: string | null;
  walletAddress?: string | null;
}

/**
 * Converts raw API error messages into user-friendly titles and hints.
 * @param raw - The raw error message from the API.
 * @returns An object containing a friendly title and hint.
 */
interface FeePreview {
  payload: CreateStreamPayload;
  estimate: StreamFeeEstimate;
}

function humaniseApiError(raw: string): { title: string; hint: string } {
  const lower = raw.toLowerCase();

  if (lower.includes("sender") || lower.includes("recipient")) {
    return {
      title: "Invalid account ID",
      hint: 'Double-check that both account IDs start with "G" and are exactly 56 characters. You can copy them from Stellar Laboratory.',
    };
  }
  if (
    lower.includes("asset") ||
    lower.includes("assetcode") ||
    lower.includes("supported")
  ) {
    return {
      title: "Invalid asset code",
      hint: raw,
    };
  }
  if (lower.includes("insufficient") || lower.includes("balance")) {
    return {
      title: "Insufficient or stale balance",
      hint: "The sender's balance may be stale or too low. Refresh your wallet, confirm the available balance, and try again.",
    };
  }
  if (lower.includes("amount")) {
    return {
      title: "Invalid amount",
      hint: "The total amount must be a positive number. Check that you haven't entered zero or a negative value.",
    };
  }
  if (lower.includes("duration") || lower.includes("seconds")) {
    return {
      title: "Invalid duration",
      hint: "Stream duration must be at least 1 minute (60 seconds). Increase the duration and try again.",
    };
  }
  if (lower.includes("not found")) {
    return {
      title: "Stream not found",
      hint: "This stream may have already been cancelled or never existed. Refresh the page to see the latest state.",
    };
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return {
      title: "Network error",
      hint: "Could not reach the StellarFlow API. Ensure the backend is running and your network connection is stable.",
    };
  }

  return { title: "Something went wrong", hint: raw };
}

/**
 * Displays a validation hint for a Stellar account ID.
 * @param props - The component props containing the account address.
 * @returns The rendered AccountHint component.
 */
function AccountHint({ value }: { value: string }) {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  const len = trimmed.length;
  const valid = isStellarAccount(trimmed);

  if (valid) {
    return (
      <span className="field-hint field-hint--ok" aria-live="polite">
        ✓ Valid Stellar account ({len}/56)
      </span>
    );
  }

  if (!trimmed.startsWith("G")) {
    return (
      <span className="field-hint field-hint--warn" aria-live="polite">
        Account IDs must start with the letter G ({len}/56 chars)
      </span>
    );
  }

  return (
    <span className="field-hint field-hint--warn" aria-live="polite">
      {len < 56
        ? `${56 - len} more character${56 - len !== 1 ? "s" : ""} needed`
        : "Too long — must be exactly 56 characters"}{" "}
      ({len}/56)
    </span>
  );
}

const INITIAL_VALUES: FormValues = {
  sender: "",
  recipient: "",
  assetCode: "USDC",
  totalAmount: "150",
  durationMinutes: "1440",
  startInMinutes: "0",
  cliffDays: "0",
};

// Initial fallback if fetch hasn't completed or failed
const DEFAULT_ALLOWED_ASSETS = ["USDC", "XLM"];

/**
 * Form component for creating a new payment stream.
 * 
 * Features:
 * - Validation of form fields (amounts, addresses, duration, cliff).
 * - Draft autosave: Form state is automatically persisted to localStorage
 *   and recovered on page reload (via useDraftAutosave hook).
 * - Fee estimation: Clicking "Create Stream" estimates the network fee and
 *   displays a confirmation modal with the fee preview.
 * - Recovery paths:
 *   * Fee estimation failure: Shows inline error with "Retry Estimation" button.
 *     Clicking retry re-runs fee estimation with the current form input (preserved).
 *   * Stream creation failure (e.g., stale balance, rejected submission):
 *     Shows error in the modal with "Retry Confirmation" button to re-attempt,
 *     and "Edit" button to go back and modify the form input.
 * - Duplicate submission prevention: isConfirming flag prevents multiple
 *   confirmations from being sent if the user clicks "Confirm" repeatedly.
 * 
 * Note on stale balance detection:
 * - Currently, stale balance is detected reactively when the backend rejects
 *   the submission (e.g., "Insufficient balance" error).
 * - A proactive check (before submit) would require a wallet balance API endpoint,
 *   which is deferred to a future iteration.
 * 
 * @param props - The component props.
 * @returns The rendered CreateStreamForm component.
 */
const DEFAULT_PAYROLL_ROWS: PayrollRow[] = [
  {
    name: "Alex (Core Engineer)",
    recipient: "GCGOP727E2L5FRWXPXBPMYCA4DY7I23OR5OIXHPL3RDKEZFD2GJHTUVP",
    amount: "3500",
    durationDays: "30",
    cliffDays: "0",
  },
  {
    name: "Sam (Smart Contract Dev)",
    recipient: "GDIMKSYZWZ6KGL5D6EVVDZYLX6EW4TJXMWF6XO3Q4Y7M3JGALJDXCUG7",
    amount: "4200",
    durationDays: "30",
    cliffDays: "0",
  },
];

function buildCreateStreamPayload(values: FormValues, fallbackSender?: string | null): CreateStreamPayload {
  const now = Math.floor(Date.now() / 1000);
  const offsetMinutes = Number(values.startInMinutes);
  const startAt =
    offsetMinutes > 0 ? now + Math.floor(offsetMinutes * 60) : undefined;

  const cliffDays = Number(values.cliffDays || "0");
  const cliffSeconds = cliffDays > 0 ? Math.floor(cliffDays * 86400) : undefined;

  return {
    sender: values.sender.trim() || (fallbackSender ? fallbackSender.trim() : ""),
    recipient: values.recipient.trim(),
    assetCode: values.assetCode.trim().toUpperCase(),
    totalAmount: Number(values.totalAmount),
    durationSeconds: Math.floor(Number(values.durationMinutes) * 60),
    startAt,
    cliffSeconds,
  };
}

function formatStreamRate(payload: CreateStreamPayload): string {
  const durationHours = payload.durationSeconds / 3600;
  const ratePerHour = durationHours > 0 ? payload.totalAmount / durationHours : 0;
  return `${ratePerHour.toFixed(6)} ${payload.assetCode}/hour`;
}

export function CreateStreamForm({
  onCreate,
  onCreateSplit,
  onCreateBatch,
  apiError,
  walletAddress,
}: CreateStreamFormProps) {
  const [values, setValues, hasDraft, clearDraft] = useDraftAutosave<FormValues>(
    "stellar-flow:create-draft",
    INITIAL_VALUES,
    2000 // Autosave every 2 seconds
  );
  const [allowedAssets, setAllowedAssets] = useState<string[]>([]);
  const [configFetchFailed, setConfigFetchFailed] = useState(false);
  const [streamMode, setStreamMode] = useState<StreamMode>("single");
  const [splitRecipients, setSplitRecipients] = useState<SplitRecipient[]>([
    { address: "", percentage: "50" },
    { address: "", percentage: "50" },
  ]);
  const [splitErrors, setSplitErrors] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const config = await getConfig();
        setAllowedAssets(config.allowedAssets);
        
        // Handle defaulting logic
        const currentAsset = values.assetCode;
        const isCurrentValid = config.allowedAssets.includes(currentAsset);
        
        if (!isCurrentValid) {
          if (config.allowedAssets.includes("USDC")) {
            setValues(prev => ({ ...prev, assetCode: "USDC" }));
          } else if (config.allowedAssets.length > 0) {
            setValues(prev => ({ ...prev, assetCode: config.allowedAssets[0] }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch config:", err);
        setConfigFetchFailed(true);
      }
    }
    fetchConfig();
  }, []); // Only fetch once on mount

  useEffect(() => {
    if (walletAddress && !values.sender) {
      setValues((prev) => ({ ...prev, sender: walletAddress }));
    }
  }, [walletAddress]);
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormValues, boolean>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [feePreview, setFeePreview] = useState<FeePreview | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const errors: FieldErrors = validateForm(values);
  const formValid = isFormValid(errors);

  function set(field: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  function blur(field: keyof FormValues) {
    return () => setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function addSplitRecipient() {
    if (splitRecipients.length >= 10) return;
    setSplitRecipients((prev) => [...prev, { address: "", percentage: "0" }]);
  }

  function removeSplitRecipient(index: number) {
    if (splitRecipients.length <= 2) return;
    setSplitRecipients((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSplitRecipient(index: number, field: "address" | "percentage", value: string) {
    setSplitRecipients((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  function validateSplitRecipients(): string | null {
    const totalPct = splitRecipients.reduce((sum, r) => sum + Number(r.percentage || 0), 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      return `Allocations must sum to exactly 100% (currently ${totalPct.toFixed(1)}%)`;
    }
    for (let i = 0; i < splitRecipients.length; i++) {
      const addr = splitRecipients[i].address.trim();
      if (!addr) return `Recipient ${i + 1} address is required.`;
      if (!isStellarAccount(addr)) return `Recipient ${i + 1} has an invalid Stellar address.`;
      const pct = Number(splitRecipients[i].percentage);
      if (isNaN(pct) || pct <= 0) return `Recipient ${i + 1} percentage must be positive.`;
    }
    return null;
  }

    const [payrollRows, setPayrollRows] = useState<PayrollRow[]>(DEFAULT_PAYROLL_ROWS);
  const [payrollErrors, setPayrollErrors] = useState<string | null>(null);
  const [showCsvPaste, setShowCsvPaste] = useState(false);
  const [csvText, setCsvText] = useState("");

  function addPayrollRow() {
    if (payrollRows.length >= 50) return;
    setPayrollRows((prev) => [
      ...prev,
      { name: "", recipient: "", amount: "1000", durationDays: "30", cliffDays: "0" },
    ]);
  }

  function removePayrollRow(index: number) {
    if (payrollRows.length <= 1) return;
    setPayrollRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePayrollRow(index: number, field: keyof PayrollRow, value: string) {
    setPayrollRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function loadDemoPayroll() {
    setPayrollRows([
      {
        name: "Alex (Core Engineer)",
        recipient: "GCGOP727E2L5FRWXPXBPMYCA4DY7I23OR5OIXHPL3RDKEZFD2GJHTUVP",
        amount: "3500",
        durationDays: "30",
        cliffDays: "0",
      },
      {
        name: "Sam (Smart Contract Dev)",
        recipient: "GDIMKSYZWZ6KGL5D6EVVDZYLX6EW4TJXMWF6XO3Q4Y7M3JGALJDXCUG7",
        amount: "4200",
        durationDays: "30",
        cliffDays: "0",
      },
      {
        name: "Jordan (UI/UX Designer)",
        recipient: "GAP27ZLO6QWSNUX6FZHIF54PEV2U4ONRGR5T3P5HMC6UVHAP2UECTVCE",
        amount: "2800",
        durationDays: "30",
        cliffDays: "0",
      },
    ]);
  }

  function handleParseCsv() {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split(/\r?\n/);
    const parsed: PayrollRow[] = [];
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.toLowerCase().startsWith("recipient")) continue;
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        parsed.push({
          recipient: parts[0],
          name: parts[1] && isNaN(Number(parts[1])) ? parts[1] : "",
          amount: isNaN(Number(parts[1])) ? parts[2] || "1000" : parts[1],
          durationDays: parts[3] || "30",
          cliffDays: parts[4] || "0",
        });
      }
    }
    if (parsed.length > 0) {
      setPayrollRows(parsed);
      setShowCsvPaste(false);
      setPayrollErrors(null);
    } else {
      setPayrollErrors("Could not parse CSV. Format: recipient,name,amount,durationDays,cliffDays");
    }
  }

  function validatePayrollRows(): string | null {
    if (payrollRows.length === 0) return "At least one employee is required.";
    for (let i = 0; i < payrollRows.length; i++) {
      const r = payrollRows[i];
      const addr = r.recipient.trim();
      if (!addr) return `Employee ${i + 1} recipient address is required.`;
      if (!isStellarAccount(addr)) return `Employee ${i + 1} has an invalid Stellar address.`;
      const amt = Number(r.amount);
      if (isNaN(amt) || amt <= 0) return `Employee ${i + 1} amount must be positive.`;
      const dur = Number(r.durationDays);
      if (isNaN(dur) || dur <= 0) return `Employee ${i + 1} duration must be at least 1 day.`;
    }
    return null;
  }

  const isPayrollValid = streamMode === "payroll" ? validatePayrollRows() === null : true;
  const totalPayrollAmount = payrollRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const splitValidationError = streamMode === "split" ? validateSplitRecipients() : null;
  const isSplitValid = streamMode === "split" ? splitValidationError === null : true;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSimulationError(null);
    setSplitErrors(null);

    const effectiveSender = (values.sender || walletAddress || "").trim();
    if (!effectiveSender) {
      setSimulationError("Please connect Freighter wallet or enter a valid Sender address.");
      return;
    }

        if (streamMode === "payroll") {
      const pErr = validatePayrollRows();
      if (pErr) {
        setPayrollErrors(pErr);
        return;
      }
      if (!onCreateBatch) {
        setSimulationError("Batch creation is not supported in this view.");
        return;
      }
      setIsSubmitting(true);
      try {
        const asset = values.assetCode.trim().toUpperCase() || "USDC";
        const payloads: CreateStreamPayload[] = payrollRows.map((r) => ({
          sender: effectiveSender,
          recipient: r.recipient.trim(),
          assetCode: asset,
          totalAmount: Number(r.amount),
          durationSeconds: Math.floor(Number(r.durationDays || "30") * 86400),
          cliffSeconds: Number(r.cliffDays || "0") > 0 ? Math.floor(Number(r.cliffDays) * 86400) : undefined,
        }));
        await onCreateBatch(payloads);
        setTouched({});
        setSubmitAttempted(false);
        setPayrollRows(DEFAULT_PAYROLL_ROWS);
      } catch (err) {
        setSimulationError(err instanceof Error ? err.message : "Failed to create payroll batch.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

if (streamMode === "split") {
      const splitErr = validateSplitRecipients();
      if (splitErr) {
        setSplitErrors(splitErr);
        return;
      }
      // For split streams, skip recipient validation from single mode
      const singleErrors = validateForm(values);
      delete singleErrors.recipient;
      if (!isFormValid(singleErrors)) return;

      if (!onCreateSplit) {
        setSimulationError("Split stream creation is not supported yet.");
        return;
      }

      setIsSubmitting(true);
      try {
        const now = Math.floor(Date.now() / 1000);
        const offsetMinutes = Number(values.startInMinutes);
        const startAt = offsetMinutes > 0 ? now + Math.floor(offsetMinutes * 60) : undefined;

        const splitPayload: CreateSplitStreamPayload = {
          sender: values.sender.trim(),
          assetCode: values.assetCode.trim().toUpperCase(),
          totalAmount: Number(values.totalAmount),
          durationSeconds: Math.floor(Number(values.durationMinutes) * 60),
          startAt,
          recipients: splitRecipients.map((r) => ({
            address: r.address.trim(),
            percentage: Number(r.percentage),
          })),
        };

        await onCreateSplit(splitPayload);
        clearDraft();
        setTouched({});
        setSubmitAttempted(false);
        setSplitRecipients([
          { address: "", percentage: "50" },
          { address: "", percentage: "50" },
        ]);
      } catch (err) {
        setSimulationError(
          err instanceof Error ? err.message : "Failed to create split stream.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!formValid) return;

    setIsSubmitting(true);
    try {
      const payload = buildCreateStreamPayload(values, walletAddress);
      const estimate = await estimateCreateStreamFee(payload);
      setFeePreview({ payload, estimate });
    } catch (err) {
      setSimulationError(
        err instanceof Error ? err.message : "Failed to estimate network fee.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmCreateStream() {
    if (!feePreview) return;

    // Prevent duplicate submissions during confirmation
    if (isConfirming) return;

    setIsConfirming(true);
    setSimulationError(null);
    try {
      await onCreate(feePreview.payload);
      clearDraft();
      setTouched({});
      setSubmitAttempted(false);
      setFeePreview(null);
    } catch (err) {
      // On error, keep the modal open with the error message and retry buttons visible
      setSimulationError(
        err instanceof Error ? err.message : "Failed to create stream.",
      );
    } finally {
      setIsConfirming(false);
    }
  }

  /**
   * Retry fee estimation from the current form state.
   * Preserves form input via useDraftAutosave.
   */
  async function retryFeeEstimation() {
    setSimulationError(null);
    setIsSubmitting(true);
    try {
      if (!formValid) return;
      const payload = buildCreateStreamPayload(values, walletAddress);
      const estimate = await estimateCreateStreamFee(payload);
      setFeePreview({ payload, estimate });
    } catch (err) {
      setSimulationError(
        err instanceof Error ? err.message : "Failed to estimate network fee.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const parsedApiError = apiError ? humaniseApiError(apiError) : null;

  const startInMinsNum = Number(values.startInMinutes);
  const durationMinsNum = Number(values.durationMinutes);
  const estimatedEndLabel: string | null = (() => {
    if (
      values.startInMinutes === "" ||
      values.durationMinutes === "" ||
      isNaN(startInMinsNum) ||
      isNaN(durationMinsNum) ||
      durationMinsNum < 1 ||
      !Number.isInteger(durationMinsNum)
    ) {
      return null;
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    const startAt =
      startInMinsNum > 0 ? nowSeconds + Math.floor(startInMinsNum * 60) : nowSeconds;
    const endAt = startAt + Math.floor(durationMinsNum * 60);
    const endDate = new Date(endAt * 1000);
    const datePart = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(endDate);
    const timePart = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }).format(endDate);
    return `Ends: ${datePart} at ${timePart} UTC`;
  })();

  return (
    <>
    <form onSubmit={handleSubmit} noValidate>
      {hasDraft && (
        <div
          className="draft-recovery-banner"
          role="status"
          aria-live="polite"
          aria-label="Draft recovered"
        >
          ✓ Your unsaved draft has been recovered. You can{" "}
          <button
            type="button"
            className="draft-recovery-banner__discard-link"
            onClick={() => {
              if (window.confirm("Discard your unsaved stream draft?")) {
                clearDraft();
                setTouched({});
                setSubmitAttempted(false);
              }
            }}
            disabled={isSubmitting}
          >
            discard it
          </button>{" "}
          if you prefer to start over.
        </div>
      )}

      {parsedApiError && (
        <div className="api-error-box">
          <div className="api-error-box__title">{parsedApiError.title}</div>
          <div className="api-error-box__hint">{parsedApiError.hint}</div>
        </div>
      )}

      {/* Stream Mode Toggle */}
      <div className="field-group" style={{ marginBottom: "1.5rem" }}>
        <label style={{ marginBottom: "0.5rem", display: "block" }}>Stream Type</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className={streamMode === "single" ? "btn-primary" : "btn-ghost"}
            onClick={() => setStreamMode("single")}
            aria-pressed={streamMode === "single"}
          >
            Single Recipient
          </button>
          <button
            type="button"
            className={streamMode === "split" ? "btn-primary" : "btn-ghost"}
            onClick={() => setStreamMode("split")}
            aria-pressed={streamMode === "split"}
          >
            Split Stream
          </button>
          <button
            type="button"
            className={streamMode === "payroll" ? "btn-primary" : "btn-ghost"}
            onClick={() => setStreamMode("payroll")}
            aria-pressed={streamMode === "payroll"}
          >
            Payroll Bulk
          </button>
        </div>
      </div>

      {/* Sender */}
      <div
        className={`field-group${errors.sender ? " field-group--error" : ""}`}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
          <label htmlFor="stream-sender" style={{ marginBottom: 0 }}>
            Sender Account
            <span className="field-required" aria-hidden> *</span>
          </label>
          <button
            type="button"
            className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium cursor-pointer"
            onClick={() => setValues((prev) => ({ ...prev, sender: "GCGOP727E2L5FRWXPXBPMYCA4DY7I23OR5OIXHPL3RDKEZFD2GJHTUVP" }))}
          >
            Demo Key
          </button>
        </div>
        <input
          id="stream-sender"
          type="text"
          value={values.sender}
          onChange={set("sender")}
          onBlur={blur("sender")}
          placeholder="G… (56-character Stellar public key)"
          aria-describedby={errors.sender ? "sender-error" : "sender-hint"}
          aria-invalid={!!errors.sender}
          autoComplete="off"
          spellCheck={false}
        />
        <AccountHint value={values.sender} />
        {errors.sender && (
          <span id="sender-error" className="field-error" role="alert">
            {errors.sender}
          </span>
        )}
      </div>

      {/* Recipient — Single mode only */}
      {streamMode === "single" && (
        <div
          className={`field-group${errors.recipient ? " field-group--error" : ""}`}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
            <label htmlFor="stream-recipient" style={{ marginBottom: 0 }}>
              Recipient Account
              <span className="field-required" aria-hidden> *</span>
            </label>
            <button
              type="button"
              className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium cursor-pointer"
              onClick={() => setValues((prev) => ({ ...prev, recipient: "GDIMKSYZWZ6KGL5D6EVVDZYLX6EW4TJXMWF6XO3Q4Y7M3JGALJDXCUG7" }))}
            >
              Demo Key
            </button>
          </div>
          <input
            id="stream-recipient"
            type="text"
            value={values.recipient}
            onChange={set("recipient")}
            onBlur={blur("recipient")}
            placeholder="G… (56-character Stellar public key)"
            aria-describedby={
              errors.recipient ? "recipient-error" : "recipient-hint"
            }
            aria-invalid={!!errors.recipient}
            autoComplete="off"
            spellCheck={false}
          />
          <AccountHint value={values.recipient} />
          {errors.recipient && (
            <span id="recipient-error" className="field-error" role="alert">
              {errors.recipient}
            </span>
          )}
        </div>
      )}

      {/* Split Recipients */}
      {streamMode === "split" && (
        <div className="field-group" style={{ marginBottom: "1rem" }}>
          <label style={{ marginBottom: "0.5rem", display: "block" }}>
            Recipients & Allocations
            <span className="field-required" aria-hidden> *</span>
          </label>
          {splitRecipients.map((recipient, index) => (
            <div key={index} className="row" style={{ marginBottom: "0.5rem", alignItems: "flex-start" }}>
              <div style={{ flex: 3 }}>
                <input
                  type="text"
                  value={recipient.address}
                  onChange={(e) => updateSplitRecipient(index, "address", e.target.value)}
                  placeholder={`Recipient ${index + 1} (G…)`}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={`Split recipient ${index + 1} address`}
                />
                <AccountHint value={recipient.address} />
              </div>
              <div style={{ flex: 1, minWidth: "80px" }}>
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={recipient.percentage}
                  onChange={(e) => updateSplitRecipient(index, "percentage", e.target.value)}
                  aria-label={`Split recipient ${index + 1} percentage`}
                />
                <span className="field-hint">%</span>
              </div>
              {splitRecipients.length > 2 && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => removeSplitRecipient(index)}
                  aria-label={`Remove recipient ${index + 1}`}
                  style={{ padding: "0.5rem" }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
            <span className="field-hint">
              Total: {splitRecipients.reduce((sum, r) => sum + Number(r.percentage || 0), 0).toFixed(1)}% / 100%
            </span>
            {splitRecipients.length < 10 && (
              <button
                type="button"
                className="btn-ghost"
                onClick={addSplitRecipient}
              >
                + Add Recipient
              </button>
            )}
          </div>
          {splitErrors && (
            <span className="field-error" role="alert" style={{ marginTop: "0.5rem", display: "block" }}>
              {splitErrors}
            </span>
          )}
          {splitValidationError && submitAttempted && !splitErrors && (
            <span className="field-error" role="alert" style={{ marginTop: "0.5rem", display: "block" }}>
              {splitValidationError}
            </span>
          )}
        </div>
      )}

            {/* Asset & Total Amount */}
      <div className="row">
        <div
          className={`field-group${errors.assetCode ? " field-group--error" : ""}`}
        >
          <label htmlFor="stream-asset">
            Asset Code
            <span className="field-required" aria-hidden>
              *
            </span>
          </label>
          {!configFetchFailed && allowedAssets.length > 0 ? (
            <select
              id="stream-asset"
              value={values.assetCode}
              onChange={set("assetCode")}
              onBlur={blur("assetCode")}
              aria-describedby={errors.assetCode ? "asset-error" : "asset-hint"}
              aria-invalid={!!errors.assetCode}
              required
            >
              {allowedAssets.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="stream-asset"
              type="text"
              value={values.assetCode}
              onChange={set("assetCode")}
              onBlur={blur("assetCode")}
              placeholder="e.g. USDC"
              aria-describedby={errors.assetCode ? "asset-error" : "asset-hint"}
              aria-invalid={!!errors.assetCode}
              required
            />
          )}
          {errors.assetCode && (
            <span id="asset-error" className="field-error" role="alert">
              {errors.assetCode}
            </span>
          )}
        </div>

        {streamMode !== "payroll" && (
          <div
            className={`field-group${errors.totalAmount ? " field-group--error" : ""}`}
          >
            <label htmlFor="stream-amount">
              Total Amount
              <span className="field-required" aria-hidden>
                *
              </span>
            </label>
            <input
              id="stream-amount"
              type="number"
              min="0.000001"
              step="0.000001"
              value={values.totalAmount}
              onChange={set("totalAmount")}
              onBlur={blur("totalAmount")}
              onKeyDown={(e) => {
                if (["e", "E", "+"].includes(e.key)) e.preventDefault();
              }}
              aria-describedby={errors.totalAmount ? "amount-error" : "amount-hint"}
              aria-invalid={!!errors.totalAmount}
              required
            />
            <span id="amount-hint" className="field-hint">
              Enter a positive number
            </span>
            {errors.totalAmount && (
              <span id="amount-error" className="field-error" role="alert">
                {errors.totalAmount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Payroll Bulk Section */}
      {streamMode === "payroll" && (
        <div className="payroll-section" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              Employee Payroll List ({payrollRows.length})
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                onClick={loadDemoPayroll}
              >
                Load Demo Team (3)
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                onClick={() => setShowCsvPaste(!showCsvPaste)}
              >
                {showCsvPaste ? "Show Table" : "Paste CSV"}
              </button>
            </div>
          </div>

          {showCsvPaste ? (
            <div style={{ marginBottom: "1rem" }}>
              <textarea
                style={{ width: "100%", height: "100px", fontSize: "0.75rem", fontFamily: "monospace", padding: "0.5rem", borderRadius: "0.375rem" }}
                placeholder="recipient,name,amount,durationDays,cliffDays"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem", marginTop: "0.5rem" }}
                onClick={handleParseCsv}
              >
                Parse & Import CSV
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
              {payrollRows.map((row, idx) => (
                <div key={idx} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(150, 150, 150, 0.2)", background: "rgba(150, 150, 150, 0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem", fontSize: "0.75rem" }}>
                    <span style={{ fontWeight: 600 }}>
                      #{idx + 1} {row.name ? `— ${row.name}` : ""}
                    </span>
                    {payrollRows.length > 1 && (
                      <button
                        type="button"
                        style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem" }}
                        onClick={() => removePayrollRow(idx)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Recipient Stellar Address (G…)"
                    value={row.recipient}
                    onChange={(e) => updatePayrollRow(idx, "recipient", e.target.value)}
                    style={{ width: "100%", fontSize: "0.75rem", padding: "0.4rem", marginBottom: "0.5rem", borderRadius: "0.25rem" }}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                    <div>
                      <label style={{ fontSize: "0.65rem", display: "block" }}>Amount ({values.assetCode})</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Amount"
                        value={row.amount}
                        onChange={(e) => updatePayrollRow(idx, "amount", e.target.value)}
                        style={{ width: "100%", fontSize: "0.75rem", padding: "0.3rem", borderRadius: "0.25rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.65rem", display: "block" }}>Duration (Days)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Days"
                        value={row.durationDays}
                        onChange={(e) => updatePayrollRow(idx, "durationDays", e.target.value)}
                        style={{ width: "100%", fontSize: "0.75rem", padding: "0.3rem", borderRadius: "0.25rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.65rem", display: "block" }}>Cliff (Days)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Cliff"
                        value={row.cliffDays}
                        onChange={(e) => updatePayrollRow(idx, "cliffDays", e.target.value)}
                        style={{ width: "100%", fontSize: "0.75rem", padding: "0.3rem", borderRadius: "0.25rem" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: "0.75rem", alignSelf: "flex-start" }}
                onClick={addPayrollRow}
              >
                + Add Employee
              </button>
            </div>
          )}

          {/* Payroll KPI Summary Card */}
          <div style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(59, 130, 246, 0.3)", background: "rgba(59, 130, 246, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>Total Payroll Outflow</div>
              <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                {totalPayrollAmount.toLocaleString()} {values.assetCode}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>Recipients</div>
              <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                {payrollRows.length} active streams
              </div>
            </div>
          </div>

          {payrollErrors && (
            <div className="field-error" role="alert" style={{ marginTop: "0.5rem" }}>
              {payrollErrors}
            </div>
          )}
        </div>
      )}

      {streamMode !== "payroll" && (
        <div className="row">
          <div
            className={`field-group${errors.durationMinutes ? " field-group--error" : ""}`}
          >
            <label htmlFor="stream-duration">
              Duration (minutes)
              <span className="field-required" aria-hidden>
                *
              </span>
            </label>
            <input
              id="stream-duration"
              type="number"
              min="1"
              step="1"
              value={values.durationMinutes}
              onChange={set("durationMinutes")}
              onBlur={blur("durationMinutes")}
              onKeyDown={(e) => {
                if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
              }}
              aria-describedby={
                errors.durationMinutes ? "duration-error" : (estimatedEndLabel ? "duration-hint" : undefined)
              }
              aria-invalid={!!errors.durationMinutes}
              required
            />
            {estimatedEndLabel && (
              <span id="duration-hint" className="field-hint" aria-live="polite">
                {estimatedEndLabel}
              </span>
            )}
            {errors.durationMinutes && (
              <span id="duration-error" className="field-error" role="alert">
                {errors.durationMinutes}
              </span>
            )}
          </div>

          <div
            className={`field-group${errors.startInMinutes ? " field-group--error" : ""}`}
          >
            <label htmlFor="stream-start">
              Start In (minutes)
              <span className="field-required" aria-hidden>
                *
              </span>
            </label>
            <input
              id="stream-start"
              type="number"
              min="0"
              step="1"
              value={values.startInMinutes}
              onChange={set("startInMinutes")}
              onBlur={blur("startInMinutes")}
              onKeyDown={(e) => {
                if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
              }}
              aria-describedby={
                errors.startInMinutes ? "start-error" : "start-hint"
              }
              aria-invalid={!!errors.startInMinutes}
              required
            />
            <span id="start-hint" className="field-hint">
              Enter 0 to start immediately
            </span>
            {errors.startInMinutes && (
              <span id="start-error" className="field-error" role="alert">
                {errors.startInMinutes}
              </span>
            )}
          </div>
        </div>
      )}

      {streamMode !== "payroll" && (
      <div
        className={`field-group${errors.cliffDays ? " field-group--error" : ""}`}
      >
        <label htmlFor="stream-cliff">
          Cliff Period (days)
        </label>
        <input
          id="stream-cliff"
          type="number"
          min="0"
          step="1"
          value={values.cliffDays}
          onChange={set("cliffDays")}
          onBlur={blur("cliffDays")}
          onKeyDown={(e) => {
            if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
          }}
          aria-describedby={
            errors.cliffDays ? "cliff-error" : "cliff-hint"
          }
          aria-invalid={!!errors.cliffDays}
        />
        <span id="cliff-hint" className="field-hint">
          Optional. No tokens vest before the cliff elapses.
        </span>
        {errors.cliffDays && (
          <span id="cliff-error" className="field-error" role="alert">
            {errors.cliffDays}
          </span>
        )}
      </div>
      )}

      {estimatedEndLabel && (
        <div className="field-hint" style={{ marginTop: "-0.5rem", marginBottom: "1rem", color: "var(--color-success-text, #2e7d32)", fontWeight: 500 }}>
          {estimatedEndLabel}
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "1rem" }}>
        {simulationError && !feePreview && (
          <span className="field-error" role="alert">
            {simulationError}
          </span>
        )}
        {simulationError && !feePreview && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => void retryFeeEstimation()}
            disabled={isSubmitting || (streamMode === "single" ? !formValid : streamMode === "split" ? !isSplitValid : !isPayrollValid)}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Estimating..." : "Retry Estimation"}
          </button>
        )}
        {!simulationError && (
          <button
            className="btn-primary"
            type="submit"
            disabled={isSubmitting || (streamMode === "single" ? !formValid : streamMode === "split" ? !isSplitValid : !isPayrollValid)}
            aria-busy={isSubmitting}
          >
            {isSubmitting
              ? (streamMode === "split" ? "Creating..." : streamMode === "payroll" ? "Creating Payroll Batch..." : "Estimating fee...")
              : (streamMode === "split" ? "Create Split Stream" : streamMode === "payroll" ? `Create Payroll Streams (${payrollRows.length})` : "Create Stream")}
          </button>
        )}
      </div>
    </form>
    {feePreview && (
      <div className="modal-backdrop" role="presentation">
        <div
          className="modal-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fee-preview-title"
        >
          <div className="modal-header">
            <h3 id="fee-preview-title" className="modal-title">
              Confirm stream creation
            </h3>
            <button
              type="button"
              className="modal-close"
              aria-label="Cancel fee preview"
              onClick={() => setFeePreview(null)}
              disabled={isConfirming}
            >
              x
            </button>
          </div>

          {simulationError && (
            <div className="api-error-box" role="alert">
              <div className="api-error-box__title">Submission failed</div>
              <div className="api-error-box__hint">{simulationError}</div>
            </div>
          )}

          <dl className="fee-preview-list">
            <div>
              <dt>Total amount</dt>
              <dd>
                {feePreview.payload.totalAmount} {feePreview.payload.assetCode}
              </dd>
            </div>
            <div>
              <dt>Stream rate</dt>
              <dd>{formatStreamRate(feePreview.payload)}</dd>
            </div>
            <div>
              <dt>Network fee estimate</dt>
              <dd>{feePreview.estimate.feeXlm} XLM</dd>
            </div>
          </dl>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setFeePreview(null)}
              disabled={isConfirming}
            >
              {simulationError ? "Edit" : "Cancel"}
            </button>
            {simulationError ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => void confirmCreateStream()}
                disabled={isConfirming}
                aria-busy={isConfirming}
              >
                {isConfirming ? "Retrying..." : "Retry Confirmation"}
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={() => void confirmCreateStream()}
                disabled={isConfirming}
                aria-busy={isConfirming}
              >
                {isConfirming ? "Creating..." : "Confirm"}
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
