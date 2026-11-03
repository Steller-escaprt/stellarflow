import React, { useState, useEffect } from "react";
import { FreighterState } from "../../hooks/useFreighter";
import { WalletButton } from "../WalletButton";
import { OfflineBanner } from "../OfflineBanner";
import { ProtocolShowcaseWindow } from "./ProtocolShowcaseWindow";
import { TerminalWindow } from "./TerminalWindow";
import { ContractWindow } from "./ContractWindow";
import { SettingsWindow } from "./SettingsWindow";
import { DashboardPage } from "../../pages/DashboardPage";
import { SenderDashboard as SenderDashboardPage } from "../../pages/SenderDashboard";
import { RecipientDashboard } from "../RecipientDashboard";

export type WindowId =
  | "home"
  | "streams"
  | "protocol"
  | "terminal"
  | "sender"
  | "recipient"
  | "contract"
  | "settings";

interface StellarFlowOSProps {
  wallet: FreighterState;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  initialWindow?: WindowId;
  onNavigate?: (windowId: WindowId) => void;
}

export function StellarFlowOS({
  wallet,
  theme,
  onToggleTheme,
  initialWindow = "streams",
  onNavigate,
}: StellarFlowOSProps) {
  const [activeWindow, setActiveWindow] = useState<WindowId>(initialWindow);
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [ledgerHeight, setLedgerHeight] = useState(614948);
  const [searchCommand, setSearchCommand] = useState("");

  // Sync with initialWindow prop changes
  useEffect(() => {
    setActiveWindow(initialWindow);
  }, [initialWindow]);

  // Live digital clock & simulated ledger increment
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).toUpperCase()
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    const ledgerInterval = setInterval(() => {
      setLedgerHeight((h) => h + 1);
    }, 4500);

    return () => {
      clearInterval(interval);
      clearInterval(ledgerInterval);
    };
  }, []);

  const handleSelectWindow = (id: WindowId) => {
    setActiveWindow(id);
    if (onNavigate) {
      onNavigate(id);
    }
  };

  const handleOpenCreate = () => {
    // If not in streams, switch to streams first
    if (activeWindow !== "streams") {
      handleSelectWindow("streams");
    }
    // Dispatch event for create drawer
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("stellarflow:open-create"));
    }, 50);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = searchCommand.trim().toLowerCase();
    setSearchCommand("");

    if (!cmd) return;

    if (cmd === "streams" || cmd === "stream" || cmd === "ls" || cmd === "dashboard") {
      handleSelectWindow("streams");
    } else if (cmd === "protocol" || cmd === "pillars" || cmd === "about") {
      handleSelectWindow("protocol");
    } else if (cmd === "terminal" || cmd === "bash" || cmd === "cli" || cmd === "sh") {
      handleSelectWindow("terminal");
    } else if (cmd === "sender" || cmd === "outflow" || cmd === "send") {
      handleSelectWindow("sender");
    } else if (cmd === "recipient" || cmd === "inflow" || cmd === "claim") {
      handleSelectWindow("recipient");
    } else if (cmd === "contract" || cmd === "soroban" || cmd === "wasm") {
      handleSelectWindow("contract");
    } else if (cmd === "settings" || cmd === "config") {
      handleSelectWindow("settings");
    } else if (cmd === "create" || cmd === "new") {
      handleOpenCreate();
    } else if (cmd === "clear" || cmd === "home" || cmd === "desktop") {
      handleSelectWindow("home");
    } else if (cmd === "theme" || cmd === "mode" || cmd === "dark" || cmd === "light") {
      onToggleTheme();
    } else {
      // Default: open terminal and run command
      handleSelectWindow("terminal");
    }
  };

  const apps: { id: WindowId; label: string; num: string; desc: string }[] = [
    { id: "streams", label: "streams", num: "01", desc: "Live streaming ledger & explorer" },
    { id: "protocol", label: "protocol", num: "02", desc: "Architectural pillars & graphics" },
    { id: "terminal", label: "terminal", num: "03", desc: "Interactive Soroban CLI" },
    { id: "sender", label: "sender", num: "04", desc: "Outflow analytics & bulk payroll" },
    { id: "recipient", label: "recipient", num: "05", desc: "Inflow tracker & instant claims" },
    { id: "contract", label: "contract", num: "06", desc: "WASM bytecode & math specs" },
    { id: "settings", label: "settings", num: "07", desc: "RPC gateways & preferences" },
  ];

  const getWindowTitle = () => {
    switch (activeWindow) {
      case "streams":
        return "stellarflow://streams — PAYMENT STREAMS EXPLORER";
      case "protocol":
        return "stellarflow://protocol — ARCHITECTURAL PILLARS & GRAPHICS";
      case "terminal":
        return "bash — stellarflow-cli 80x24";
      case "sender":
        return "stellarflow://sender — SENDER OUTFLOWS & PAYROLL";
      case "recipient":
        return "stellarflow://recipient — RECIPIENT INFLOWS & CLAIMS";
      case "contract":
        return "stellarflow://contract — SOROBAN SPEC & VESTING PROOF";
      case "settings":
        return "stellarflow://settings — RPC & OS CONFIGURATION";
      default:
        return "stellarflow-os: ~/projects/stellarflow/frontend";
    }
  };

  return (
    <div className="h-[100dvh] p-2 sm:p-2.5 flex flex-col md:flex-row gap-2 bg-[#F3F2EE] dark:bg-[#0C0D12] text-gray-900 dark:text-gray-100 font-mono select-none overflow-hidden text-xs">
      {/* ── LEFT SIDEBAR LAUNCHER (Deblun OS Aesthetic) ── */}
      <aside className="w-full md:w-56 shrink-0 flex flex-col justify-between border_ui rounded-xl bg-white/80 dark:bg-[#13151D]/90 backdrop-blur-md p-3 shadow-sm">
        <div className="space-y-3">
          {/* OS Header */}
          <div className="border_ui_b pb-2 flex items-center justify-between">
            <div>
              <h1 className="text-xs font-black tracking-wider text-gray-900 dark:text-white uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                STELLARFLOW OS
              </h1>
              <p className="text-[10px] text-gray-400">v1.0.0 · PROTOCOL 22</p>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              TESTNET
            </span>
          </div>

          {/* Quick Create Stream Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 group"
          >
            <span>+</span>
            <span>CREATE STREAM</span>
          </button>

          {/* Apps Navigation List */}
          <nav className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-gray-400 px-2 py-0.5">APPLICATIONS</p>
            {apps.map((app) => {
              const isActive = activeWindow === app.id;
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => handleSelectWindow(app.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-all ${
                    isActive
                      ? "bg-purple-600 text-white font-bold shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`text-[10px] ${isActive ? "text-purple-200" : "text-gray-400"}`}>
                      {app.num}
                    </span>
                    <span>{app.label}</span>
                  </span>
                  {isActive && <span className="text-[10px] text-purple-200">●</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-3 border_ui_t space-y-2">
          <button
            type="button"
            onClick={() => handleSelectWindow("home")}
            className="w-full py-1.5 px-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <span>[ HOME / CLEAR ]</span>
          </button>
          <div className="flex items-center justify-between text-[10px] text-gray-400 px-1 font-sans">
            <a
              href="https://stellar.expert/explorer/testnet/contract/CCJW2RLIN4MQQ4DAJMMR3F5QPDA6QYTKXJMEVI3XOTDBTBCLBB553J74"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-500 transition-colors"
            >
              Stellar.Expert ↗
            </a>
            <a
              href="https://github.com/Steller-escaprt/stellarflow"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-500 transition-colors"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE AREA ── */}
      <main className="flex-1 flex flex-col min-w-0 border_ui rounded-xl bg-white/80 dark:bg-[#13151D]/90 backdrop-blur-md shadow-sm overflow-hidden relative">
        {/* Top Status Bar (Deblun OS Inspired) */}
        <header className="h-10 shrink-0 border_ui_b px-3 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02] text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-gray-400 hidden sm:inline">stellarflow-os:</span>
            <span className="font-bold text-gray-900 dark:text-gray-200 truncate">
              ~/{activeWindow === "home" ? "desktop" : activeWindow}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Ledger status indicator */}
            <span className="hidden lg:inline text-[11px] text-gray-400">
              LEDGER <span className="font-bold text-emerald-500">#{ledgerHeight.toLocaleString()}</span>
            </span>

            {/* Date and Clock */}
            <div className="hidden sm:flex items-center gap-2 text-[11px]">
              <span className="text-gray-400">{currentDate}</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{currentTime}</span>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
              title="Toggle Theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {/* Freighter Wallet Button */}
            <div className="scale-90 origin-right">
              <WalletButton wallet={wallet} />
            </div>
          </div>
        </header>

        {/* Offline Banner alert if network is disconnected */}
        <OfflineBanner />

        {/* Interior Container: Home Layer vs Active Window Layer */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {activeWindow === "home" ? (
            /* ── DESKTOP HOME SCREEN (Inspired by debabratagiri.vercel.app home) ── */
            <div className="flex-1 p-6 sm:p-10 flex flex-col justify-between overflow-y-auto">
              {/* Compass & Top Technical Header */}
              <div className="flex items-center justify-between text-gray-400 text-[11px]">
                <span>LAT 34° 03&apos; N  LON 118° 14&apos; W</span>
                <span className="px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                  ● PROTOCOL ONLINE
                </span>
                <span>SOROBAN PROTOCOL 22</span>
              </div>

              {/* Center Hero Section */}
              <div className="my-auto py-8 max-w-3xl space-y-6">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-purple-600 dark:text-purple-400 font-bold">
                    welcome back
                  </p>
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                    I&apos;m StellarFlow<span className="text-purple-600 dark:text-purple-400 animate-cursor">_</span>
                  </h1>
                </div>

                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-sans leading-relaxed">
                  Decentralized continuous payment streaming &amp; linear token vesting engine built on Stellar
                  Soroban smart contracts. Eliminates counterparty lockup, minimizes payroll latency, and exposes
                  transparent on-chain escrow.
                </p>

                {/* Capability Chips */}
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {[
                    "Continuous Linear Vesting",
                    "Sub-Second Flow Rate",
                    "Soroban WASM Escrow",
                    "Bulk Payroll Import",
                    "SEP-41 SAC Token Bridge",
                    "Trustless Instant Claims",
                  ].map((chip) => (
                    <span
                      key={chip}
                      className="px-2.5 py-1 rounded-md border border-gray-200 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300"
                    >
                      [{chip}]
                    </span>
                  ))}
                </div>

                {/* Quick Action Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectWindow("streams")}
                    className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:border-purple-500 text-left transition-all group"
                  >
                    <div className="text-purple-600 dark:text-purple-400 font-bold text-xs uppercase mb-1">
                      01 /streams →
                    </div>
                    <div className="text-[11px] text-gray-500 font-sans">
                      Explore live payment streams &amp; claim balances
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectWindow("protocol")}
                    className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:border-purple-500 text-left transition-all group"
                  >
                    <div className="text-purple-600 dark:text-purple-400 font-bold text-xs uppercase mb-1">
                      02 /protocol →
                    </div>
                    <div className="text-[11px] text-gray-500 font-sans">
                      Inspect architectural pillars &amp; protocol graphics
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectWindow("terminal")}
                    className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:border-purple-500 text-left transition-all group"
                  >
                    <div className="text-purple-600 dark:text-purple-400 font-bold text-xs uppercase mb-1">
                      03 /terminal →
                    </div>
                    <div className="text-[11px] text-gray-500 font-sans">
                      Interactive Soroban CLI &amp; stream simulator
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectWindow("contract")}
                    className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:border-purple-500 text-left transition-all group"
                  >
                    <div className="text-purple-600 dark:text-purple-400 font-bold text-xs uppercase mb-1">
                      06 /contract →
                    </div>
                    <div className="text-[11px] text-gray-500 font-sans">
                      Soroban WASM spec &amp; vesting math proofs
                    </div>
                  </button>
                </div>
              </div>

              {/* Bottom Interactive Command Bar (Deblun OS signature) */}
              <form onSubmit={handleCommandSubmit} className="pt-4 border_ui_t">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus-within:ring-1 focus-within:ring-purple-500">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">&gt;&gt;</span>
                  <input
                    type="text"
                    value={searchCommand}
                    onChange={(e) => setSearchCommand(e.target.value)}
                    placeholder="type for search and ENTER... (try: streams, protocol, terminal, contract, create, theme)"
                    className="w-full bg-transparent text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none font-mono"
                  />
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest hidden sm:inline">
                    ENTER ↵
                  </span>
                </div>
              </form>
            </div>
          ) : (
            /* ── ACTIVE OS WINDOW CONTAINER ── */
            <div
              className={`flex-1 flex flex-col bg-white dark:bg-[#11131c] transition-all overflow-hidden ${
                isMaximized ? "m-0 rounded-none" : "m-2 sm:m-3 rounded-xl border_ui shadow-xl"
              }`}
            >
              {/* Window Header Titlebar with retro [-] [+] [x] controls */}
              <div className="h-9 shrink-0 border_ui_b px-3 flex items-center justify-between bg-black/[0.03] dark:bg-white/[0.04]">
                <div className="flex items-center gap-2">
                  {/* Retro Window Control Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectWindow("home")}
                      className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-[8px] text-white font-bold opacity-80 hover:opacity-100 transition-opacity"
                      title="Close Window (return to Desktop)"
                    >
                      ×
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectWindow("home")}
                      className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 flex items-center justify-center text-[8px] text-white font-bold opacity-80 hover:opacity-100 transition-opacity"
                      title="Minimize Window"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMaximized(!isMaximized)}
                      className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold opacity-80 hover:opacity-100 transition-opacity"
                      title={isMaximized ? "Restore Window" : "Maximize Window"}
                    >
                      +
                    </button>
                  </div>

                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 ml-2">
                    {getWindowTitle()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    ● ACTIVE
                  </span>
                </div>
              </div>

              {/* Window Interior Content */}
              <div className="flex-1 overflow-y-auto os-scrollbar">
                {activeWindow === "streams" && <DashboardPage wallet={wallet} />}
                {activeWindow === "protocol" && (
                  <ProtocolShowcaseWindow
                    onOpenStreams={() => handleSelectWindow("streams")}
                    onOpenCreate={handleOpenCreate}
                    onOpenTerminal={() => handleSelectWindow("terminal")}
                  />
                )}
                {activeWindow === "terminal" && (
                  <TerminalWindow
                    walletAddress={wallet.address}
                    onOpenCreate={handleOpenCreate}
                    onOpenStreams={() => handleSelectWindow("streams")}
                  />
                )}
                {activeWindow === "sender" && <SenderDashboardPage wallet={wallet} />}
                {activeWindow === "recipient" && (
                  <div className="p-4 sm:p-6">
                    <RecipientDashboard recipientAddress={wallet.address} />
                  </div>
                )}
                {activeWindow === "contract" && <ContractWindow />}
                {activeWindow === "settings" && (
                  <SettingsWindow theme={theme} onToggleTheme={onToggleTheme} />
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
