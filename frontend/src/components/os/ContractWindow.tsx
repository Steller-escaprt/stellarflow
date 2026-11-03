import { CopyableAddress } from "../CopyableAddress";

export function ContractWindow() {
  const CONTRACT_ID = "CCJW2RLIN4MQQ4DAJMMR3F5QPDA6QYTKXJMEVI3XOTDBTBCLBB553J74";

  return (
    <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-180px)] font-mono text-xs sm:text-sm">
      <div className="mb-6 border_ui_b pb-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          /contract — SOROBAN SMART CONTRACT SPEC
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-sans">
          Immutable Soroban WASM contract orchestrating decentralized streaming escrow on Stellar.
        </p>
      </div>

      <div className="space-y-6">
        {/* Contract Identifier Card */}
        <div className="border_ui rounded-xl p-4 bg-white/70 dark:bg-[#13151D]/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Deployed Contract Address</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              ● VERIFIED ON TESTNET
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/10">
            <div className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400">
              <CopyableAddress address={CONTRACT_ID} />
            </div>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0"
            >
              stellar.expert explorer ↗
            </a>
          </div>
        </div>

        {/* Technical Specification Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border_ui rounded-xl p-4 bg-white/70 dark:bg-[#13151D]/90 space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">
              Soroban Environment
            </h4>
            <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 font-sans">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5">
                <span className="font-mono text-gray-400">Network:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">Stellar Testnet (Proto 22)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5">
                <span className="font-mono text-gray-400">RPC Endpoint:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">soroban-testnet.stellar.org:443</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5">
                <span className="font-mono text-gray-400">Ledger Close:</span>
                <span className="font-semibold text-emerald-500">~5.0 seconds</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-mono text-gray-400">Contract Runtime:</span>
                <span className="font-semibold text-purple-500">Rust / WASM (soroban-sdk 22)</span>
              </div>
            </div>
          </div>

          <div className="border_ui rounded-xl p-4 bg-white/70 dark:bg-[#13151D]/90 space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">
              Token Interoperability
            </h4>
            <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 font-sans">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5">
                <span className="font-mono text-gray-400">Interface Standard:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">SEP-41 Soroban Token</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5">
                <span className="font-mono text-gray-400">Bridge Protocol:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">Stellar Asset Contract (SAC)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5">
                <span className="font-mono text-gray-400">Supported Assets:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">XLM, USDC, Custom Assets</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-mono text-gray-400">Escrow Security:</span>
                <span className="font-semibold text-emerald-500">Non-Custodial Instance Storage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Linear Vesting Math */}
        <div className="border_ui rounded-xl p-4 bg-white/70 dark:bg-[#13151D]/90 space-y-3">
          <h4 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">
            Mathematical Continuous Vesting Proof
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-sans leading-relaxed">
            The Soroban contract deterministically computes unlocked capital using integer arithmetic with zero floating-point loss:
          </p>
          <pre className="p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/10 text-xs overflow-x-auto text-purple-600 dark:text-purple-300">
{`fn compute_vested_amount(total: i128, start_at: u64, duration: u64, cliff: u64, now: u64) -> i128 {
    if now < start_at + cliff {
        return 0;
    }
    if now >= start_at + duration {
        return total;
    }
    let elapsed = (now - start_at) as i128;
    (total * elapsed) / (duration as i128)
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
