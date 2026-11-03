import React, { useState } from "react";

interface FloatingWindowProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  onMinimize?: () => void;
  children: React.ReactNode;
  initialWidth?: string;
  initialHeight?: string;
  zIndex?: number;
  onFocus?: () => void;
  headerRight?: React.ReactNode;
}

export function FloatingWindow({
  title,
  icon,
  onClose,
  onMinimize,
  children,
  initialWidth = "max-w-4xl",
  zIndex = 20,
  onFocus,
  headerRight,
}: FloatingWindowProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <div
      onClick={onFocus}
      style={{ zIndex }}
      className={`absolute transition-all duration-200 ease-out flex flex-col border border-(--color-line) bg-[#F4F3EF]/95 dark:bg-[#11131C]/95 backdrop-blur-md shadow-2xl rounded-lg overflow-hidden ${
        isMaximized
          ? "inset-2 md:inset-3 rounded-none"
          : `inset-x-2 top-2 md:top-4 bottom-2 md:bottom-4 mx-auto w-full ${initialWidth}`
      }`}
    >
      {/* ── WINDOW TITLEBAR ── */}
      <div
        className="flex items-center justify-between border-b border-(--color-line) px-3 py-2 shrink-0 bg-black/[0.03] dark:bg-white/[0.03] select-none cursor-default"
      >
        <div className="flex items-center gap-2">
          {/* macOS / Retro Traffic Lights */}
          <div className="flex items-center gap-1.5 mr-2">
            <button
              type="button"
              onClick={onClose}
              className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] border border-black/10 hover:brightness-90 flex items-center justify-center text-[8px] text-black/60 font-bold transition-all"
              title="Close window"
            >
              ×
            </button>
            <button
              type="button"
              onClick={onMinimize || onClose}
              className="w-3.5 h-3.5 rounded-full bg-[#febc2e] border border-black/10 hover:brightness-90 flex items-center justify-center text-[8px] text-black/60 font-bold transition-all"
              title="Minimize window"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="w-3.5 h-3.5 rounded-full bg-[#28c840] border border-black/10 hover:brightness-90 flex items-center justify-center text-[8px] text-black/60 font-bold transition-all"
              title={isMaximized ? "Restore window" : "Maximize window"}
            >
              +
            </button>
          </div>

          {/* Window Title & Icon */}
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-tight text-gray-800 dark:text-gray-200">
            {icon && <span className="opacity-70 text-sm">{icon}</span>}
            <span>{title}</span>
          </div>
        </div>

        {/* Right side controls/badge */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {headerRight}
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            ● ACTIVE
          </span>
        </div>
      </div>

      {/* ── WINDOW CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto os-scrollbar p-3 sm:p-5">
        {children}
      </div>
    </div>
  );
}

