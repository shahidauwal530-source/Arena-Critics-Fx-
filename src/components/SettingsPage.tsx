import React, { useState } from 'react';
import {
  Key,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Code2,
  Cpu,
  Info
} from 'lucide-react';
import type { BotSettings } from '../types';

interface SettingsPageProps {
  settings: BotSettings | null;
  onUpdateSettings: (newSettings: { apiKey?: string; sessionOverride?: boolean }) => Promise<void>;
  onRefresh: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onRefresh,
}) => {
  const [apiKey, setApiKey] = useState(settings?.apiKey || '');
  const [sessionOverride, setSessionOverride] = useState(Boolean(settings?.sessionOverride));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await onUpdateSettings({
        apiKey,
        sessionOverride,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <h2 className="text-lg font-bold text-white tracking-tight">Bot Configuration & API Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure your TwelveData API connection and trading session operation modes.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Settings saved successfully. Changes applied to active signal engine.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Key className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">TwelveData API Integration</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              TwelveData API Key (<code className="text-emerald-400">TWELVEDATA_API_KEY</code>)
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your TwelveData API key (e.g. 847d...)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-emerald-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              If left empty, the bot operates seamlessly in{' '}
              <strong className="text-emerald-400">Smart Simulation Mode</strong> with realistic market numbers,
              allowing you to test the complete UI and signals logic without an API key.
            </p>
          </div>

          {/* Session Mode Setting */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Session Schedule Control (Africa/Lagos WAT Time)
              </h4>
            </div>

            <div className="space-y-2 mt-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="radio"
                  name="sessionMode"
                  checked={!sessionOverride}
                  onChange={() => setSessionOverride(false)}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-white block">Strict WAT Hours (Standard Production)</span>
                  <span className="text-slate-400 mt-0.5 block">
                    Bot is only ON during London (08:00 - 12:00 WAT) and New York (13:00 - 17:00 WAT). Otherwise shows
                    &quot;WAIT - Market Closed&quot;.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="radio"
                  name="sessionMode"
                  checked={sessionOverride}
                  onChange={() => setSessionOverride(true)}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-amber-300 block">Force Session Active (24/7 Testing Mode)</span>
                  <span className="text-slate-400 mt-0.5 block">
                    Forces the bot session to remain ON at any hour so you can inspect signal triggers and calculations
                    outside WAT trading hours.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Endpoints & Rules Documentation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">TwelveData Endpoints Used</h4>
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-emerald-400 font-bold">1. Live Quotes:</span>
              <div className="text-[11px] text-slate-400 mt-1 break-all">
                GET /quote?symbol=XAU/USD,EUR/USD,BTC/USD&apikey=KEY
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-emerald-400 font-bold">2. M15 Candles:</span>
              <div className="text-[11px] text-slate-400 mt-1 break-all">
                GET /time_series?symbol=XAU/USD&interval=15min&outputsize=100&apikey=KEY
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-emerald-400 font-bold">3. EMA 34:</span>
              <div className="text-[11px] text-slate-400 mt-1 break-all">
                GET /ema?symbol=XAU/USD&interval=15min&time_period=34&apikey=KEY
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-emerald-400 font-bold">4. EMA 55:</span>
              <div className="text-[11px] text-slate-400 mt-1 break-all">
                GET /ema?symbol=XAU/USD&interval=15min&time_period=55&apikey=KEY
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Coded Mathematical Rules</h4>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-emerald-400 font-semibold block">BUY Condition:</span>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-mono">
                low &lt;= zone_high AND low &gt;= zone_low AND close &gt; zone_low AND close &gt; open (bullish rejection)
                AND EMA34 &gt; EMA55 AND zone type is Support
              </p>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-rose-400 font-semibold block">SELL Condition:</span>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-mono">
                high &gt;= zone_low AND high &lt;= zone_high AND close &lt; zone_high AND close &lt; open (bearish rejection)
                AND EMA34 &lt; EMA55 AND zone type is Resistance
              </p>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-amber-400 font-semibold block">Risk Management:</span>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Lot size is fixed at <strong className="text-slate-200">0.01 Lot ONLY</strong>, Risk is fixed at{' '}
                <strong className="text-slate-200">1% ONLY</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
