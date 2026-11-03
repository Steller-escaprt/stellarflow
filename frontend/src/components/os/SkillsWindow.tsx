import { useState } from "react";

interface SkillCategory {
  id: string;
  name: string;
  skills: string[];
}

export function SkillsWindow() {
  const [filter, setFilter] = useState("all");

  const categories: SkillCategory[] = [
    {
      id: "contracts",
      name: "smart contracts & wasm",
      skills: [
        "Rust",
        "Soroban SDK 22",
        "WASM Optimization",
        "SEP-41 Token Standard",
        "Stellar Asset Contract (SAC)",
        "Instance Storage & TTL",
      ],
    },
    {
      id: "stellar",
      name: "stellar protocols & rpc",
      skills: [
        "Stellar RPC Gateway",
        "Horizon REST API",
        "Freighter Wallet SDK",
        "SEP-10 Web Authentication",
        "Ledger Cursor Pagination",
        "Simulation & Footprint Gas",
      ],
    },
    {
      id: "frontend",
      name: "frontend architecture",
      skills: [
        "React 18",
        "TypeScript 5",
        "Tailwind CSS",
        "Recharts Visualization",
        "TanStack Virtual",
        "Adaptive WebSocket Client",
      ],
    },
    {
      id: "tooling",
      name: "dev tooling & verification",
      skills: [
        "Vite 8",
        "Vitest (272 Tests)",
        "Playwright E2E",
        "ESLint & TypeScript Strict",
        "GitHub Actions CI/CD",
        "Vercel Edge Platform",
      ],
    },
  ];

  const visibleCategories =
    filter === "all"
      ? categories
      : categories.filter((c) => c.id === filter);

  const totalSkills = categories.reduce((sum, c) => sum + c.skills.length, 0);

  return (
    <div className="space-y-4 font-mono text-xs max-w-xl mx-auto py-2">
      <div className="border_ui_b pb-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          ARCHITECTURE &amp; PROTOCOL CAPABILITIES
        </h3>
        <p className="text-[11px] text-gray-500 font-sans mt-0.5">
          Engineering stack, Soroban primitives, and distributed ledger components powering StellarFlow.
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
            filter === "all"
              ? "bg-purple-600 text-white"
              : "border border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
          }`}
        >
          all
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
              filter === c.id
                ? "bg-purple-600 text-white"
                : "border border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Skill List */}
      <div className="space-y-4 pt-2">
        {visibleCategories.map((c) => (
          <div key={c.id} className="space-y-2">
            <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
              // {c.name}
            </div>
            <div className="flex flex-wrap gap-2">
              {c.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-md border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-gray-800 dark:text-gray-200 hover:border-purple-500/50 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer stats */}
      <div className="pt-4 border_ui_t text-[11px] text-gray-400">
        <strong className="text-purple-600 dark:text-purple-400">{totalSkills}</strong> capabilities ·{" "}
        <strong className="text-gray-700 dark:text-gray-300">{categories.length}</strong> core subsystems
      </div>
    </div>
  );
}
