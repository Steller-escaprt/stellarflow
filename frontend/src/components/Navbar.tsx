import { DarkModeToggle } from "./DarkModeToggle";
import { WalletButton } from "./WalletButton";
import type { FreighterState } from "../hooks/useFreighter";
import type { Theme } from "../hooks/useTheme";

export interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenCreate: () => void;
  wallet: FreighterState;
  theme: Theme;
  onToggleTheme: () => void;
}

export function Navbar({
  currentTab,
  onTabChange,
  onOpenCreate,
  wallet,
  theme,
  onToggleTheme,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/75 dark:bg-[#0B0D17]/80 border-b border-gray-200/80 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Network */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onTabChange("dashboard")}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3E1BDB] via-[#7B61FF] to-[#00E5FF] p-0.5 shadow-lg shadow-purple-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0B0D17] rounded-[10px] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                  <path d="M12 12v9" />
                  <path d="m8 17 4 4 4-4" />
                </svg>
              </div>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:via-purple-200 dark:to-[#00E5FF] bg-clip-text text-transparent">
                StellarFlow
              </span>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Testnet
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center p-1 rounded-xl bg-gray-100/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 text-sm font-medium">
          <button
            type="button"
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              currentTab === "dashboard"
                ? "bg-white dark:bg-[#7B61FF] text-gray-900 dark:text-white shadow-sm font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
            onClick={() => onTabChange("dashboard")}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              currentTab === "sender"
                ? "bg-white dark:bg-[#7B61FF] text-gray-900 dark:text-white shadow-sm font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
            onClick={() => onTabChange("sender")}
          >
            Sender
          </button>
          <button
            type="button"
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              currentTab === "recipient"
                ? "bg-white dark:bg-[#7B61FF] text-gray-900 dark:text-white shadow-sm font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
            onClick={() => onTabChange("recipient")}
          >
            Recipient
          </button>
        </nav>

        {/* Actions & Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenCreate}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-[#3E1BDB] to-[#7B61FF] hover:from-[#4b23ff] hover:to-[#8c75ff] shadow-md shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>+ New Stream</span>
          </button>

          <DarkModeToggle theme={theme} onToggle={onToggleTheme} />

          <WalletButton wallet={wallet} />
        </div>
      </div>
    </header>
  );
}

