/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { SignalsPage } from './components/SignalsPage';
import { AdminZonesPage } from './components/AdminZonesPage';
import { SettingsPage } from './components/SettingsPage';
import { Footer } from './components/Footer';
import type {
  Pair,
  PairQuote,
  SignalCheckResponse,
  SessionInfo,
  KeyZone,
  SignalRecord,
  BotSettings,
  ZoneType
} from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'signals' | 'zones' | 'settings'>('dashboard');
  const [quotes, setQuotes] = useState<Record<Pair, PairQuote> | null>(null);
  const [latestSignal, setLatestSignal] = useState<SignalCheckResponse | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [zones, setZones] = useState<KeyZone[]>([]);
  const [signals, setSignals] = useState<SignalRecord[]>([]);
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [countdown, setCountdown] = useState<number>(60);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [initialLoaded, setInitialLoaded] = useState<boolean>(false);

  const countdownRef = useRef<number>(60);

  // 1. Fetch latest quotes
  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch('/api/quotes');
      if (res.ok) {
        const data = await res.json();
        setQuotes(data);
      }
    } catch (err) {
      console.warn('Failed to fetch live quotes:', err);
    }
  }, []);

  // 2. Fetch system status (session info, latest result)
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        if (data.latestResult) {
          setLatestSignal(data.latestResult);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch status:', err);
    }
  }, []);

  // 3. Fetch all key zones
  const fetchZones = useCallback(async () => {
    try {
      const res = await fetch('/api/zones');
      if (res.ok) {
        const data = await res.json();
        setZones(data);
      }
    } catch (err) {
      console.warn('Failed to fetch zones:', err);
    }
  }, []);

  // 4. Fetch signal history
  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch('/api/signals');
      if (res.ok) {
        const data = await res.json();
        setSignals(data);
      }
    } catch (err) {
      console.warn('Failed to fetch signals:', err);
    }
  }, []);

  // 5. Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.warn('Failed to fetch settings:', err);
    }
  }, []);

  // Core Check Signals Function
  const checkSignals = useCallback(
    async (force: boolean = false) => {
      setIsChecking(true);
      try {
        const url = force ? '/api/check-signals?force=true' : '/api/check-signals';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setLatestSignal(data);
          setSession(data.session);
          // If a BUY or SELL signal was triggered, refresh signals list
          if (data.direction === 'BUY' || data.direction === 'SELL') {
            fetchSignals();
          }
        }
      } catch (err) {
        console.error('Error checking signals:', err);
      } finally {
        setIsChecking(false);
        countdownRef.current = 60;
        setCountdown(60);
      }
    },
    [fetchSignals]
  );

  // Interactive Simulate Trigger (BUY / SELL / WAIT)
  const handleSimulate = async (scenario: 'BUY' | 'SELL' | 'WAIT', pair: Pair) => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/simulate-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, pair }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setLatestSignal(data.result);
          setSession(data.result.session);
          fetchSignals();
          fetchQuotes();
        }
      }
    } catch (err) {
      console.error('Error simulating scenario:', err);
    } finally {
      setIsChecking(false);
      countdownRef.current = 60;
      setCountdown(60);
    }
  };

  // Add Key Zone
  const handleAddZone = async (newZone: {
    pair: Pair;
    type: ZoneType;
    zone_low: number;
    zone_high: number;
  }) => {
    const res = await fetch('/api/zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newZone),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to add zone');
    }
    await fetchZones();
  };

  // Delete Key Zone
  const handleDeleteZone = async (id: string) => {
    const res = await fetch(`/api/zones/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchZones();
    }
  };

  // Reset Zones to defaults
  const handleResetZones = async () => {
    const res = await fetch('/api/zones/reset', { method: 'POST' });
    if (res.ok) {
      await fetchZones();
    }
  };

  // Clear Signals History
  const handleClearSignals = async () => {
    const res = await fetch('/api/signals', { method: 'DELETE' });
    if (res.ok) {
      setSignals([]);
    }
  };

  // Delete individual signal
  const handleDeleteSignal = async (id: string) => {
    const res = await fetch(`/api/signals/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSignals((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Update Settings
  const handleUpdateSettings = async (newSettings: {
    apiKey?: string;
    sessionOverride?: boolean;
  }) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
      await fetchStatus();
    }
  };

  // Initial Load
  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([
        fetchQuotes(),
        fetchStatus(),
        fetchZones(),
        fetchSignals(),
        fetchSettings(),
      ]);
      setInitialLoaded(true);
      // Run first signal check
      await checkSignals(false);
    };
    loadAll();
  }, [fetchQuotes, fetchStatus, fetchZones, fetchSignals, fetchSettings, checkSignals]);

  // 1-second countdown loop and 60-second automatic trigger
  useEffect(() => {
    const timer = setInterval(() => {
      countdownRef.current -= 1;
      if (countdownRef.current <= 0) {
        countdownRef.current = 60;
        setCountdown(60);
        checkSignals(false);
      } else {
        setCountdown(countdownRef.current);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [checkSignals]);

  // Periodic quotes refresh every 5 seconds
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      fetchQuotes();
    }, 5000);
    return () => clearInterval(quoteInterval);
  }, [fetchQuotes]);

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 font-sans">
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        session={session}
        onRefresh={() => checkSignals(false)}
        isChecking={isChecking}
        signalCount={signals.length}
      />

      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            quotes={quotes}
            latestSignal={latestSignal}
            session={session}
            countdown={countdown}
            onCheckSignals={checkSignals}
            isChecking={isChecking}
            zones={zones}
            onSimulate={handleSimulate}
            onNavigateToTab={setCurrentTab}
          />
        )}

        {currentTab === 'signals' && (
          <SignalsPage
            signals={signals}
            onClearSignals={handleClearSignals}
            onDeleteSignal={handleDeleteSignal}
            onSimulate={handleSimulate}
          />
        )}

        {currentTab === 'zones' && (
          <AdminZonesPage
            zones={zones}
            onAddZone={handleAddZone}
            onDeleteZone={handleDeleteZone}
            onResetZones={handleResetZones}
            quotes={quotes}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsPage
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onRefresh={() => {
              fetchSettings();
              fetchStatus();
            }}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
