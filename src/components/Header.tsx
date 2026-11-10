import React from 'react';
import { Activity, Clock, RefreshCw } from 'lucide-react';
import type { SessionInfo } from '../types';

interface HeaderProps {
  currentTab: 'dashboard' | 'signals' | 'zones' | 'settings';
  onSelectTab: (tab: 'dashboard' | 'signals' | 'zones' | 'settings') => void;
  session: SessionInfo | null;
  onRefresh: () => void;
  isChecking: boolean;
  signalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  session,
  onRefresh,
  isChecking,
  signalCount,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Brand title wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block leading-tight">
                Arewa Critics Signal Bot
              </span>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                Version 1 · Number Reader
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Single-line whitespace-nowrap) */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-lg">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                currentTab === 'dashboard'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onSelectTab('signals')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentTab === 'signals'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Signals</span>
              {signalCount > 0 && (
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
                  {signalCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onSelectTab('zones')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                currentTab === 'zones'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin Zones
            </button>
            <button
              onClick={() => onSelectTab('settings')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                currentTab === 'settings'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Settings
            </button>
          </nav>

          {/* Zone 3: Session Status & Action */}
          <div className="flex items-center gap-3 shrink-0">
            {session && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="tabular-nums">{session.timeWAT}</span>
                <span className="text-slate-600">·</span>
                <span
                  className={
                    session.isOpen
                      ? 'text-emerald-400 font-semibold'
                      : 'text-amber-400 font-semibold'
                  }
                >
                  {session.isOpen ? session.sessionName : 'WAIT (Closed)'}
                </span>
              </div>
            )}

            <button
              onClick={onRefresh}
              disabled={isChecking}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
              title="Trigger check-signals immediately"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Check Now</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              currentTab === 'dashboard' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onSelectTab('signals')}
            className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 ${
              currentTab === 'signals' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Signals ({signalCount})
          </button>
          <button
            onClick={() => onSelectTab('zones')}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              currentTab === 'zones' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Zones
          </button>
          <button
            onClick={() => onSelectTab('settings')}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              currentTab === 'settings' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Settings
          </button>
        </div>
      </div>
    </header>
  );
};
