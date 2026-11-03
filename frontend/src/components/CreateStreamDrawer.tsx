import { useEffect } from "react";
import { CreateStreamForm } from "./CreateStreamForm";
import type { CreateStreamPayload, CreateSplitStreamPayload } from "../types/stream";

export interface CreateStreamDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateStreamPayload) => Promise<void>;
  onCreateSplit?: (payload: CreateSplitStreamPayload) => Promise<void>;
  onCreateBatch?: (payloads: CreateStreamPayload[]) => Promise<void>;
  walletAddress?: string | null;
  apiError?: string | null;
}

export function CreateStreamDrawer({
  isOpen,
  onClose,
  onCreate,
  onCreateSplit,
  onCreateBatch,
  walletAddress,
  apiError,
}: CreateStreamDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleCreateAndClose = async (payload: CreateStreamPayload) => {
    await onCreate(payload);
    onClose();
  };

  const handleCreateSplitAndClose = async (payload: CreateSplitStreamPayload) => {
    if (onCreateSplit) {
      await onCreateSplit(payload);
      onClose();
    }
  };

  const handleCreateBatchAndClose = async (payloads: CreateStreamPayload[]) => {
    if (onCreateBatch) {
      await onCreateBatch(payloads);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-[#141627] border-l border-gray-200 dark:border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden">
          {/* Drawer Header */}
          <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#3E1BDB] to-[#00E5FF]" />
                Create Payment Stream
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Stream tokens continuously over time on Stellar
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer Content */}
          <div className="p-6 overflow-y-auto flex-1">
            <CreateStreamForm
              onCreate={handleCreateAndClose}
              onCreateSplit={onCreateSplit ? handleCreateSplitAndClose : undefined}
              onCreateBatch={onCreateBatch ? handleCreateBatchAndClose : undefined}
              walletAddress={walletAddress}
              apiError={apiError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
