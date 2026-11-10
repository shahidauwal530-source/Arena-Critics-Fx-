import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldAlert,
  Target,
  Copy,
  Check,
  Zap,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CircleDot
} from 'lucide-react';
import type {
  Pair,
  PairQuote,
  SignalCheckResponse,
  SessionInfo,
  KeyZone
} from '../types';

interface DashboardProps {
  quotes: Record<Pair, PairQuote> | null;
  latestSignal: SignalCheckResponse | null;
  session: SessionInfo | null;
  countdown: number;
  onCheckSignals: (force?: boolean) => void;
  isChecking: boolean;
  zones: KeyZone[];
  onSimulate: (scenario: 'BUY' | 'SELL' | 'WAIT', pair: Pair) => void;
  onNavigateToTab: (tab: 'dashboard' | 'signals' | 'zones' | 'settings') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  quotes,
  latestSignal,
  session,
  countdown,
  onCheckSignals,
  isChecking,
  zones,
  onSimulate,
  onNavigateToTab,
}) => {
  const [copied, setCopied] = React.useState(false);

  const formatPrice = (val: number, pair: Pair) => {
    if (val === undefined || isNaN(val)) return '---';
    if (pair === 'EURUSD') return val.toFixed(5);
    if (pair === 'BTCUSD') return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return val.toFixed(2);
  };

  const copySignalText = () => {
    if (!latestSignal || latestSignal.direction === 'WAIT') return;
    const text = `🔔 AREWA CRITICS SIGNAL - NUMBER READER BOT
PAIR: ${latestSignal.pair}
ACTION: ${latestSignal.direction}
ENTRY ZONE: ${latestSignal.entry_zone}
STOP LOSS: ${latestSignal.sl}
TAKE PROFIT 1: ${latestSignal.tp1}
TAKE PROFIT 2: ${latestSignal.tp2}
LOT SIZE: 0.01 LOT ONLY
RISK: 1% ONLY
EMA34: ${latestSignal.ema34} | EMA55: ${latestSignal.ema55}
REASON: ${latestSignal.reason}
TIME: ${session?.timeWAT || new Date().toLocaleTimeString()}
⚠️ For Education Only, Not Financial Advice.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick helper to get zones for a pair
  const getPairZonesSummary = (pair: Pair) => {
    const pZones = zones.filter((z) => z.pair === pair);
    const supports = pZones.filter((z) => z.type === 'Support');
    const resistances = pZones.filter((z) => z.type === 'Resistance');
    return { supports, resistances };
  };

  return (
    <div className="space-y-6">
      {/* 1. SESSION & SYSTEM BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Africa/Lagos Time</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-300 font-semibold tabular-nums">
                {session?.timeWAT || 'Calculating...'}
              </span>
              {session?.isOverride && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400 font-medium">Session Forced Active (Testing)</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`text-lg sm:text-xl font-bold tracking-tight ${
                  session?.isOpen ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {session?.isOpen ? session.sessionName : 'WAIT - Market Closed'}
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              Trading bot operates automatically during{' '}
              <span className="text-slate-300 font-medium">London Session (08:00 - 12:00 WAT)</span> and{' '}
              <span className="text-slate-300 font-medium">New York Session (13:00 - 17:00 WAT)</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
            <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">
                Auto-Check Timer
              </span>
              <div className="flex items-center gap-1.5 font-mono text-slate-200 font-semibold tabular-nums">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Next in {countdown}s</span>
              </div>
            </div>

            <button
              onClick={() => onCheckSignals(false)}
              disabled={isChecking}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isChecking ? 'Checking Numbers...' : 'Check Signals'}</span>
            </button>
          </div>
        </div>

        {/* London vs NY Session Indicators */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800/80">
          <div
            className={`p-2.5 rounded-lg border text-xs ${
              session?.status === 'LONDON'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">London Session</span>
              <span className="font-mono text-[11px]">08:00 - 12:00 WAT</span>
            </div>
            <div className="text-[11px] mt-0.5 opacity-80">
              {session?.status === 'LONDON' ? 'Active Now' : 'Closed'}
            </div>
          </div>

          <div
            className={`p-2.5 rounded-lg border text-xs ${
              session?.status === 'NEW_YORK'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">New York Session</span>
              <span className="font-mono text-[11px]">13:00 - 17:00 WAT</span>
            </div>
            <div className="text-[11px] mt-0.5 opacity-80">
              {session?.status === 'NEW_YORK' ? 'Active Now' : 'Closed'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. THREE PAIR LIVE CARDS (XAUUSD, EURUSD, BTCUSD) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold tracking-tight text-slate-300 uppercase">
            Live Market Quotes · TwelveData Number Reader
          </h2>
          <span className="text-xs text-slate-500">Pairs checked in priority order: XAUUSD &gt; EURUSD &gt; BTCUSD</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['XAUUSD', 'EURUSD', 'BTCUSD'] as Pair[]).map((pair) => {
            const quote = quotes ? quotes[pair] : null;
            const analysis = latestSignal?.detailedAnalysis?.find((a) => a.pair === pair);
            const { supports, resistances } = getPairZonesSummary(pair);
            const isUp = (quote?.change24h || 0) >= 0;

            return (
              <div
                key={pair}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-wide">{pair}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {pair === 'XAUUSD' ? 'Gold Spot' : pair === 'EURUSD' ? 'Euro / USD' : 'Bitcoin'}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-mono font-medium ${
                      isUp ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span className="tabular-nums">
                      {isUp ? '+' : ''}
                      {quote?.changePercent24h ? quote.changePercent24h.toFixed(2) : '0.00'}%
                    </span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white tabular-nums">
                    {quote ? formatPrice(quote.price, pair) : '---'}
                  </span>
                </div>

                {/* Indicators & Range */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">EMA 34 (M15)</span>
                    <span className="font-mono text-slate-200 tabular-nums font-medium">
                      {analysis ? formatPrice(analysis.ema34, pair) : '---'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">EMA 55 (M15)</span>
                    <span className="font-mono text-slate-200 tabular-nums font-medium">
                      {analysis ? formatPrice(analysis.ema55, pair) : '---'}
                    </span>
                  </div>
                </div>

                {/* Key Zones Quick View */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 space-y-1 text-[11px]">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-emerald-400/90 font-medium">Key Support:</span>
                    <span className="font-mono tabular-nums text-slate-300">
                      {supports.length > 0 ? `${supports[0].zone_low} - ${supports[0].zone_high}` : 'None defined'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-rose-400/90 font-medium">Key Resistance:</span>
                    <span className="font-mono tabular-nums text-slate-300">
                      {resistances.length > 0 ? `${resistances[0].zone_low} - ${resistances[0].zone_high}` : 'None defined'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. LATEST SIGNAL CARD OR WAIT CARD */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold tracking-tight text-slate-300 uppercase">
            Signal Engine Status & Direction
          </h2>
          <span className="text-xs text-slate-500 font-mono">Risk: 0.01 Lot ONLY · 1% Risk ONLY</span>
        </div>

        {latestSignal?.direction === 'BUY' && (
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-500 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-800/50">
              <div className="flex items-center gap-3">
                <div className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-sm tracking-wider uppercase flex items-center gap-1.5 shadow-md">
                  <TrendingUp className="w-4 h-4 stroke-[3]" />
                  <span>BUY SIGNAL</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-white tracking-tight">{latestSignal.pair}</span>
                  <span className="text-xs text-emerald-400 block font-medium">
                    Bullish Rejection Confirmed at Support
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copySignalText}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy for Telegram/MT5'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="bg-slate-950/70 p-3 rounded-lg border border-emerald-900/50">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Entry Zone</span>
                <span className="text-base sm:text-lg font-mono font-bold text-emerald-300 tabular-nums">
                  {latestSignal.entry_zone}
                </span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-rose-900/40">
                <span className="text-[10px] text-rose-400 uppercase font-semibold block">Stop Loss (SL)</span>
                <span className="text-base sm:text-lg font-mono font-bold text-rose-300 tabular-nums">
                  {latestSignal.sl}
                </span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-emerald-900/50">
                <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Take Profit 1</span>
                <span className="text-base sm:text-lg font-mono font-bold text-emerald-300 tabular-nums">
                  {latestSignal.tp1}
                </span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-emerald-900/50">
                <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Take Profit 2</span>
                <span className="text-base sm:text-lg font-mono font-bold text-emerald-300 tabular-nums">
                  {latestSignal.tp2}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-semibold">Formula Reason:</span>
                <span>{latestSignal.reason}</span>
              </div>
              <div className="text-slate-400 font-mono text-[11px] shrink-0">
                {latestSignal.session.timeWAT}
              </div>
            </div>
          </div>
        )}

        {latestSignal?.direction === 'SELL' && (
          <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border-2 border-rose-500 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rose-800/50">
              <div className="flex items-center gap-3">
                <div className="px-4 py-1.5 rounded-lg bg-rose-500 text-white font-black text-sm tracking-wider uppercase flex items-center gap-1.5 shadow-md">
                  <TrendingDown className="w-4 h-4 stroke-[3]" />
                  <span>SELL SIGNAL</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-white tracking-tight">{latestSignal.pair}</span>
                  <span className="text-xs text-rose-400 block font-medium">
                    Bearish Rejection Confirmed at Resistance
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copySignalText}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-rose-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy for Telegram/MT5'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="bg-slate-950/70 p-3 rounded-lg border border-rose-900/50">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Entry Zone</span>
                <span className="text-base sm:text-lg font-mono font-bold text-rose-300 tabular-nums">
                  {latestSignal.entry_zone}
                </span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-rose-900/60">
                <span className="text-[10px] text-rose-400 uppercase font-semibold block">Stop Loss (SL)</span>
                <span className="text-base sm:text-lg font-mono font-bold text-rose-300 tabular-nums">
                  {latestSignal.sl}
                </span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-emerald-900/50">
                <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Take Profit 1</span>
                <span className="text-base sm:text-lg font-mono font-bold text-emerald-300 tabular-nums">
                  {latestSignal.tp1}
                </span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-emerald-900/50">
                <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Take Profit 2</span>
                <span className="text-base sm:text-lg font-mono font-bold text-emerald-300 tabular-nums">
                  {latestSignal.tp2}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-rose-400 font-semibold">Formula Reason:</span>
                <span>{latestSignal.reason}</span>
              </div>
              <div className="text-slate-400 font-mono text-[11px] shrink-0">
                {latestSignal.session.timeWAT}
              </div>
            </div>
          </div>
        )}

        {(!latestSignal || latestSignal.direction === 'WAIT') && (
          <div className="bg-slate-900/90 border-2 border-amber-500/70 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-sm tracking-wider uppercase flex items-center gap-1.5 shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                  <span>WAIT</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {session?.isOpen ? 'No Qualified Signal · Awaiting Zone Rejection' : 'Market Closed · Standby'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    {latestSignal?.reason ||
                      'Price is currently between key zones or EMA34/EMA55 trend does not confirm rejection.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onCheckSignals(true)}
                  disabled={isChecking}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Re-evaluate</span>
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-semibold">1. ZONE PROXIMITY</span>
                <span className="text-slate-200 font-medium">Must touch Key Support or Resistance zone</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-semibold">2. CANDLE REJECTION</span>
                <span className="text-slate-200 font-medium">Bullish (Close &gt; Open) / Bearish (Close &lt; Open)</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-semibold">3. EMA ALIGNMENT</span>
                <span className="text-slate-200 font-medium">BUY requires EMA34 &gt; EMA55 · SELL requires EMA34 &lt; EMA55</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. NUMBER READER TERMINAL (NO IMAGE, NO CHART SCREENSHOT) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Number Reader Terminal · TwelveData Live Data
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pure numerical verification matrix: Evaluates M15 OHLC and indicators directly from TwelveData endpoints.
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded shrink-0">
            NO IMAGE · NO CHART SCREENSHOT
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase font-mono">
                <th className="py-2.5 px-3">Pair</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3 text-right">M15 Open</th>
                <th className="py-2.5 px-3 text-right">M15 High</th>
                <th className="py-2.5 px-3 text-right">M15 Low</th>
                <th className="py-2.5 px-3 text-right">M15 Close</th>
                <th className="py-2.5 px-3 text-right">EMA 34</th>
                <th className="py-2.5 px-3 text-right">EMA 55</th>
                <th className="py-2.5 px-3 text-center">Rejection Check</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {(['XAUUSD', 'EURUSD', 'BTCUSD'] as Pair[]).map((pair) => {
                const analysis = latestSignal?.detailedAnalysis?.find((a) => a.pair === pair);
                const c = analysis?.candle;
                const price = quotes ? quotes[pair]?.price : analysis?.current_price;

                const isBullish = analysis?.bullishRejection;
                const isBearish = analysis?.bearishRejection;

                return (
                  <tr key={pair} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-sans font-bold text-slate-100 flex items-center gap-1.5">
                      <CircleDot className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{pair}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white tabular-nums">
                      {price !== undefined ? formatPrice(price, pair) : '---'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                      {c ? formatPrice(c.open, pair) : '---'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                      {c ? formatPrice(c.high, pair) : '---'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                      {c ? formatPrice(c.low, pair) : '---'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                      {c ? formatPrice(c.close, pair) : '---'}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-300 tabular-nums">
                      {analysis ? formatPrice(analysis.ema34, pair) : '---'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                      {analysis ? formatPrice(analysis.ema55, pair) : '---'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isBullish ? (
                        <span className="text-emerald-400 font-sans font-semibold">Bullish Rejection</span>
                      ) : isBearish ? (
                        <span className="text-rose-400 font-sans font-semibold">Bearish Rejection</span>
                      ) : (
                        <span className="text-slate-500 font-sans">No Zone Touch</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-sans font-bold">
                      {latestSignal?.pair === pair && latestSignal.direction === 'BUY' ? (
                        <span className="text-emerald-400">BUY</span>
                      ) : latestSignal?.pair === pair && latestSignal.direction === 'SELL' ? (
                        <span className="text-rose-400">SELL</span>
                      ) : (
                        <span className="text-amber-400">WAIT</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. INTERACTIVE TEST SCENARIOS ENGINE */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Formula Verification & Interactive Test Sandbox
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly test the exact BUY, SELL, and WAIT rule execution with 1 click:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSimulate('BUY', 'XAUUSD')}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-colors flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Simulate Gold BUY</span>
            </button>
            <button
              onClick={() => onSimulate('SELL', 'EURUSD')}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 transition-colors flex items-center gap-1.5"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Simulate EURUSD SELL</span>
            </button>
            <button
              onClick={() => onSimulate('WAIT', 'XAUUSD')}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 transition-colors flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Reset to WAIT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
