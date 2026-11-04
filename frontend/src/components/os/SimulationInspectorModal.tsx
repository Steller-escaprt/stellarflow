import React, { useState } from 'react';
import {
  simulateStreamFootprint,
  type SorobanResourceFootprint,
  type SimulationOperation,
} from '../../services/simulation';
import {
  simulateFeeBumpEnvelope,
  PROTOCOL_RELAYER_ADDRESS,
} from '../../services/feeBump';

interface SimulationInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulationInspectorModal: React.FC<SimulationInspectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedOp, setSelectedOp] = useState<
    'create_stream' | 'claim' | 'cancel_stream' | 'batch_create'
  >('create_stream');
  const [copied, setCopied] = useState(false);
  const [feeBumpEnabled, setFeeBumpEnabled] = useState(false);

  if (!isOpen) return null;

  const footprint: SorobanResourceFootprint = simulateStreamFootprint(selectedOp);
  const feeBump = simulateFeeBumpEnvelope(footprint.rawXdr);

  const cpuPct = ((footprint.cpuInstructions / footprint.maxCpuInstructions) * 100).toFixed(2);
  const memPct = ((footprint.memoryBytes / footprint.maxMemoryBytes) * 100).toFixed(2);

  const handleCopyXdr = () => {
    const xdrToCopy = feeBumpEnabled ? feeBump.feeBumpXdr : footprint.rawXdr;
    navigator.clipboard.writeText(xdrToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f141c] border border-cyan-500/30 rounded-lg shadow-2xl max-w-2xl w-full text-slate-200 overflow-hidden font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/80 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold text-sm">⚡ SOROBAN RESOURCE METER & XDR BRIDGE</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              PROTOCOL 22
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          {/* Operation Selector */}
          <div>
            <label className="text-slate-400 text-[11px] block mb-2">TARGET SMART CONTRACT OPERATION:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'create_stream' as SimulationOperation, label: 'create_stream' },
                { id: 'claim' as SimulationOperation, label: 'claim' },
                { id: 'cancel_stream' as SimulationOperation, label: 'cancel_stream' },
                { id: 'batch_create' as SimulationOperation, label: 'batch_create' },
              ].map((op) => (
                <button
                  key={op.id}
                  onClick={() => setSelectedOp(op.id)}
                  className={`py-1.5 px-2 rounded border text-center transition-all ${
                    selectedOp === op.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metering Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* CPU Instructions */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-400">CPU Instructions:</span>
                <span className="text-cyan-300 font-bold">{footprint.cpuInstructions.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-1">
                <div
                  className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(Number(cpuPct), 2)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>{cpuPct}% of 100M limit</span>
                <span>Max: 100,000,000</span>
              </div>
            </div>

            {/* Memory Bytes */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-400">Memory Allocation:</span>
                <span className="text-emerald-300 font-bold">
                  {(footprint.memoryBytes / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-1">
                <div
                  className="bg-emerald-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(Number(memPct), 2)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>{memPct}% of 40MB limit</span>
                <span>Max: 41.9 MB</span>
              </div>
            </div>
          </div>

          {/* Resource Fee Breakdown */}
          <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded flex items-center justify-between text-[11px]">
            <div>
              <span className="text-slate-400">Estimated Resource Fee: </span>
              <span className="text-amber-400 font-bold">{footprint.resourceFeeStroops} Stroops</span>
              <span className="text-slate-500"> ({footprint.minResourceFeeXLM} XLM)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              SUB-CENT FINALITY
            </span>
          </div>

          {/* CAP-15 Fee Bump Toggle */}
          <div className="p-3 bg-indigo-950/20 border border-indigo-500/30 rounded space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="feeBumpToggle"
                  checked={feeBumpEnabled}
                  onChange={(e) => setFeeBumpEnabled(e.target.checked)}
                  className="rounded border-indigo-500 text-indigo-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="feeBumpToggle" className="text-indigo-300 font-bold cursor-pointer">
                  Enable CAP-15 Gasless Fee-Bump Sponsorship
                </label>
              </div>
              <span className="text-[10px] text-indigo-400">Worker pays 0 XLM</span>
            </div>
            {feeBumpEnabled && (
              <div className="text-[11px] text-slate-400 pl-5 border-l-2 border-indigo-500/50 space-y-1">
                <div>
                  <span className="text-slate-500">Sponsor Account: </span>
                  <span className="text-indigo-200">{PROTOCOL_RELAYER_ADDRESS}</span>
                </div>
                <div>
                  <span className="text-slate-500">Sponsorship Fee: </span>
                  <span className="text-emerald-400 font-bold">{feeBump.maxFeeStroops} Stroops paid by Relayer</span>
                </div>
              </div>
            )}
          </div>

          {/* Raw XDR & Laboratory Bridge */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-400 text-[11px]">RAW STELLAR TRANSACTION ENVELOPE (XDR):</span>
              <button
                onClick={handleCopyXdr}
                className="text-cyan-400 hover:text-cyan-300 transition-colors text-[10px] flex items-center gap-1"
              >
                {copied ? '✓ COPIED!' : '📋 COPY XDR'}
              </button>
            </div>
            <div className="p-2.5 bg-black/60 border border-slate-800 rounded font-mono text-[10px] text-slate-400 break-all select-all">
              {feeBumpEnabled ? feeBump.feeBumpXdr : footprint.rawXdr}
            </div>
          </div>

          {/* Laboratory Action */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-slate-500 text-[11px]">Inspect decoded transaction on Stellar Laboratory:</span>
            <a
              href={feeBumpEnabled ? feeBump.laboratoryUrl : footprint.laboratoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center gap-1"
            >
              Open in Stellar Laboratory ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

