import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Copy,
  Check,
  Trash2,
  Filter,
  Layers,
  Clock,
  Sparkles
} from 'lucide-react';
import type { SignalRecord, Pair, SignalDirection } from '../types';

interface SignalsPageProps {
  signals: SignalRecord[];
  onClearSignals: () => void;
  onDeleteSignal: (id: string) => void;
  onSimulate: (scenario: 'BUY' | 'SELL' | 'WAIT', pair: Pair) => void;
}

export const SignalsPage: React.FC<SignalsPageProps> = ({
  signals,
  onClearSignals,
  onDeleteSignal,
  onSimulate,
}) => {
  const [selectedPair, setSelectedPair] = useState<string>('ALL');
  const [selectedDir, setSelectedDir] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSignals = signals.filter((s) => {
    if (selectedPair !== 'ALL' && s.pair !== selectedPair) return false;
    if (selectedDir !== 'ALL' && s.direction !== selectedDir) return false;
    return true;
  });

  const copySignalText = (sig: SignalRecord) => {
    const text = `🔔 AREWA CRITICS SIGNAL - NUMBER READER BOT
PAIR: ${sig.pair}
ACTION: ${sig.direction}
ENTRY ZONE: ${sig.entry_zone}
STOP LOSS: ${sig.sl}
TAKE PROFIT 1: ${sig.tp1}
TAKE PROFIT 2: ${sig.tp2}
LOT SIZE: 0.01 LOT ONLY
RISK: 1% ONLY
EMA34: ${sig.ema34} | EMA55: ${sig.ema55}
REASON: ${sig.reason}
TIME: ${sig.timestamp}
⚠️ For Education Only, Not Financial Advice.`;

    navigator.clipboard.writeText(text);
    setCopiedId(sig.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const buyCount = signals.filter((s) => s.direction === 'BUY').length;
  const sellCount = signals.filter((s) => s.direction === 'SELL').length;

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Signal History & Journal</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real signals captured and saved to database during active market sessions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Total:</span>
            <span className="text-white font-bold">{signals.length}</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 font-bold">{buyCount} BUY</span>
            <span className="text-slate-600">·</span>
            <span className="text-rose-400 font-bold">{sellCount} SELL</span>
          </div>

          {signals.length > 0 && (
            <button
              onClick={onClearSignals}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">Filter by:</span>

          {/* Pair Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-md border border-slate-800">
            {['ALL', 'XAUUSD', 'EURUSD', 'BTCUSD'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPair(p)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  selectedPair === p
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Direction Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-md border border-slate-800 ml-2">
            {['ALL', 'BUY', 'SELL'].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDir(d)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  selectedDir === d
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Showing {filteredSignals.length} of {signals.length} signals
        </span>
      </div>

      {/* Signals List */}
      {filteredSignals.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No signals recorded yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              When London or New York sessions are active and a key zone rejection confirms with EMA34 &gt; EMA55 (BUY)
              or EMA34 &lt; EMA55 (SELL), signals are automatically recorded here.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => onSimulate('BUY', 'XAUUSD')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Test BUY Signal</span>
            </button>
            <button
              onClick={() => onSimulate('SELL', 'EURUSD')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Test SELL Signal</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSignals.map((sig) => {
            const isBuy = sig.direction === 'BUY';
            const isCopied = copiedId === sig.id;

            return (
              <div
                key={sig.id}
                className={`border rounded-xl p-5 bg-slate-900/90 transition-all ${
                  isBuy
                    ? 'border-emerald-500/50 hover:border-emerald-500'
                    : 'border-rose-500/50 hover:border-rose-500'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-black uppercase flex items-center gap-1.5 ${
                        isBuy ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {isBuy ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{sig.direction}</span>
                    </span>
                    <div>
                      <span className="text-base font-bold text-white tracking-wide">{sig.pair}</span>
                      <span className="text-xs text-slate-400 block font-mono">
                        {sig.session || 'Session Signal'} · {new Date(sig.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copySignalText(sig)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => onDeleteSignal(sig.id)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-colors"
                      title="Delete signal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Parameters Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-xs font-mono">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Entry Zone</span>
                    <span className="font-bold text-white tabular-nums">{sig.entry_zone}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-rose-400 uppercase font-sans font-semibold block">Stop Loss (SL)</span>
                    <span className="font-bold text-rose-300 tabular-nums">{sig.sl}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-emerald-400 uppercase font-sans font-semibold block">Take Profit 1</span>
                    <span className="font-bold text-emerald-300 tabular-nums">{sig.tp1}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-emerald-400 uppercase font-sans font-semibold block">Take Profit 2</span>
                    <span className="font-bold text-emerald-300 tabular-nums">{sig.tp2}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Lot & Risk</span>
                    <span className="font-bold text-slate-200 tabular-nums">0.01 Lot · 1%</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-300 font-medium">Reason:</span>
                    <span>{sig.reason}</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 shrink-0">
                    EMA34: {sig.ema34} · EMA55: {sig.ema55}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
