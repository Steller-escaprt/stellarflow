import { useState, useEffect } from "react";

export function PlaygroundWindow({ walletAddress }: { walletAddress: string | null }) {
  const [activeTab, setActiveTab] = useState<"speedometer" | "vesting" | "gas" | "faucet">("speedometer");

  // Speedometer state
  const [amount, setAmount] = useState(10000);
  const [durationDays, setDurationDays] = useState(30);
  const [liveCounter, setLiveCounter] = useState(0);

  // Faucet state
  const [faucetAddress, setFaucetAddress] = useState(walletAddress || "");
  const [faucetStatus, setFaucetStatus] = useState<string | null>(null);

  // Sync wallet address to faucet
  useEffect(() => {
    if (walletAddress && !faucetAddress) {
      setFaucetAddress(walletAddress);
    }
  }, [walletAddress, faucetAddress]);

  const durationSeconds = durationDays * 86400;
  const ratePerSecond = amount / durationSeconds;
  const ratePerMinute = ratePerSecond * 60;
  const ratePerHour = ratePerMinute * 60;
  const ratePerDay = ratePerHour * 24;

  // Live ticking counter
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveCounter((c) => c + ratePerSecond * 0.1);
    }, 100);
    return () => clearInterval(timer);
  }, [ratePerSecond]);

  const handleRequestFaucet = async () => {
    if (!faucetAddress) return;
    setFaucetStatus("Requesting 10,000 Testnet XLM from SDF Friendbot...");
    try {
      const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(faucetAddress)}`);
      if (res.ok) {
        setFaucetStatus("✓ Successfully funded 10,000 XLM on Stellar Testnet!");
      } else {
        const text = await res.text();
        setFaucetStatus(`Response: ${text.slice(0, 100)}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setFaucetStatus(`Error: ${msg}`);
    }
  };

  return (
    <div className="space-y-5 font-mono text-xs max-w-2xl mx-auto py-1">
      {/* Header */}
      <div className="border_ui_b pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span>🎮</span>
            <span>STREAMING PLAYGROUND &amp; LABS</span>
          </h3>
          <p className="text-[11px] text-gray-500 font-sans mt-0.5">
            Interactive simulators for micro-payment flow rates, cliff locks, gas benchmarks, and faucets.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { id: "speedometer", label: "⚡ Flow Meter" },
          { id: "vesting", label: "⏱️ Cliff Curve" },
          { id: "gas", label: "⛽ Gas Benchmark" },
          { id: "faucet", label: "💧 Testnet Faucet" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`py-2 px-3 rounded-lg border text-center font-bold transition-all ${
              activeTab === tab.id
                ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: FLOW SPEEDOMETER ── */}
      {activeTab === "speedometer" && (
        <div className="border_ui rounded-xl p-4 bg-white/70 dark:bg-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 uppercase tracking-wider font-bold text-[10px]">
              REAL-TIME FLOW VELOCITY
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              ● SUB-SECOND EMISSION
            </span>
          </div>

          {/* Live Ticking Amount */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 text-center space-y-1">
            <span className="text-[11px] text-gray-400 uppercase tracking-widest">
              Simulated Streamed Tokens
            </span>
            <div className="text-2xl sm:text-4xl font-black text-purple-600 dark:text-purple-400 font-mono tracking-tight">
              +{liveCounter.toFixed(6)} <span className="text-sm font-normal text-gray-500">USDC</span>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-3 font-sans">
            <div>
              <div className="flex justify-between text-xs font-mono text-gray-700 dark:text-gray-300 mb-1">
                <span>Total Stream Amount:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{amount.toLocaleString()} USDC</span>
              </div>
              <input
                type="range"
                min="100"
                max="100000"
                step="100"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-gray-700 dark:text-gray-300 mb-1">
                <span>Stream Duration:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{durationDays} Days</span>
              </div>
              <input
                type="range"
                min="1"
                max="365"
                step="1"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>
          </div>

          {/* Emission Rates Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center">
            <div className="p-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-black/5 dark:bg-white/5">
              <span className="block text-[10px] text-gray-400 uppercase">Per Second</span>
              <span className="font-bold text-xs text-gray-900 dark:text-white">
                {ratePerSecond.toFixed(5)}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-black/5 dark:bg-white/5">
              <span className="block text-[10px] text-gray-400 uppercase">Per Minute</span>
              <span className="font-bold text-xs text-gray-900 dark:text-white">
                {ratePerMinute.toFixed(4)}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-black/5 dark:bg-white/5">
              <span className="block text-[10px] text-gray-400 uppercase">Per Hour</span>
              <span className="font-bold text-xs text-gray-900 dark:text-white">
                {ratePerHour.toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-black/5 dark:bg-white/5">
              <span className="block text-[10px] text-gray-400 uppercase">Per Day</span>
              <span className="font-bold text-xs text-gray-900 dark:text-white">
                {ratePerDay.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: CLIFF VESTING SIMULATOR ── */}
      {activeTab === "vesting" && (
        <div className="border_ui rounded-xl p-4 bg-white/70 dark:bg-white/5 space-y-4">
          <span className="text-gray-500 uppercase tracking-wider font-bold text-[10px]">
            MATHEMATICAL CLIFF VESTING LOGIC
          </span>
          <p className="text-xs text-gray-600 dark:text-gray-300 font-sans leading-relaxed">
            During the cliff phase ($t &lt; t_0 + \text&#123;cliff&#125;$), vested balance is strictly 0. Once cliff passes, unlocked tokens immediately jump to the prorated amount:
          </p>

          <div className="p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-purple-500/20 font-mono text-[11px] text-purple-600 dark:text-purple-400 space-y-1">
            <p>V(t) = 0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[if t &lt; t₀ + cliff]</p>
            <p>V(t) = Total × (t - t₀) / Duration &nbsp;&nbsp;&nbsp;[if t ≥ t₀ + cliff]</p>
            <p>V(t) = Total &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[if t ≥ t₀ + Duration]</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2">
            <div className="p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-black/5 dark:bg-white/5">
              <span className="block text-[10px] text-gray-400">Lockup Phase</span>
              <span className="font-bold text-xs text-amber-500">0% Unlocked</span>
            </div>
            <div className="p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-black/5 dark:bg-white/5">
              <span className="block text-[10px] text-gray-400">Cliff Release</span>
              <span className="font-bold text-xs text-blue-500">Prorated Jump</span>
            </div>
            <div className="p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-black/5 dark:bg-white/5">
              <span className="block text-[10px] text-gray-400">Post-Cliff</span>
              <span className="font-bold text-xs text-emerald-500">Continuous Stream</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: GAS BENCHMARK ── */}
      {activeTab === "gas" && (
        <div className="border_ui rounded-xl p-4 bg-white/70 dark:bg-white/5 space-y-4">
          <span className="text-gray-500 uppercase tracking-wider font-bold text-[10px]">
            SMART CONTRACT TRANSACTION FEE BENCHMARK
          </span>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-gray-900 dark:text-white">Stellar Soroban (StellarFlow)</span>
              </div>
              <span className="font-bold text-emerald-500 text-sm">$0.00001 / txn</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-white/10 opacity-75">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="font-bold text-gray-700 dark:text-gray-300">Solana Pay</span>
              </div>
              <span className="font-mono text-gray-600 dark:text-gray-400 text-xs">$0.0025 / txn</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-white/10 opacity-60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="font-bold text-gray-700 dark:text-gray-300">Ethereum L1 (Sablier / Superfluid)</span>
              </div>
              <span className="font-mono text-gray-600 dark:text-gray-400 text-xs">$2.45 / txn</span>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 font-sans">
            Stellar Soroban enables high-frequency second-by-second micro-withdrawals without consuming employee earnings in network fees.
          </p>
        </div>
      )}

      {/* ── TAB 4: FAUCET DISPENSER ── */}
      {activeTab === "faucet" && (
        <div className="border_ui rounded-xl p-4 bg-white/70 dark:bg-white/5 space-y-4">
          <span className="text-gray-500 uppercase tracking-wider font-bold text-[10px]">
            STELLAR TESTNET FRIENDBOT DISPENSER
          </span>

          <div className="space-y-3 font-sans">
            <div>
              <label className="block text-xs font-mono font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recipient Public Key (G...)
              </label>
              <input
                type="text"
                value={faucetAddress}
                onChange={(e) => setFaucetAddress(e.target.value)}
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 font-mono text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <button
              type="button"
              onClick={handleRequestFaucet}
              className="py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs font-bold uppercase transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>💧</span>
              <span>Dispense 10,000 Testnet XLM</span>
            </button>

            {faucetStatus && (
              <p className="text-xs font-mono p-2.5 rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-300">
                {faucetStatus}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

