import type { Stream } from "../types/stream";

export interface KpiMetricsGridProps {
  streams: Stream[];
}

export function KpiMetricsGrid({ streams }: KpiMetricsGridProps) {
  const activeStreams = streams.filter(
    (s) => s.progress?.status === "active"
  );

  const totalVolume = streams.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  const totalVested = streams.reduce((sum, s) => sum + (Number(s.progress?.vestedAmount) || 0), 0);
  const totalVelocityPerSec = activeStreams.reduce(
    (sum, s) => sum + (Number(s.progress?.ratePerSecond) || 0),
    0
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Volume */}
      <div className="glass-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>Total Stream Volume</span>
          <span className="p-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300">
            📊
          </span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            ${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Across {streams.length} total stream{streams.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* 2. Active Streams */}
      <div className="glass-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>Active Flowing</span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {activeStreams.length}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {streams.length - activeStreams.length} completed / paused
          </p>
        </div>
      </div>

      {/* 3. Aggregate Velocity */}
      <div className="glass-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>Live Flow Velocity</span>
          <span className="p-1 rounded bg-cyan-500/10 text-cyan-500">⚡</span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent font-mono tracking-tight">
            +{(totalVelocityPerSec * 60).toFixed(4)}/min
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            ~{totalVelocityPerSec.toFixed(4)} tokens / second
          </p>
        </div>
      </div>

      {/* 4. Total Vested */}
      <div className="glass-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>Total Vested Funds</span>
          <span className="p-1 rounded bg-indigo-500/10 text-indigo-400">💰</span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            ${totalVested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {totalVolume > 0 ? ((totalVested / totalVolume) * 100).toFixed(1) : 0}% unlocked
          </p>
        </div>
      </div>
    </div>
  );
}
