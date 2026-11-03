import React, { useState } from "react";

interface SettingsWindowProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function SettingsWindow({ theme, onToggleTheme }: SettingsWindowProps) {
  const [network, setNetwork] = useState<"testnet" | "futurenet" | "mainnet">("testnet");
  const [rpcUrl, setRpcUrl] = useState("https://soroban-testnet.stellar.org");
  const [refreshInterval, setRefreshInterval] = useState("2s");
  const [soundEffects, setSoundEffects] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleClearCache = () => {
    try {
      localStorage.removeItem("stellarflow:draft");
      localStorage.removeItem("stellarflow:recent_searches");
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    } catch {
      // ignore in test or restricted mode
    }
  };

  return (
    <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-180px)] font-mono text-xs sm:text-sm">
      <div className="mb-6 border_ui_b pb-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          /settings — PROTOCOL CONFIGURATION & ENVIRONMENT
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-sans">
          Manage Soroban RPC endpoints, testnet environment parameters, appearance, and local cache.
        </p>
      </div>

      <div className="space-y-6">
        {/* Network & RPC Section */}
        <div className="border_ui rounded-xl p-4 bg-white/70 dark:bg-[#13151D]/90 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Network & RPC Gateway</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              ● CONNECTED
            </span>
          </div>

          <div className="space-y-3 font-sans">
            <div>
              <label className="block text-xs font-mono font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Stellar Network
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["testnet", "futurenet", "mainnet"] as const).map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setNetwork(net)}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono uppercase font-bold transition-all ${
                      network === net
                        ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                        : "border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {net}
                    {net === "mainnet" && (
                      <span className="block text-[9px] font-normal opacity-70">Coming soon</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-gray-700 dark:text-gray-300 mb-1">
                Soroban RPC Node Endpoint
              </label>
              <input
                type="text"
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 font-mono text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Default: Official Stellar Development Foundation Testnet RPC
              </p>
            </div>
          </div>
        </div>

        {/* Display & OS Theme */}
        <div className="border_ui rounded-xl p-4 bg-white/70 dark:bg-[#13151D]/90 space-y-4">
          <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Display & Desktop Environment</span>
          
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5 font-sans">
            <div>
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Interface Theme</p>
              <p className="text-[11px] text-gray-500">Toggle between warm paper light and obsidian dark modes</p>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-mono text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2"
            >
              <span>{theme === "dark" ? "🌙 Dark" : "☀️ Light"}</span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400">switch</span>
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5 font-sans">
            <div>
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Real-Time Flow Polling Rate</p>
              <p className="text-[11px] text-gray-500">High-velocity streaming counter update frequency</p>
            </div>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1c26] text-xs font-mono font-medium text-gray-900 dark:text-gray-100"
            >
              <option value="1s">1.0 sec (Fastest)</option>
              <option value="2s">2.0 sec (Balanced)</option>
              <option value="5s">5.0 sec (Low Power)</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2 font-sans">
            <div>
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Terminal & Window Audio Feedback</p>
              <p className="text-[11px] text-gray-500">Subtle retro keystroke audio clicks on command submit</p>
            </div>
            <button
              type="button"
              onClick={() => setSoundEffects(!soundEffects)}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                soundEffects
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400"
              }`}
            >
              {soundEffects ? "ENABLED" : "MUTED"}
            </button>
          </div>
        </div>

        {/* Local Storage & Cache Clear */}
        <div className="border_ui rounded-xl p-4 bg-white/70 dark:bg-[#13151D]/90 space-y-3">
          <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Storage & Diagnostics</span>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-sans">
            Clear stored form drafts, filter preferences, and cached stream histories in your browser session.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClearCache}
              className="px-4 py-2 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 font-mono text-xs font-bold transition-all"
            >
              {cacheCleared ? "✓ CACHE PURGED" : "PURGE LOCAL DRAFTS & CACHE"}
            </button>
            {cacheCleared && (
              <span className="text-xs text-emerald-500 font-mono">Local storage cleaned successfully.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

