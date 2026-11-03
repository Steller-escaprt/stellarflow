import React, { useState, useRef, useEffect } from "react";

interface TerminalWindowProps {
  walletAddress: string | null;
  onOpenCreate: () => void;
  onOpenStreams: () => void;
}

interface CommandOutput {
  id: string;
  command: string;
  lines: string[];
}

export function TerminalWindow({
  walletAddress,
  onOpenCreate,
  onOpenStreams,
}: TerminalWindowProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<CommandOutput[]>([
    {
      id: "init-1",
      command: "whoami",
      lines: [
        "StellarFlow Protocol v1.0.0 (Soroban Testnet)",
        walletAddress
          ? `Connected Wallet: ${walletAddress}`
          : "Session: Anonymous Navigator (use 'connect' or top-bar to link Freighter)",
      ],
    },
    {
      id: "init-2",
      command: "cat about.txt",
      lines: [
        "> Continuous second-by-second payment streaming & linear token vesting on Stellar.",
        "> Built on Soroban smart contracts with sub-second finality and sub-cent fees.",
        "> Type 'help' to inspect available CLI commands.",
      ],
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const parts = trimmed.split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    let outputLines: string[] = [];

    switch (cmd) {
      case "help":
        outputLines = [
          "Available StellarFlow Terminal commands:",
          "  help               - Show this list of commands",
          "  whoami             - Display current session & connected wallet address",
          "  contract           - View Soroban smart contract ID and WASM configuration",
          "  streams            - Query active streams summary or open dashboard",
          "  vesting [amt] [dur] - Calculate linear stream unlock velocity and cliff rate",
          "  create             - Launch the interactive Create Stream drawer",
          "  faucet             - Get Stellar Testnet Friendbot funding instructions",
          "  status             - Ping current RPC and network health",
          "  clear              - Clear terminal window history",
        ];
        break;

      case "whoami":
        outputLines = [
          `Session User: ${walletAddress ?? "Anonymous (Freighter disconnected)"}`,
          `Network: Stellar Testnet (Soroban Protocol 22)`,
          `Role: Stream Controller & Escrow Signer`,
        ];
        break;

      case "contract":
        outputLines = [
          "Soroban Smart Contract Configuration:",
          "  Contract ID: CCJW2RLIN4MQQ4DAJMMR3F5QPDA6QYTKXJMEVI3XOTDBTBCLBB553J74",
          "  Target Engine: Soroban WASM (Rust rs-stellar-contract)",
          "  Token Support: SEP-41 SAC (Stellar Asset Contract) + Classic XLM/USDC",
          "  Explorer: https://stellar.expert/explorer/testnet/contract/CCJW2RLIN4MQQ4DAJMMR3F5QPDA6QYTKXJMEVI3XOTDBTBCLBB553J74",
        ];
        break;

      case "streams":
        outputLines = [
          "Querying active streams...",
          "  ID: #104 | 1,000.00 USDC | Rate: 0.01157 USDC/s | Status: ACTIVE",
          "  ID: #103 | 500.00 XLM    | Rate: 0.05787 XLM/s  | Status: VESTING",
          "Opening streams dashboard...",
        ];
        setTimeout(onOpenStreams, 600);
        break;

      case "vesting": {
        const total = parseFloat(args[0]) || 1000;
        const dur = parseFloat(args[1]) || 86400;
        const perSec = total / dur;
        const perMin = perSec * 60;
        outputLines = [
          `Linear Vesting Calculator:`,
          `  Formula: V(t) = Total × (t - t₀) / Duration`,
          `  Total Amount: ${total.toLocaleString()} tokens`,
          `  Duration: ${dur.toLocaleString()} seconds (${(dur / 3600).toFixed(1)} hours)`,
          `  Flow Velocity: +${perSec.toFixed(6)} tokens/second`,
          `  Minute Rate:   +${perMin.toFixed(4)} tokens/minute`,
        ];
        break;
      }

      case "create":
        outputLines = ["Opening stream creation drawer..."];
        setTimeout(onOpenCreate, 300);
        break;

      case "faucet":
        outputLines = [
          "Stellar Testnet Friendbot:",
          "  To fund an account with 10,000 testnet XLM, visit:",
          "  https://laboratory.stellar.org/#account-creator?network=test",
        ];
        break;

      case "status":
        outputLines = [
          "StellarFlow Protocol Status: HEALTHY",
          "  RPC Endpoint: https://soroban-testnet.stellar.org",
          "  Indexer: 0ms latency, cursor synced",
          "  Vesting Engine: Online, zero paused contracts",
        ];
        break;

      case "clear":
        setHistory([]);
        setInput("");
        return;

      default:
        outputLines = [
          `bash: command not found: ${cmd}`,
          "Type 'help' to see the list of supported commands.",
        ];
    }

    setHistory((prev) => [
      ...prev,
      {
        id: `cmd-${Date.now()}`,
        command: trimmed,
        lines: outputLines,
      },
    ]);
    setInput("");
  };

  return (
    <div
      className="p-4 font-mono text-xs sm:text-sm bg-[#0C0D12] text-gray-200 h-[calc(100vh-220px)] overflow-y-auto flex flex-col justify-between"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="space-y-4">
        <div className="text-gray-500 text-xs pb-2 border-b border-white/10">
          StellarFlow OS Terminal emulator [Version 1.0.0-stellar.testnet]
          <br />
          (c) 2026 StellarFlow Protocol. All rights reserved.
        </div>

        {history.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center gap-2 text-purple-400">
              <span className="text-emerald-400">stellarflow@testnet:~$</span>
              <span className="text-gray-100 font-semibold">{item.command}</span>
            </div>
            {item.lines.map((line, idx) => (
              <div
                key={idx}
                className={`pl-4 ${
                  line.startsWith(">")
                    ? "text-gray-400 italic"
                    : line.includes("Available") || line.includes("Formula")
                      ? "text-amber-400"
                      : "text-gray-300"
                }`}
              >
                {line}
              </div>
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
        <span className="text-emerald-400 shrink-0">stellarflow@testnet:~$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="type 'help' or command like 'streams', 'contract'..."
          className="flex-1 bg-transparent text-white focus:outline-none placeholder-gray-600 font-mono text-xs sm:text-sm"
          autoFocus
        />
        <span className="cursor-blink text-purple-400 font-bold">_</span>
      </form>
    </div>
  );
}

