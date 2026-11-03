import React, { useState, useEffect } from "react";
import { FreighterState } from "../../hooks/useFreighter";
import { WalletButton } from "../WalletButton";
import { OfflineBanner } from "../OfflineBanner";
import { BackgroundCanvas } from "./BackgroundCanvas";
import { CompassHud } from "./CompassHud";
import { FloatingWindow } from "./FloatingWindow";
import { ProjectsWindow } from "./ProjectsWindow";
import { TerminalWindow } from "./TerminalWindow";
import { NotesWindow } from "./NotesWindow";
import { PlaygroundWindow } from "./PlaygroundWindow";
import { SkillsWindow } from "./SkillsWindow";
import { ContractWindow } from "./ContractWindow";
import { SettingsWindow } from "./SettingsWindow";
import { SenderDashboard as SenderDashboardPage } from "../../pages/SenderDashboard";
import { RecipientDashboard } from "../RecipientDashboard";

export type WindowId =
  | "home"
  | "streams"
  | "vesting"
  | "contract"
  | "payroll"
  | "claims"
  | "architecture"
  | "terminal"
  | "settings"
  | "sender"
  | "recipient"
  | "projects";

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
  initialWindow = "home",
  onNavigate,
}: StellarFlowOSProps) {
  const [activeWindow, setActiveWindow] = useState<WindowId>(initialWindow);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [searchCommand, setSearchCommand] = useState("");

  // Sync initialWindow
  useEffect(() => {
    setActiveWindow(initialWindow);
    setIsMinimized(false);
  }, [initialWindow]);

  // Digital Clock
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
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectWindow = (id: WindowId) => {
    if (activeWindow === id && !isMinimized) {
      return;
    }
    setActiveWindow(id);
    setIsMinimized(false);
    if (onNavigate) {
      onNavigate(id);
    }
  };

  const handleClear = () => {
    setActiveWindow("home");
    setIsMinimized(true);
    if (onNavigate) {
      onNavigate("home");
    }
  };

  const handleOpenCreate = () => {
    handleSelectWindow("streams");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("stellarflow:open-create"));
    }, 100);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = searchCommand.trim().toLowerCase();
    setSearchCommand("");

    if (!cmd) return;

    if (cmd === "streams" || cmd === "stream" || cmd === "projects" || cmd === "ls") {
      handleSelectWindow("streams");
    } else if (cmd === "vesting" || cmd === "playground" || cmd === "calc" || cmd === "speed") {
      handleSelectWindow("vesting");
    } else if (cmd === "contract" || cmd === "soroban" || cmd === "wasm" || cmd === "escrow") {
      handleSelectWindow("contract");
    } else if (cmd === "payroll" || cmd === "notes" || cmd === "batch" || cmd === "dao") {
      handleSelectWindow("payroll");
    } else if (cmd === "claims" || cmd === "claim" || cmd === "recipient" || cmd === "withdraw") {
      handleSelectWindow("claims");
    } else if (cmd === "architecture" || cmd === "skills" || cmd === "stack" || cmd === "sac") {
      handleSelectWindow("architecture");
    } else if (cmd === "terminal" || cmd === "cli" || cmd === "bash" || cmd === "sh") {
      handleSelectWindow("terminal");
    } else if (cmd === "settings" || cmd === "config" || cmd === "rpc") {
      handleSelectWindow("settings");
    } else if (cmd === "sender" || cmd === "outflows") {
      handleSelectWindow("sender");
    } else if (cmd === "create" || cmd === "new") {
      handleOpenCreate();
    } else if (cmd === "clear" || cmd === "home") {
      handleClear();
    } else if (cmd === "theme" || cmd === "dark" || cmd === "light") {
      onToggleTheme();
    } else {
      handleSelectWindow("terminal");
    }
  };

  // ── Protocol Nav Items: What StellarFlow stands for ──
  const navItems = [
    {
      id: "streams" as WindowId,
      label: "streams",
      tooltip: "Payment Streams & Vault",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.616 19q-.691 0-1.153-.462T3 17.384V6.616q0-.691.463-1.153T4.615 5h4.981l2 2h7.789q.69 0 1.153.463T21 8.616v8.769q0 .69-.462 1.153T19.385 19zm0-1h14.769q.269 0 .442-.173t.173-.442v-8.77q0-.269-.173-.442T19.385 8h-8.19l-2-2h-4.58q-.269 0-.442.173T4 6.616v10.769q0 .269.173.442t.443.173M4 18V6z" />
        </svg>
      ),
    },
    {
      id: "vesting" as WindowId,
      label: "vesting",
      tooltip: "Linear Vesting & Cliff Simulator",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
        </svg>
      ),
    },
    {
      id: "contract" as WindowId,
      label: "contract",
      tooltip: "Soroban WASM Escrow Spec",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
      ),
    },
    {
      id: "payroll" as WindowId,
      label: "payroll",
      tooltip: "Bulk DAO & Enterprise Dispatch",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
    },
    {
      id: "claims" as WindowId,
      label: "claims",
      tooltip: "Instant Recipient Withdrawal Vault",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
        </svg>
      ),
    },
    {
      id: "architecture" as WindowId,
      label: "architecture",
      tooltip: "SAC Bridge & Protocol Stack",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9.07l-9-7-9 7 1.63 1.27L12 16z" />
        </svg>
      ),
    },
    {
      id: "terminal" as WindowId,
      label: "terminal",
      tooltip: "Soroban CLI bash 80x24",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 19V7H4v12h16m0-14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h16m-9 11v-2H7.5l2.5-2.5L7.5 9H11V7H5.5l3.5 3.5L5.5 14H11m2 2h6v-2h-6v2Z" />
        </svg>
      ),
    },
    {
      id: "settings" as WindowId,
      label: "settings",
      tooltip: "Network & RPC Gateways",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54A.484.484 0 0 0 14 2h-4c-.25 0-.46.18-.49.42l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.63 8.51c-.11.2-.07.45.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.49.41h4c.25 0 .46-.18.49-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="h-[98dvh] md:h-[calc(100dvh-20px)] m-2.5 flex flex-col gap-2 font-mono text-sm select-none text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* ── TOP SECTION (SIDEBAR + MAIN WORKSPACE) ── */}
      <div className="flex flex-1 min-h-0 gap-2">
        {/* ── ASIDE (LEFT SIDEBAR LAUNCHER) ── */}
        <aside className="hidden md:flex w-48 shrink-0 flex-col justify-between border_ui h-full py-4 px-4 bg-[#F4F3EF] dark:bg-[#0C0D12]">
          <div>
            <div className="mb-1 tracking-wide font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>STELLARFLOW OS</span>
            </div>
            <div className="text-xs opacity-50 mb-6">v1.0.0 · PROTOCOL 22</div>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = (activeWindow === item.id || (activeWindow === "projects" && item.id === "streams")) && !isMinimized;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectWindow(item.id)}
                    className={`group flex items-center gap-3 py-2 px-1 text-left transition-colors cursor-pointer rounded ${
                      isActive
                        ? "text-purple-600 dark:text-purple-400 font-bold"
                        : "opacity-60 hover:opacity-100 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 transition-opacity bg-purple-600 dark:bg-purple-400 ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <span className="inline-flex text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-red-500"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42A7.92 7.92 0 0 1 20 12c0 4.42-3.58 8-8 8s-8-3.58-8-8c0-2.48 1.13-4.7 2.91-6.17L5.49 4.41A9.957 9.957 0 0 0 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10c0-2.95-1.28-5.61-3.17-7.83z" />
              </svg>
              <span>CLEAR</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN WORKSPACE COLUMN ── */}
        <div className="flex-1 flex flex-col min-w-0 gap-2">
          {/* Top Status Header */}
          <header className="h-[4vh] min-h-[32px] flex justify-between items-center border_ui px-3 bg-[#F4F3EF] dark:bg-[#0C0D12] text-xs">
            <div className="opacity-70 font-mono">
              /{activeWindow === "home" || isMinimized ? "home" : activeWindow}
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <span className="cursor-default hover:text-purple-500 transition-colors hidden sm:inline text-gray-500">
                {currentDate}
              </span>
              <span className="cursor-default hover:text-purple-500 transition-colors font-bold text-gray-800 dark:text-gray-200">
                {currentTime}
              </span>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={onToggleTheme}
                className="hover:opacity-75 transition-opacity px-1"
                title="Toggle Theme"
              >
                {theme === "dark" ? "🌙" : "☀️"}
              </button>

              {/* Wallet Integration */}
              <div className="scale-90 origin-right">
                <WalletButton wallet={wallet} />
              </div>
            </div>
          </header>

          {/* Offline Alert if any */}
          <OfflineBanner />

          {/* Workspace Area with Ambient Canvas & Compass */}
          <div className="relative flex-1 min-h-0 overflow-hidden border_ui bg-[#F4F3EF] dark:bg-[#0C0D12]">
            {/* ── DESKTOP BACKGROUND LAYER ── */}
            <div className="absolute inset-0 z-0 p-5 sm:p-7 flex flex-col justify-between overflow-y-auto overflow-x-hidden no-scrollbar">
              {/* Dynamic Particle Canvas */}
              <BackgroundCanvas />

              {/* Rotating Compass HUD */}
              <CompassHud />

              {/* Desktop Greeting & Write-up: What StellarFlow Stands For */}
              <div className="my-auto py-4 max-w-2xl space-y-4 z-10">
                <div className="text-xs uppercase tracking-widest text-emerald-500 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>PROTOCOL ONLINE · STELLAR TESTNET PROTOCOL 22</span>
                </div>
                <div className="text-sm opacity-80 font-mono text-gray-500 dark:text-gray-400">
                  DECENTRALIZED STREAMING ESCROW
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                  I&apos;m StellarFlow<span className="text-purple-600 dark:text-purple-400 animate-cursor">_</span>
                </h1>
                <div className="text-xs uppercase tracking-widest text-purple-600 dark:text-purple-400 font-bold">
                  continuous payment streaming &amp; linear token vesting
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-sans leading-relaxed">
                  StellarFlow delivers continuous, second-by-second programmatic liquidity on the Stellar blockchain.
                  Powered by immutable Soroban smart contracts, we eliminate idle capital lockups, manual payroll batches,
                  and cliff distribution delays with sub-cent gas fees and instant recipient withdrawals.
                </p>

                {/* Capability Tag Chips */}
                <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                  {[
                    { label: "continuous vesting", window: "vesting" },
                    { label: "sub-second velocity", window: "streams" },
                    { label: "soroban wasm escrow", window: "contract" },
                    { label: "bulk dao payroll", window: "payroll" },
                    { label: "sep-41 sac bridge", window: "architecture" },
                    { label: "instant claims", window: "claims" },
                    { label: "protocol cli", window: "terminal" },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleSelectWindow(chip.window as WindowId)}
                      className="px-2.5 py-1 rounded border border-gray-300 dark:border-white/10 hover:border-purple-500 bg-black/5 dark:bg-white/5 opacity-80 hover:opacity-100 transition-all cursor-pointer font-mono"
                    >
                      [{chip.label}]
                    </button>
                  ))}
                </div>

                {/* Action CTA Buttons */}
                <div className="pt-2 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectWindow("streams")}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>&gt; explore payment streams</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectWindow("vesting")}
                    className="px-3.5 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-purple-500/40 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>⚡ vesting simulator</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectWindow("terminal")}
                    className="px-3.5 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-gray-300 dark:border-white/10 hover:border-purple-500 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"
                  >
                    <span>$ launch cli</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── FLOATING WINDOWS LAYER ── */}
            {activeWindow !== "home" && !isMinimized && (
              <>
                {(activeWindow === "streams" || activeWindow === "projects") && (
                  <FloatingWindow
                    id="streams"
                    title="/streams — PAYMENT STREAMS & ARCHITECTURAL PILLARS"
                    icon={
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.616 19q-.691 0-1.153-.462T3 17.384V6.616q0-.691.463-1.153T4.615 5h4.981l2 2h7.789q.69 0 1.153.463T21 8.616v8.769q0 .69-.462 1.153T19.385 19zm0-1h14.769q.269 0 .442-.173t.173-.442v-8.77q0-.269-.173-.442T19.385 8h-8.19l-2-2h-4.58q-.269 0-.442.173T4 6.616v10.769q0 .269.173.442t.443.173M4 18V6z" />
                      </svg>
                    }
                    onClose={handleClear}
                    onMinimize={() => setIsMinimized(true)}
                  >
                    <ProjectsWindow
                      wallet={wallet}
                      onOpenCreate={handleOpenCreate}
                      onOpenTerminal={() => handleSelectWindow("terminal")}
                      onOpenRecipient={() => handleSelectWindow("claims")}
                      onOpenContract={() => handleSelectWindow("contract")}
                    />
                  </FloatingWindow>
                )}

                {activeWindow === "vesting" && (
                  <FloatingWindow
                    id="vesting"
                    title="/vesting — LINEAR VESTING SIMULATOR & CALCULATOR"
                    icon={
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                      </svg>
                    }
                    onClose={handleClear}
                    onMinimize={() => setIsMinimized(true)}
                  >
                    <PlaygroundWindow walletAddress={wallet.address} />
                  </FloatingWindow>
                )}

                {activeWindow === "contract" && (
                  <FloatingWindow
                    id="contract"
                    title="/contract — SOROBAN SMART CONTRACT SPEC"
                    icon={
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                      </svg>
                    }
                    onClose={handleClear}
                    onMinimize={() => setIsMinimized(true)}
                  >
                    <ContractWindow />
                  </FloatingWindow>
                )}

                {activeWindow === "payroll" && (
                  <FloatingWindow
                    id="payroll"
                    title="/payroll — DISBURSEMENT MILESTONES & BATCH DISPATCH"
                    icon={
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                      </svg>
                    }
                    onClose={handleClear}
                    onMinimize={() => setIsMinimized(true)}
                  >
                    <NotesWindow />
                  </FloatingWindow>
                )}

                {activeWindow === "claims" && (
                  <FloatingWindow
                    id="claims"
                    title="/claims — RECIPIENT INFLOWS & INSTANT WITHDRAWALS"
                    icon={
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                      </svg>
                    }
                    onClose={handleClear}
                    onMinimize={() => setIsMinimized(true)}
                  >
                    <RecipientDashboard recipientAddress={wallet.address} />
                  </FloatingWindow>
                )}

                {activeWindow === "architecture" && (
                  <FloatingWindow
                    id="architecture"
                    title="/architecture — SAC BRIDGE & PROTOCOL STACK"
                    icon={
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9.07l-9-7-9 7 1.63 1.27L12 16z" />
                      </svg>
                    }
                    onClose={handleClear}
                    onMinimize={() => setIsMinimized(true)}
                  >
                    <SkillsWindow />
                  </FloatingWindow>
                )}

                {activeWindow === "terminal" && (
                  <FloatingWindow
                    id="terminal"
                    title="bash — stellarflow-cli 80x24"
                    icon={
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 19V7H4v12h16m0-14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h16m-9 11v-2H7.5l2.5-2.5L7.5 9H11V7H5.5l3.5 3.5L5.5 14H11m2 2h6v-2h-6v2Z" />
                      </svg>
                    }
                    onClose={handleClear}
                    onMinimize={() => setIsMinimized(true)}
                  >
                    <TerminalWindow
                      walletAddress={wallet.address}
                      onOpenCreate={handleOpenCreate}
                      onOpenStreams={() => handleSelectWindow("streams")}
                    />
                  </FloatingWindow>
                )}

                {activeWindow === "settings" && (
                  <FloatingWindow
                    id="settings"
                    title="/settings — RPC GATEWAYS & OS CONFIGURATION"
                    icon={
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54A.484.484 0 0 0 14 2h-4c-.25 0-.46.18-.49.42l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.63 8.51c-.11.2-.07.45.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.49.41h4c.25 0 .46-.18.49-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                      </svg>
                    }
                    onClose={handleClear}
                    onMinimize={() => setIsMinimized(true)}
                  >
                    <SettingsWindow theme={theme} onToggleTheme={onToggleTheme} />
                  </FloatingWindow>
                )}

                {activeWindow === "sender" && (
                  <FloatingWindow
                    id="sender"
                    title="/sender — OUTFLOWS & PAYROLL ANALYTICS"
                    onClose={handleClear}
                    onMinimize={() => setIsMinimized(true)}
                  >
                    <SenderDashboardPage wallet={wallet} />
                  </FloatingWindow>
                )}

                {activeWindow === "recipient" && (
                  <FloatingWindow
                    id="recipient"
                    title="/recipient — INFLOWS & INSTANT CLAIMS"
                    onClose={handleClear}
                    onMinimize={() => setIsMinimized(true)}
                  >
                    <RecipientDashboard recipientAddress={wallet.address} />
                  </FloatingWindow>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: PROTOCOL LINKS + COMMAND SEARCH BAR ── */}
      <footer className="flex flex-col md:flex-row md:h-[5vh] md:items-center md:justify-between gap-2 md:gap-3 border_ui px-3 py-2 md:py-0 text-xs bg-[#F4F3EF] dark:bg-[#0C0D12]">
        {/* Left: Protocol links */}
        <div className="flex items-center justify-between gap-3 shrink-0 w-full md:w-auto">
          <span className="hidden md:inline opacity-60 mr-1">protocol links:</span>
          <div className="flex items-center justify-around md:justify-start gap-4 sm:gap-6 w-full md:w-auto">
            <a
              href="https://github.com/Steller-escaprt/stellarflow"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-60 hover:opacity-100 transition-opacity"
              title="GitHub Repository"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://stellar.expert/explorer/testnet/contract/CCJW2RLIN4MQQ4DAJMMR3F5QPDA6QYTKXJMEVI3XOTDBTBCLBB553J74"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-60 hover:opacity-100 transition-opacity text-[11px] font-bold"
              title="Stellar.Expert Testnet Contract"
            >
              stellar.expert ↗
            </a>
            <a
              href="https://developers.stellar.org/docs/smart-contracts"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-60 hover:opacity-100 transition-opacity text-[11px]"
              title="Soroban Documentation"
            >
              soroban docs ↗
            </a>
            <a
              href="mailto:contact@stellarflow.finance"
              className="opacity-60 hover:opacity-100 transition-opacity"
              title="Contact Protocol Team"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Right: Command Prompt Search */}
        <form onSubmit={handleCommandSubmit} className="flex-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="opacity-60 select-none">&gt;&gt;</span>
            <input
              type="text"
              value={searchCommand}
              onChange={(e) => setSearchCommand(e.target.value)}
              placeholder="type for search and ENTER... (try: streams, vesting, contract, payroll, claims, architecture, terminal)"
              className="w-full bg-transparent text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none font-mono"
            />
          </div>
        </form>
      </footer>
    </div>
  );
}
