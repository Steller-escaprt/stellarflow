import { useLiveStreamAmount } from "../hooks/useLiveStreamAmount";
import type { Stream } from "../types/stream";

export interface LiveStreamCardProps {
  stream: Stream;
  onOpenDetail?: (id: string) => void;
  onCancel?: (id: string) => Promise<void>;
  onPause?: (id: string) => Promise<void>;
  onResume?: (id: string) => Promise<void>;
  currentAddress?: string | null;
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function LiveStreamCard({
  stream,
  onOpenDetail,
  onCancel,
  onPause,
  onResume,
  currentAddress,
}: LiveStreamCardProps) {
  const { streamedFormatted, percentComplete, isCliffActive, status } = useLiveStreamAmount(stream);

  const isSender = !currentAddress || currentAddress.toLowerCase() === stream.sender.toLowerCase();
  const isPaused = status === "paused";
  const isActive = status === "active";
  const isCompleted = status === "completed";
  const isCanceled = status === "canceled";

  const statusBadge = () => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
          Active
        </span>
      );
    }
    if (isPaused) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          Paused
        </span>
      );
    }
    if (isCompleted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Completed
        </span>
      );
    }
    if (isCanceled) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          Canceled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
        Scheduled
      </span>
    );
  };

  return (
    <div
      data-testid={`stream-card-${stream.id}`}
      onClick={() => onOpenDetail?.(stream.id)}
      className="glass-card glass-card-hover p-5 cursor-pointer flex flex-col justify-between gap-4 transition-all relative overflow-hidden group"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#3E1BDB] to-[#7B61FF] text-white font-bold text-xs flex items-center justify-center shadow-sm">
            {stream.assetCode.slice(0, 3)}
          </div>
          <div>
            <span className="font-bold text-sm text-gray-900 dark:text-white">
              {stream.assetCode}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              To: {truncateAddress(stream.recipient)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isCliffActive && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Cliff Lock
            </span>
          )}
          {statusBadge()}
        </div>
      </div>

      {/* Live Stream Value Ticker */}
      <div className="py-2">
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
          Streamed Balance
        </div>
        <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          <span className="bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-800 dark:from-white dark:via-purple-100 dark:to-[#00E5FF] bg-clip-text text-transparent">
            {streamedFormatted}
          </span>
          <span className="text-xs ml-1 text-gray-400 font-normal">{stream.assetCode}</span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          of {Number(stream.totalAmount).toLocaleString()} {stream.assetCode}
        </div>
      </div>

      {/* Progress Bar Track */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
          <span>{percentComplete.toFixed(1)}% Vested</span>
          <span>{isCompleted ? "Finished" : `${Math.max(0, 100 - percentComplete).toFixed(1)}% left`}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#3E1BDB] via-[#7B61FF] to-[#00E5FF] transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium group-hover:underline">
          View Timeline →
        </span>

        {isSender && (isActive || isPaused) && (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {isActive && onPause && (
              <button
                type="button"
                onClick={() => onPause(stream.id)}
                className="px-2.5 py-1 text-xs rounded-lg font-medium text-amber-600 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all"
              >
                Pause
              </button>
            )}
            {isPaused && onResume && (
              <button
                type="button"
                onClick={() => onResume(stream.id)}
                className="px-2.5 py-1 text-xs rounded-lg font-medium text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
              >
                Resume
              </button>
            )}
            {onCancel && (
              <button
                type="button"
                onClick={() => onCancel(stream.id)}
                className="px-2.5 py-1 text-xs rounded-lg font-medium text-rose-600 dark:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

