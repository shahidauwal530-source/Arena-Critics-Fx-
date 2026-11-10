import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Shield,
  Target
} from 'lucide-react';
import type { KeyZone, Pair, ZoneType, PairQuote } from '../types';

interface AdminZonesPageProps {
  zones: KeyZone[];
  onAddZone: (zone: { pair: Pair; type: ZoneType; zone_low: number; zone_high: number }) => Promise<void>;
  onDeleteZone: (id: string) => Promise<void>;
  onResetZones: () => Promise<void>;
  quotes: Record<Pair, PairQuote> | null;
}

export const AdminZonesPage: React.FC<AdminZonesPageProps> = ({
  zones,
  onAddZone,
  onDeleteZone,
  onResetZones,
  quotes,
}) => {
  const [pair, setPair] = useState<Pair>('XAUUSD');
  const [type, setType] = useState<ZoneType>('Support');
  const [zoneLow, setZoneLow] = useState<string>('');
  const [zoneHigh, setZoneHigh] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group zones by pair for clean display
  const xauZones = zones.filter((z) => z.pair === 'XAUUSD');
  const eurZones = zones.filter((z) => z.pair === 'EURUSD');
  const btcZones = zones.filter((z) => z.pair === 'BTCUSD');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const low = parseFloat(zoneLow);
    const high = parseFloat(zoneHigh);

    if (isNaN(low) || isNaN(high)) {
      setError('Please enter valid numeric values for Zone Low and Zone High.');
      return;
    }

    if (low >= high) {
      setError('Zone Low must be strictly less than Zone High (e.g. Low: 4110, High: 4113).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddZone({ pair, type, zone_low: low, zone_high: high });
      setSuccess(`Added ${pair} ${type} zone (${low} - ${high}) successfully.`);
      setZoneLow('');
      setZoneHigh('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to add key zone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPreset = (presetPair: Pair, presetType: ZoneType, low: number, high: number) => {
    setPair(presetPair);
    setType(presetType);
    setZoneLow(String(low));
    setZoneHigh(String(high));
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Key Zone System · Admin Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure Support and Resistance zones. When candles touch these zones and reject, BUY or SELL signals trigger.
          </p>
        </div>

        <button
          onClick={onResetZones}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Reset Default Testing Zones</span>
        </button>
      </div>

      {/* Add Zone Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800">
          <Plus className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add New Key Zone</h3>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1.5">
              Trading Pair
            </label>
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value as Pair)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 font-medium"
            >
              <option value="XAUUSD">XAUUSD (Gold)</option>
              <option value="EURUSD">EURUSD (Euro)</option>
              <option value="BTCUSD">BTCUSD (Bitcoin)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1.5">
              Zone Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ZoneType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 font-medium"
            >
              <option value="Support">Support (BUY Target)</option>
              <option value="Resistance">Resistance (SELL Target)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1.5">
              Zone Low ({pair === 'EURUSD' ? 'e.g. 1.1650' : 'e.g. 4110.00'})
            </label>
            <input
              type="number"
              step="any"
              required
              value={zoneLow}
              onChange={(e) => setZoneLow(e.target.value)}
              placeholder="Zone Low"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1.5">
              Zone High ({pair === 'EURUSD' ? 'e.g. 1.1660' : 'e.g. 4113.00'})
            </label>
            <input
              type="number"
              step="any"
              required
              value={zoneHigh}
              onChange={(e) => setZoneHigh(e.target.value)}
              placeholder="Zone High"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Adding...' : 'Save Zone'}</span>
            </button>
          </div>
        </form>

        {/* Quick Presets for current test session */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Quick Presets:</span>
          <button
            type="button"
            onClick={() => setPreset('XAUUSD', 'Support', 4110, 4113)}
            className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
          >
            XAU Support (4110-4113)
          </button>
          <button
            type="button"
            onClick={() => setPreset('XAUUSD', 'Resistance', 4125, 4128)}
            className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
          >
            XAU Resistance (4125-4128)
          </button>
          <button
            type="button"
            onClick={() => setPreset('EURUSD', 'Support', 1.1650, 1.1660)}
            className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
          >
            EUR Support (1.1650-1.1660)
          </button>
          <button
            type="button"
            onClick={() => setPreset('BTCUSD', 'Support', 102000, 102500)}
            className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
          >
            BTC Support (102000-102500)
          </button>
        </div>
      </div>

      {/* Zones Tables by Pair */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { pair: 'XAUUSD' as Pair, title: 'Gold (XAUUSD) Zones', items: xauZones },
          { pair: 'EURUSD' as Pair, title: 'Euro (EURUSD) Zones', items: eurZones },
          { pair: 'BTCUSD' as Pair, title: 'Bitcoin (BTCUSD) Zones', items: btcZones },
        ].map(({ pair: p, title, items }) => {
          const currentPrice = quotes ? quotes[p]?.price : null;

          return (
            <div key={p} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white">{title}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Live Price: {currentPrice !== null ? currentPrice : '---'}
                  </span>
                </div>
                <span className="text-xs font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                  {items.length} zones
                </span>
              </div>

              {items.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No zones configured for {p}.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 mt-2">
                  {items.map((z) => {
                    const isSupport = z.type === 'Support';
                    const isInside =
                      currentPrice !== null &&
                      currentPrice >= z.zone_low &&
                      currentPrice <= z.zone_high;

                    return (
                      <div key={z.id} className="py-3 flex items-center justify-between gap-2 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isSupport
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                              }`}
                            >
                              {z.type}
                            </span>
                            <span className="font-mono font-bold text-white tabular-nums">
                              {z.zone_low} — {z.zone_high}
                            </span>
                          </div>

                          {isInside && (
                            <span className="text-[11px] text-amber-400 font-medium block">
                              ⚡ Price is inside this zone now
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => onDeleteZone(z.id)}
                          className="p-1.5 rounded-md bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete zone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
