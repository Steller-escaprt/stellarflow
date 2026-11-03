interface ProtocolPillar {
  id: string;
  title: string;
  badge: string;
  description: string;
  image: string;
  linkText: string;
  onAction?: () => void;
  href?: string;
}

interface ProtocolShowcaseWindowProps {
  onOpenStreams: () => void;
  onOpenCreate: () => void;
  onOpenTerminal: () => void;
}

export function ProtocolShowcaseWindow({
  onOpenStreams,
  onOpenCreate,
  onOpenTerminal,
}: ProtocolShowcaseWindowProps) {
  const pillars: ProtocolPillar[] = [
    {
      id: "vesting-engine",
      title: "LINEAR VESTING ENGINE",
      badge: "VESTING MATH",
      description:
        "Continuous second-by-second linear token release: V(t) = Total × (t - t₀) / Duration, with configurable cliff lockups and zero unvested token leakage.",
      image: "/assets/card-vesting-engine.svg",
      linkText: "view formula & test →",
      onAction: onOpenTerminal,
    },
    {
      id: "soroban-core",
      title: "SOROBAN SMART CONTRACT CORE",
      badge: "RUST WASM",
      description:
        "WASM-compiled immutable contract deployed on Stellar Testnet (CCJW2RLIN4MQQ4DAJMMR3F5QPDA6QYTKXJMEVI3XOTDBTBCLBB553J74). Decentralized state & trustless escrow.",
      image: "/assets/card-soroban-core.svg",
      linkText: "view on stellar.expert →",
      href: "https://stellar.expert/explorer/testnet/contract/CCJW2RLIN4MQQ4DAJMMR3F5QPDA6QYTKXJMEVI3XOTDBTBCLBB553J74",
    },
    {
      id: "flow-velocity",
      title: "REAL-TIME FLOW VELOCITY",
      badge: "SUB-SECOND LIQUIDITY",
      description:
        "High-precision micro-payment streaming with real-time flow velocity tracking, instant cancellation, and automatic refund of unvested capital.",
      image: "/assets/card-flow-velocity.svg",
      linkText: "inspect live streams →",
      onAction: onOpenStreams,
    },
    {
      id: "bulk-payroll",
      title: "ENTERPRISE BULK PAYROLL",
      badge: "BATCH DISPATCH",
      description:
        "Multi-recipient CSV batch import allowing DAOs and organizations to stream payroll to dozens of contributors in a single atomic transaction.",
      image: "/assets/card-bulk-payroll.svg",
      linkText: "create payroll batch →",
      onAction: onOpenCreate,
    },
    {
      id: "sac-bridge",
      title: "SEP-41 SAC TOKEN BRIDGE",
      badge: "STELLAR INTEROP",
      description:
        "Native bridge linking classic Stellar trustline assets (USDC, XLM) directly into Soroban smart contract escrow without wrapped token friction.",
      image: "/assets/card-sac-bridge.svg",
      linkText: "verify contract bindings →",
      href: "https://github.com/Steller-escaprt/stellarflow#stellar-asset-contract-sac-bridge",
    },
    {
      id: "claim-vault",
      title: "INSTANT RECIPIENT CLAIM VAULT",
      badge: "1-CLICK WITHDRAW",
      description:
        "Recipients can withdraw vested funds in real time at any second without waiting for calendar payment dates, with near-zero gas costs.",
      image: "/assets/card-claim-portal.svg",
      linkText: "open streams vault →",
      onAction: onOpenStreams,
    },
    {
      id: "event-indexer",
      title: "REACTIVE EVENT INDEXER & WS",
      badge: "RPC & INDEXER",
      description:
        "High-throughput ledger cursor pagination with real-time WebSocket pulses for instantaneous client synchronization across ledgers.",
      image: "/assets/card-event-indexer.svg",
      linkText: "view indexer docs →",
      href: "https://github.com/Steller-escaprt/stellarflow#architecture",
    },
  ];

  return (
    <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-180px)]">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border_ui_b pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-gray-900 dark:text-white">
            /protocol — WHAT WE STAND FOR
          </h2>
          <p className="text-xs sm:text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">
            Autonomous streaming liquidity, continuous vesting, and sub-cent payments on Stellar Soroban.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCreate}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm"
          >
            + New Stream
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pillars.map((pillar) => (
          <div
            key={pillar.id}
            className="border_ui rounded-xl overflow-hidden bg-white/70 dark:bg-[#13151D]/90 hover:shadow-lg transition-all duration-200 flex flex-col group"
          >
            {/* Visual Picture Banner */}
            <div className="aspect-[16/9] w-full overflow-hidden bg-slate-900 relative border_ui_b">
              <img
                src={pillar.image}
                alt={pillar.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute top-2.5 right-2.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-black/75 text-purple-300 border border-purple-500/30 backdrop-blur-sm">
                  {pillar.badge}
                </span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 flex flex-col flex-1 justify-between">
              <div>
                <h3 className="font-mono font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-xs font-sans text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                {pillar.href ? (
                  <a
                    href={pillar.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                  >
                    {pillar.linkText}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={pillar.onAction}
                    className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {pillar.linkText}
                  </button>
                )}
                <span className="text-[10px] font-mono text-gray-400">stellarflow://pillar</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
