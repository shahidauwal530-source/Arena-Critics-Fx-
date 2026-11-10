import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-slate-800/80 bg-slate-950 py-6 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-bold text-slate-300">Arewa Critics Signal Bot</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">Version 1 (Number Reader Bot)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              TwelveData API real-time number reader · Africa/Lagos WAT Sessions (08:00-12:00 & 13:00-17:00)
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/30 border border-amber-900/50 text-amber-300/90 font-medium text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>For Education Only, Not Financial Advice.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
