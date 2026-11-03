import { useState } from "react";
import { DashboardPage } from "../../pages/DashboardPage";
import { FreighterState } from "../../hooks/useFreighter";

interface ProjectsWindowProps {
  wallet: FreighterState;
  onOpenCreate: () => void;
  onOpenTerminal: () => void;
  onOpenRecipient: () => void;
  onOpenContract: () => void;
}

export function ProjectsWindow({
  wallet,
  onOpenCreate,
  onOpenTerminal,
  onOpenRecipient,
  onOpenContract,
}: ProjectsWindowProps) {
  const [activeTab, setActiveTab] = useState<"pillars" | "live_streams">("pillars");

  const projects = [
    {
      id: "live-streams",
      title: "LIVE PAYMENT STREAMS EXPLORER",
      badge: "CORE ENGINE",
      description: "Real-time payment streaming dashboard displaying active token velocity, unvested amounts, and live flow tickers.",
      image: "/assets/card-flow-velocity.svg",
      demoLabel: "explore streams →",
      onDemo: () => setActiveTab("live_streams"),
      githubUrl: "https://github.com/Steller-escaprt/stellarflow",
    },
    {
      id: "vesting-engine",
      title: "LINEAR VESTING ENGINE",
      badge: "VESTING MATH",
      description: "Continuous second-by-second linear token release: V(t) = Total × (t - t₀) / Duration, with configurable cliff delays.",
      image: "/assets/card-vesting-engine.svg",
      demoLabel: "run vesting test →",
      onDemo: onOpenTerminal,
      githubUrl: "https://github.com/Steller-escaprt/stellarflow/tree/main/contracts/stream_escrow",
    },
    {
      id: "soroban-core",
      title: "SOROBAN SMART CONTRACT ESCROW",
      badge: "RUST WASM",
      description: "WASM-compiled immutable escrow deployed on Stellar Testnet (CCJW2RLIN4MQQ4DAJMMR3F5QPDA6QYTKXJMEVI3XOTDBTBCLBB553J74).",
      image: "/assets/card-soroban-core.svg",
      demoLabel: "inspect contract →",
      onDemo: onOpenContract,
      externalUrl: "https://stellar.expert/explorer/testnet/contract/CCJW2RLIN4MQQ4DAJMMR3F5QPDA6QYTKXJMEVI3XOTDBTBCLBB553J74",
      githubUrl: "https://github.com/Steller-escaprt/stellarflow",
    },
    {
      id: "bulk-payroll",
      title: "ENTERPRISE BULK PAYROLL DISPATCH",
      badge: "BATCH CSV",
      description: "Multi-recipient CSV batch import allowing DAOs and organizations to stream payroll to dozens of contributors in a single atomic transaction.",
      image: "/assets/card-bulk-payroll.svg",
      demoLabel: "create payroll batch →",
      onDemo: onOpenCreate,
      githubUrl: "https://github.com/Steller-escaprt/stellarflow",
    },
    {
      id: "sac-bridge",
      title: "SEP-41 SAC TOKEN BRIDGE",
      badge: "STELLAR INTEROP",
      description: "Native bridge linking classic Stellar trustline assets (USDC, XLM) directly into Soroban smart contract escrow.",
      image: "/assets/card-sac-bridge.svg",
      demoLabel: "verify SAC bridge →",
      onDemo: onOpenContract,
      githubUrl: "https://github.com/Steller-escaprt/stellarflow",
    },
    {
      id: "claim-portal",
      title: "INSTANT RECIPIENT CLAIM VAULT",
      badge: "1-CLICK WITHDRAW",
      description: "Recipients can withdraw vested funds in real time at any second without waiting for calendar payment dates.",
      image: "/assets/card-claim-portal.svg",
      demoLabel: "open claim vault →",
      onDemo: onOpenRecipient,
      githubUrl: "https://github.com/Steller-escaprt/stellarflow",
    },
    {
      id: "event-indexer",
      title: "REACTIVE EVENT INDEXER & WS",
      badge: "RPC & WEBSOCKET",
      description: "High-throughput ledger cursor pagination with real-time WebSocket pulses for instantaneous client synchronization.",
      image: "/assets/card-event-indexer.svg",
      demoLabel: "open terminal cli →",
      onDemo: onOpenTerminal,
      githubUrl: "https://github.com/Steller-escaprt/stellarflow",
    },
  ];

  return (
    <div className="space-y-5 font-mono text-xs">
      {/* Top Switcher: Pillars vs Live Dashboard */}
      <div className="border_ui_b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            /projects — PROTOCOL ARCHITECTURE &amp; STREAMS
          </h2>
          <p className="text-[11px] text-gray-500 font-sans mt-0.5">
            Explore live streaming escrows, architectural pillars, and Soroban WASM deployments.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-lg border_ui bg-black/5 dark:bg-white/5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("pillars")}
            className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all ${
              activeTab === "pillars"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Pillars &amp; Graphics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("live_streams")}
            className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all ${
              activeTab === "live_streams"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Live Streams Explorer
          </button>
        </div>
      </div>

      {/* ── TAB 1: PILLARS CARDS (Deblun OS /projects style) ── */}
      {activeTab === "pillars" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="border_ui rounded-xl bg-white/70 dark:bg-[#151722] overflow-hidden flex flex-col justify-between hover:border-purple-500/60 transition-all shadow-sm group"
            >
              <div>
                {/* Visual Graphic Header */}
                <div className="relative h-44 w-full bg-black/5 dark:bg-black/40 overflow-hidden border-b border-gray-100 dark:border-white/5">
                  <img
                    src={proj.image}
                    alt={proj.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[9px] font-bold bg-black/70 text-purple-300 border border-purple-500/30 backdrop-blur-sm">
                    {proj.badge}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white tracking-wide">
                      {proj.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-sans line-clamp-3 leading-relaxed">
                    {proj.description}
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 pt-0 flex items-center justify-between border-t border-gray-100 dark:border-white/5 mt-2">
                <div className="flex items-center gap-2 pt-2">
                  {proj.externalUrl ? (
                    <a
                      href={proj.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      {proj.demoLabel}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={proj.onDemo}
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      {proj.demoLabel}
                    </button>
                  )}
                </div>

                {proj.githubUrl && (
                  <a
                    href={proj.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    title="View Source on GitHub"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── TAB 2: LIVE STREAMS EXPLORER ── */
        <div className="pt-2">
          <DashboardPage wallet={wallet} />
        </div>
      )}
    </div>
  );
}
