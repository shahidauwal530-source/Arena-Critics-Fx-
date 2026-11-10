import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type {
  Pair,
  ApiSymbol,
  ZoneType,
  KeyZone,
  CandleM15,
  PairQuote,
  MarketAnalysis,
  SignalRecord,
  SessionInfo,
  SignalCheckResponse,
  BotSettings
} from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Persistent storage file paths
const DATA_DIR = path.join(__dirname, '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const ZONES_FILE = path.join(DATA_DIR, 'key_zones.json');
const SIGNALS_FILE = path.join(DATA_DIR, 'signals.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Default key zones per prompt
const DEFAULT_ZONES: KeyZone[] = [
  { id: 'zone-xau-sup-1', pair: 'XAUUSD', type: 'Support', zone_low: 4110, zone_high: 4113, createdAt: new Date().toISOString() },
  { id: 'zone-xau-res-1', pair: 'XAUUSD', type: 'Resistance', zone_low: 4125, zone_high: 4128, createdAt: new Date().toISOString() },
  { id: 'zone-eur-sup-1', pair: 'EURUSD', type: 'Support', zone_low: 1.1650, zone_high: 1.1660, createdAt: new Date().toISOString() },
  { id: 'zone-eur-res-1', pair: 'EURUSD', type: 'Resistance', zone_low: 1.1700, zone_high: 1.1710, createdAt: new Date().toISOString() },
  { id: 'zone-btc-sup-1', pair: 'BTCUSD', type: 'Support', zone_low: 102000, zone_high: 102500, createdAt: new Date().toISOString() },
  { id: 'zone-btc-res-1', pair: 'BTCUSD', type: 'Resistance', zone_low: 105000, zone_high: 105500, createdAt: new Date().toISOString() },
];

// Helper to read / write data safely
function loadJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function saveJson<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error saving ${filePath}:`, err);
  }
}

// In-memory state synchronized with filesystem
let keyZones: KeyZone[] = loadJson<KeyZone[]>(ZONES_FILE, DEFAULT_ZONES);
if (keyZones.length === 0) {
  keyZones = [...DEFAULT_ZONES];
  saveJson(ZONES_FILE, keyZones);
}

let signalHistory: SignalRecord[] = loadJson<SignalRecord[]>(SIGNALS_FILE, []);

let botSettings: BotSettings = loadJson<BotSettings>(SETTINGS_FILE, {
  apiKey: process.env.TWELVEDATA_API_KEY || '',
  hasEnvKey: Boolean(process.env.TWELVEDATA_API_KEY),
  sessionOverride: false,
  checkIntervalSeconds: 60,
  isSimulatedMode: !process.env.TWELVEDATA_API_KEY,
  lastCheckedAt: null,
});

// Latest check result cached in memory
let latestCheckResult: SignalCheckResponse | null = null;

// Simulated market price baseline when TwelveData API key is not configured or rate-limited
interface SimPairState {
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  ema34: number;
  ema55: number;
  change24h: number;
  changePercent: number;
}

const simState: Record<Pair, SimPairState> = {
  XAUUSD: {
    price: 4118.50,
    open: 4116.20,
    high: 4120.40,
    low: 4114.80,
    close: 4118.50,
    ema34: 4119.20,
    ema55: 4122.10,
    change24h: 12.30,
    changePercent: 0.30,
  },
  EURUSD: {
    price: 1.1685,
    open: 1.1678,
    high: 1.1692,
    low: 1.1672,
    close: 1.1685,
    ema34: 1.1682,
    ema55: 1.1675,
    change24h: 0.0015,
    changePercent: 0.13,
  },
  BTCUSD: {
    price: 103850,
    open: 103400,
    high: 104200,
    low: 103100,
    close: 103850,
    ema34: 103600,
    ema55: 103200,
    change24h: 1450,
    changePercent: 1.41,
  },
};

// Check Africa/Lagos Time (WAT = UTC+1)
// 08:00 - 12:00 WAT = LONDON SESSION - Bot is ON
// 13:00 - 17:00 WAT = NEW YORK SESSION - Bot is ON
// Else = Bot is OFF, show "WAIT - Market Closed"
export function getWatSession(override?: boolean): SessionInfo {
  const now = new Date();
  // Africa/Lagos is strictly UTC+1 all year
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const watMs = utcMs + 3600000; // +1 hour
  const watDate = new Date(watMs);

  const hours = watDate.getHours();
  const minutes = watDate.getMinutes();
  const seconds = watDate.getSeconds();
  const timeWAT = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} WAT`;

  const isLondon = hours >= 8 && hours < 12;
  const isNewYork = hours >= 13 && hours < 17;
  const isActualOpen = isLondon || isNewYork;

  const effectiveOverride = Boolean(override !== undefined ? override : botSettings.sessionOverride);
  const isOpen = effectiveOverride || isActualOpen;

  let status: 'LONDON' | 'NEW_YORK' | 'CLOSED' = 'CLOSED';
  let sessionName = 'WAIT - Market Closed';

  if (isLondon) {
    status = 'LONDON';
    sessionName = 'London Session';
  } else if (isNewYork) {
    status = 'NEW_YORK';
    sessionName = 'New York Session';
  } else if (effectiveOverride) {
    status = 'LONDON';
    sessionName = 'Forced Active (Test Mode)';
  }

  return {
    status,
    sessionName,
    isOpen,
    timeWAT,
    isOverride: effectiveOverride,
  };
}

// Convert symbol name to TwelveData format
function getSymbolForPair(pair: Pair): ApiSymbol {
  switch (pair) {
    case 'XAUUSD':
      return 'XAU/USD';
    case 'EURUSD':
      return 'EUR/USD';
    case 'BTCUSD':
      return 'BTC/USD';
  }
}

// Fetch live quote from TwelveData or fallback to simulated tick
async function fetchQuotes(apiKey: string): Promise<Record<Pair, PairQuote>> {
  const nowIso = new Date().toISOString();
  const pairs: Pair[] = ['XAUUSD', 'EURUSD', 'BTCUSD'];

  if (apiKey) {
    try {
      const symbols = 'XAU/USD,EUR/USD,BTC/USD';
      const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${apiKey}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();

      if (res.ok && !data.code) {
        const quotes: Partial<Record<Pair, PairQuote>> = {};

        for (const p of pairs) {
          const sym = getSymbolForPair(p);
          const item = data[sym] || (data.symbol === sym ? data : null);
          if (item && item.close) {
            const price = parseFloat(item.close);
            const high24h = parseFloat(item.high || item.close);
            const low24h = parseFloat(item.low || item.close);
            const change24h = parseFloat(item.change || '0');
            const changePercent24h = parseFloat(item.percent_change || '0');
            quotes[p] = {
              pair: p,
              symbol: sym,
              price,
              high24h,
              low24h,
              change24h,
              changePercent24h,
              timestamp: nowIso,
            };
            // update simState as baseline
            simState[p].price = price;
            simState[p].close = price;
          }
        }

        if (quotes.XAUUSD && quotes.EURUSD && quotes.BTCUSD) {
          return quotes as Record<Pair, PairQuote>;
        }
      }
    } catch (err) {
      console.warn('TwelveData quote fetch failed, using realistic price engine:', err);
    }
  }

  // Realistic simulation price drift (+- 0.05%)
  for (const p of pairs) {
    const s = simState[p];
    const jitterFactor = (Math.random() - 0.49) * 0.001;
    s.price = Number((s.price * (1 + jitterFactor)).toFixed(p === 'EURUSD' ? 5 : 2));
    s.close = s.price;
    if (s.price > s.high) s.high = s.price;
    if (s.price < s.low) s.low = s.price;
  }

  return {
    XAUUSD: {
      pair: 'XAUUSD',
      symbol: 'XAU/USD',
      price: simState.XAUUSD.price,
      high24h: simState.XAUUSD.high,
      low24h: simState.XAUUSD.low,
      change24h: simState.XAUUSD.change24h,
      changePercent24h: simState.XAUUSD.changePercent,
      timestamp: nowIso,
    },
    EURUSD: {
      pair: 'EURUSD',
      symbol: 'EUR/USD',
      price: simState.EURUSD.price,
      high24h: simState.EURUSD.high,
      low24h: simState.EURUSD.low,
      change24h: simState.EURUSD.change24h,
      changePercent24h: simState.EURUSD.changePercent,
      timestamp: nowIso,
    },
    BTCUSD: {
      pair: 'BTCUSD',
      symbol: 'BTC/USD',
      price: simState.BTCUSD.price,
      high24h: simState.BTCUSD.high,
      low24h: simState.BTCUSD.low,
      change24h: simState.BTCUSD.change24h,
      changePercent24h: simState.BTCUSD.changePercent,
      timestamp: nowIso,
    },
  };
}

// Fetch M15 candle + EMA 34 & 55 for a specific pair
async function fetchCandleAndEma(
  pair: Pair,
  apiKey: string
): Promise<{ candle: CandleM15; ema34: number; ema55: number; current_price: number }> {
  const sym = getSymbolForPair(pair);

  if (apiKey) {
    try {
      // 1. Time series for M15 candle
      const tsUrl = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(sym)}&interval=15min&outputsize=10&apikey=${apiKey}`;
      const ema34Url = `https://api.twelvedata.com/ema?symbol=${encodeURIComponent(sym)}&interval=15min&time_period=34&apikey=${apiKey}`;
      const ema55Url = `https://api.twelvedata.com/ema?symbol=${encodeURIComponent(sym)}&interval=15min&time_period=55&apikey=${apiKey}`;

      const [tsRes, ema34Res, ema55Res] = await Promise.all([
        fetch(tsUrl),
        fetch(ema34Url),
        fetch(ema55Url),
      ]);

      const tsData = await tsRes.json();
      const ema34Data = await ema34Res.json();
      const ema55Data = await ema55Res.json();

      if (tsData.values && tsData.values.length > 0 && ema34Data.values && ema55Data.values) {
        const lastCandle = tsData.values[0];
        const ema34Val = parseFloat(ema34Data.values[0].ema);
        const ema55Val = parseFloat(ema55Data.values[0].ema);

        return {
          candle: {
            datetime: lastCandle.datetime,
            open: parseFloat(lastCandle.open),
            high: parseFloat(lastCandle.high),
            low: parseFloat(lastCandle.low),
            close: parseFloat(lastCandle.close),
          },
          ema34: ema34Val,
          ema55: ema55Val,
          current_price: parseFloat(lastCandle.close),
        };
      }
    } catch (err) {
      console.warn(`TwelveData indicators for ${pair} failed, using simulated data:`, err);
    }
  }

  // Fallback to simulated numbers
  const s = simState[pair];
  return {
    candle: {
      open: s.open,
      high: s.high,
      low: s.low,
      close: s.close,
      datetime: new Date().toISOString(),
    },
    ema34: s.ema34,
    ema55: s.ema55,
    current_price: s.price,
  };
}

// Core Signal Check Engine
// PAIRS CHECK ORDER: XAUUSD first, then EURUSD, then BTCUSD. Stop at the first signal.
// BUY IF: low <= zone_high AND low >= zone_low AND close > zone_low AND close > open (bullish rejection) AND EMA34 > EMA55 AND zone type is Support
// SELL IF: high >= zone_low AND high <= zone_high AND close < zone_high AND close < open (bearish rejection) AND EMA34 < EMA55 AND zone type is Resistance
// ELSE: Direction = WAIT
// If price is in middle (not in any zone) = WAIT
// If EMA34 == EMA55 (flat) = WAIT
export async function runSignalCheck(options?: { forceSession?: boolean }): Promise<SignalCheckResponse> {
  const session = getWatSession(options?.forceSession);
  const nowIso = new Date().toISOString();
  botSettings.lastCheckedAt = nowIso;
  saveJson(SETTINGS_FILE, botSettings);

  // If Market Closed and not override -> WAIT - Market Closed
  if (!session.isOpen) {
    const closedResponse: SignalCheckResponse = {
      pair: 'ALL',
      direction: 'WAIT',
      entry_zone: 'None',
      sl: 0,
      tp1: 0,
      tp2: 0,
      reason: 'WAIT - Market Closed. Signals operate during London (08:00 - 12:00 WAT) and New York (13:00 - 17:00 WAT) sessions only.',
      ema34: 0,
      ema55: 0,
      current_price: 0,
      timestamp: nowIso,
      session,
      lotSize: 0.01,
      riskPercent: 1.0,
      detailedAnalysis: [],
    };
    latestCheckResult = closedResponse;
    return closedResponse;
  }

  const pairsToCheck: Pair[] = ['XAUUSD', 'EURUSD', 'BTCUSD'];
  const detailedAnalysis: MarketAnalysis[] = [];
  let generatedSignal: SignalCheckResponse | null = null;

  for (const pair of pairsToCheck) {
    const { candle, ema34, ema55, current_price } = await fetchCandleAndEma(pair, botSettings.apiKey);
    const pairZones = keyZones.filter((z) => z.pair === pair);

    // Identify if the candle is in any zone
    // Check Support zones
    const supportZones = pairZones.filter((z) => z.type === 'Support');
    const resistanceZones = pairZones.filter((z) => z.type === 'Resistance');

    // Find if candle low touches any support zone
    const touchingSupport = supportZones.find(
      (z) => candle.low <= z.zone_high && candle.low >= z.zone_low
    );

    // Find if candle high touches any resistance zone
    const touchingResistance = resistanceZones.find(
      (z) => candle.high >= z.zone_low && candle.high <= z.zone_high
    );

    const activeZone = touchingSupport || touchingResistance || null;

    let zoneRelation: MarketAnalysis['zoneRelation'] = 'BETWEEN_ZONES';
    if (touchingSupport) {
      zoneRelation = 'IN_SUPPORT';
    } else if (touchingResistance) {
      zoneRelation = 'IN_RESISTANCE';
    } else {
      const minLow = Math.min(...pairZones.map((z) => z.zone_low));
      const maxHigh = Math.max(...pairZones.map((z) => z.zone_high));
      if (current_price > maxHigh) zoneRelation = 'ABOVE_ALL';
      else if (current_price < minLow) zoneRelation = 'BELOW_ALL';
      else zoneRelation = 'BETWEEN_ZONES';
    }

    const bullishRejection =
      touchingSupport !== undefined &&
      candle.close > touchingSupport.zone_low &&
      candle.close > candle.open;

    const bearishRejection =
      touchingResistance !== undefined &&
      candle.close < touchingResistance.zone_high &&
      candle.close < candle.open;

    const emaCondition: MarketAnalysis['emaCondition'] =
      ema34 > ema55 ? 'BULLISH' : ema34 < ema55 ? 'BEARISH' : 'FLAT';

    detailedAnalysis.push({
      pair,
      symbol: getSymbolForPair(pair),
      current_price,
      candle,
      ema34,
      ema55,
      activeZone,
      zoneRelation,
      bullishRejection,
      bearishRejection,
      emaCondition,
    });

    // Check if we already found a signal from an earlier pair (priority: XAUUSD > EURUSD > BTCUSD)
    if (generatedSignal) {
      continue;
    }

    // CHECK BUY
    // BUY IF: low <= zone_high AND low >= zone_low AND close > zone_low AND close > open (bullish rejection) AND EMA34 > EMA55 AND zone type is Support
    if (
      touchingSupport &&
      candle.low <= touchingSupport.zone_high &&
      candle.low >= touchingSupport.zone_low &&
      candle.close > touchingSupport.zone_low &&
      candle.close > candle.open &&
      ema34 > ema55
    ) {
      // Calculate Stop Loss & Take Profits
      // For BUY: Entry = zone_low - zone_high, Stop Loss = zone_low - 2 (for XAUUSD, 20 pips for EURUSD, 300 for BTCUSD), TP1 = Next Resistance Zone Low, TP2 = Next Resistance Zone High
      let slDelta = 2;
      let defaultTpDelta = 15;
      if (pair === 'EURUSD') {
        slDelta = 0.0020;
        defaultTpDelta = 0.0050;
      } else if (pair === 'BTCUSD') {
        slDelta = 300;
        defaultTpDelta = 2000;
      }

      const sl = Number((touchingSupport.zone_low - slDelta).toFixed(pair === 'EURUSD' ? 5 : 2));

      // Find next resistance zone above support
      const nextResistance = resistanceZones.find((z) => z.zone_low > touchingSupport.zone_high);
      const tp1 = nextResistance
        ? nextResistance.zone_low
        : Number((touchingSupport.zone_high + defaultTpDelta).toFixed(pair === 'EURUSD' ? 5 : 2));
      const tp2 = nextResistance
        ? nextResistance.zone_high
        : Number((touchingSupport.zone_high + defaultTpDelta * 1.5).toFixed(pair === 'EURUSD' ? 5 : 2));

      const entryStr = `${touchingSupport.zone_low} - ${touchingSupport.zone_high}`;
      const reason = `Bullish Rejection at Support (${entryStr}) with M15 Close (${candle.close}) > Open (${candle.open}) and EMA34 (${ema34}) > EMA55 (${ema55}).`;

      generatedSignal = {
        pair,
        direction: 'BUY',
        entry_zone: entryStr,
        sl,
        tp1,
        tp2,
        reason,
        ema34,
        ema55,
        current_price,
        candle,
        timestamp: nowIso,
        session,
        lotSize: 0.01,
        riskPercent: 1.0,
      };

      // Save to signals history in DB
      const newSignalRecord: SignalRecord = {
        id: `sig-${Date.now()}-${pair}`,
        pair,
        direction: 'BUY',
        entry_zone: entryStr,
        sl,
        tp1,
        tp2,
        reason,
        ema34,
        ema55,
        current_price,
        candle,
        timestamp: nowIso,
        session: session.sessionName,
        lotSize: 0.01,
        riskPercent: 1.0,
      };
      signalHistory.unshift(newSignalRecord);
      // Keep up to 100 historical signals
      if (signalHistory.length > 100) signalHistory = signalHistory.slice(0, 100);
      saveJson(SIGNALS_FILE, signalHistory);
    }
    // CHECK SELL
    // SELL IF: high >= zone_low AND high <= zone_high AND close < zone_high AND close < open (bearish rejection) AND EMA34 < EMA55 AND zone type is Resistance
    else if (
      touchingResistance &&
      candle.high >= touchingResistance.zone_low &&
      candle.high <= touchingResistance.zone_high &&
      candle.close < touchingResistance.zone_high &&
      candle.close < candle.open &&
      ema34 < ema55
    ) {
      // Calculate Stop Loss & Take Profits
      // For SELL: Entry = zone_low - zone_high, Stop Loss = zone_high + 2 (for XAUUSD, 20 pips for EURUSD, 300 for BTCUSD), TP1 = Next Support Zone High, TP2 = Next Support Zone Low
      let slDelta = 2;
      let defaultTpDelta = 15;
      if (pair === 'EURUSD') {
        slDelta = 0.0020;
        defaultTpDelta = 0.0050;
      } else if (pair === 'BTCUSD') {
        slDelta = 300;
        defaultTpDelta = 2000;
      }

      const sl = Number((touchingResistance.zone_high + slDelta).toFixed(pair === 'EURUSD' ? 5 : 2));

      // Find next support zone below resistance
      const nextSupport = supportZones.find((z) => z.zone_high < touchingResistance.zone_low);
      const tp1 = nextSupport
        ? nextSupport.zone_high
        : Number((touchingResistance.zone_low - defaultTpDelta).toFixed(pair === 'EURUSD' ? 5 : 2));
      const tp2 = nextSupport
        ? nextSupport.zone_low
        : Number((touchingResistance.zone_low - defaultTpDelta * 1.5).toFixed(pair === 'EURUSD' ? 5 : 2));

      const entryStr = `${touchingResistance.zone_low} - ${touchingResistance.zone_high}`;
      const reason = `Bearish Rejection at Resistance (${entryStr}) with M15 Close (${candle.close}) < Open (${candle.open}) and EMA34 (${ema34}) < EMA55 (${ema55}).`;

      generatedSignal = {
        pair,
        direction: 'SELL',
        entry_zone: entryStr,
        sl,
        tp1,
        tp2,
        reason,
        ema34,
        ema55,
        current_price,
        candle,
        timestamp: nowIso,
        session,
        lotSize: 0.01,
        riskPercent: 1.0,
      };

      // Save to signals history in DB
      const newSignalRecord: SignalRecord = {
        id: `sig-${Date.now()}-${pair}`,
        pair,
        direction: 'SELL',
        entry_zone: entryStr,
        sl,
        tp1,
        tp2,
        reason,
        ema34,
        ema55,
        current_price,
        candle,
        timestamp: nowIso,
        session: session.sessionName,
        lotSize: 0.01,
        riskPercent: 1.0,
      };
      signalHistory.unshift(newSignalRecord);
      if (signalHistory.length > 100) signalHistory = signalHistory.slice(0, 100);
      saveJson(SIGNALS_FILE, signalHistory);
    }
  }

  // If no BUY or SELL signal was triggered across the pairs in order
  if (!generatedSignal) {
    // Generate precise numerical reason for WAIT
    const xau = detailedAnalysis.find((a) => a.pair === 'XAUUSD');
    let waitReason = 'WAIT - No setup matching Key Zone & EMA rejection rules.';
    if (xau) {
      if (xau.zoneRelation === 'BETWEEN_ZONES') {
        waitReason = `WAIT - Price (${xau.current_price}) is in middle between key zones. No zone rejections detected.`;
      } else if (xau.emaCondition === 'FLAT') {
        waitReason = `WAIT - EMA34 (${xau.ema34}) equals EMA55 (${xau.ema55}) (flat market).`;
      } else if (xau.activeZone) {
        waitReason = `WAIT - Touching ${xau.activeZone.type} (${xau.activeZone.zone_low}-${xau.activeZone.zone_high}) but rejection candle or EMA alignment condition not satisfied.`;
      }
    }

    const firstItem = detailedAnalysis[0];
    const waitResponse: SignalCheckResponse = {
      pair: firstItem?.pair || 'XAUUSD',
      direction: 'WAIT',
      entry_zone: firstItem?.activeZone ? `${firstItem.activeZone.zone_low} - ${firstItem.activeZone.zone_high}` : 'Middle Range',
      sl: 0,
      tp1: 0,
      tp2: 0,
      reason: waitReason,
      ema34: firstItem?.ema34 || 0,
      ema55: firstItem?.ema55 || 0,
      current_price: firstItem?.current_price || 0,
      candle: firstItem?.candle,
      timestamp: nowIso,
      session,
      lotSize: 0.01,
      riskPercent: 1.0,
      detailedAnalysis,
    };
    latestCheckResult = waitResponse;
    return waitResponse;
  }

  generatedSignal.detailedAnalysis = detailedAnalysis;
  latestCheckResult = generatedSignal;
  return generatedSignal;
}

// 60-Second background auto-check Cron / Interval
let checkIntervalTimer: NodeJS.Timeout | null = null;
function startAutoCheckLoop() {
  if (checkIntervalTimer) {
    clearInterval(checkIntervalTimer);
  }
  checkIntervalTimer = setInterval(async () => {
    try {
      const session = getWatSession();
      if (session.isOpen) {
        await runSignalCheck();
      }
    } catch (err) {
      console.error('Error in 60s auto check loop:', err);
    }
  }, 60000);
}
startAutoCheckLoop();

// API ROUTES

// 1. Live status & session info
app.get('/api/status', (req: Request, res: Response) => {
  const session = getWatSession();
  res.json({
    session,
    lastCheckedAt: botSettings.lastCheckedAt,
    latestResult: latestCheckResult,
    totalSignals: signalHistory.length,
    zonesCount: keyZones.length,
    isSimulatedMode: !botSettings.apiKey,
  });
});

// 2. Live Quotes for the 3 pairs
app.get('/api/quotes', async (req: Request, res: Response) => {
  try {
    const quotes = await fetchQuotes(botSettings.apiKey);
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// 3. /api/check-signals endpoint - Core Route requested by user
app.get('/api/check-signals', async (req: Request, res: Response) => {
  try {
    const force = req.query.force === 'true';
    const result = await runSignalCheck({ forceSession: force });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// 4. Key Zones CRUD
app.get('/api/zones', (req: Request, res: Response) => {
  res.json(keyZones);
});

app.post('/api/zones', (req: Request, res: Response) => {
  const { pair, type, zone_low, zone_high } = req.body;
  if (!pair || !type || zone_low === undefined || zone_high === undefined) {
    return res.status(400).json({ error: 'Missing required zone fields' });
  }

  const low = parseFloat(zone_low);
  const high = parseFloat(zone_high);

  if (isNaN(low) || isNaN(high) || low >= high) {
    return res.status(400).json({ error: 'zone_low must be strictly less than zone_high and be valid numbers' });
  }

  const newZone: KeyZone = {
    id: `zone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    pair: pair as Pair,
    type: type as ZoneType,
    zone_low: low,
    zone_high: high,
    createdAt: new Date().toISOString(),
  };

  keyZones.push(newZone);
  saveJson(ZONES_FILE, keyZones);
  res.status(201).json(newZone);
});

app.delete('/api/zones/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLength = keyZones.length;
  keyZones = keyZones.filter((z) => z.id !== id);
  if (keyZones.length === initialLength) {
    return res.status(404).json({ error: 'Zone not found' });
  }
  saveJson(ZONES_FILE, keyZones);
  res.json({ success: true, message: 'Zone deleted' });
});

app.post('/api/zones/reset', (req: Request, res: Response) => {
  keyZones = [...DEFAULT_ZONES];
  saveJson(ZONES_FILE, keyZones);
  res.json({ success: true, message: 'Zones reset to defaults', zones: keyZones });
});

// 5. Signals History CRUD
app.get('/api/signals', (req: Request, res: Response) => {
  res.json(signalHistory);
});

app.delete('/api/signals/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  signalHistory = signalHistory.filter((s) => s.id !== id);
  saveJson(SIGNALS_FILE, signalHistory);
  res.json({ success: true });
});

app.delete('/api/signals', (req: Request, res: Response) => {
  signalHistory = [];
  saveJson(SIGNALS_FILE, signalHistory);
  res.json({ success: true, message: 'Signal history cleared' });
});

// 6. Settings
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({
    apiKey: botSettings.apiKey,
    hasEnvKey: Boolean(process.env.TWELVEDATA_API_KEY),
    sessionOverride: botSettings.sessionOverride,
    checkIntervalSeconds: botSettings.checkIntervalSeconds,
    isSimulatedMode: !botSettings.apiKey,
    lastCheckedAt: botSettings.lastCheckedAt,
  });
});

app.post('/api/settings', (req: Request, res: Response) => {
  const { apiKey, sessionOverride } = req.body;
  if (apiKey !== undefined) {
    botSettings.apiKey = String(apiKey).trim();
    botSettings.isSimulatedMode = !botSettings.apiKey;
  }
  if (sessionOverride !== undefined) {
    botSettings.sessionOverride = Boolean(sessionOverride);
  }
  saveJson(SETTINGS_FILE, botSettings);
  res.json(botSettings);
});

// 7. Simulation Trigger (to verify BUY, SELL, and WAIT conditions interactively)
app.post('/api/simulate-trigger', async (req: Request, res: Response) => {
  const { scenario, pair } = req.body;
  const targetPair: Pair = (pair as Pair) || 'XAUUSD';

  // First reset other pairs to neutral middle range so priority check reaches targetPair if not XAUUSD
  simState.XAUUSD = {
    price: 4118.50,
    open: 4116.20,
    high: 4120.40,
    low: 4114.80,
    close: 4118.50,
    ema34: 4119.20,
    ema55: 4122.10,
    change24h: 12.30,
    changePercent: 0.30,
  };
  simState.EURUSD = {
    price: 1.1685,
    open: 1.1678,
    high: 1.1692,
    low: 1.1672,
    close: 1.1685,
    ema34: 1.1682,
    ema55: 1.1675,
    change24h: 0.0015,
    changePercent: 0.13,
  };
  simState.BTCUSD = {
    price: 103850,
    open: 103400,
    high: 104200,
    low: 103100,
    close: 103850,
    ema34: 103600,
    ema55: 103200,
    change24h: 1450,
    changePercent: 1.41,
  };

  // Find relevant zones for targetPair
  const support = keyZones.find((z) => z.pair === targetPair && z.type === 'Support');
  const resistance = keyZones.find((z) => z.pair === targetPair && z.type === 'Resistance');

  const defaultSupportLow = targetPair === 'EURUSD' ? 1.1650 : targetPair === 'BTCUSD' ? 102000 : 4110;
  const defaultSupportHigh = targetPair === 'EURUSD' ? 1.1660 : targetPair === 'BTCUSD' ? 102500 : 4113;
  const defaultResLow = targetPair === 'EURUSD' ? 1.1700 : targetPair === 'BTCUSD' ? 105000 : 4125;
  const defaultResHigh = targetPair === 'EURUSD' ? 1.1710 : targetPair === 'BTCUSD' ? 105500 : 4128;

  const zoneLow = scenario === 'BUY'
    ? (support ? support.zone_low : defaultSupportLow)
    : (resistance ? resistance.zone_low : defaultResLow);
  const zoneHigh = scenario === 'BUY'
    ? (support ? support.zone_high : defaultSupportHigh)
    : (resistance ? resistance.zone_high : defaultResHigh);

  // Delta scale for pair
  const step = targetPair === 'EURUSD' ? 0.0003 : targetPair === 'BTCUSD' ? 100 : 0.8;

  if (scenario === 'BUY') {
    // BUY IF: low <= zone_high AND low >= zone_low AND close > zone_low AND close > open AND EMA34 > EMA55
    const candleLow = zoneLow + step * 0.4;
    const candleOpen = zoneLow + step * 0.8;
    const candleClose = zoneHigh + step * 1.2;
    const candleHigh = zoneHigh + step * 2.0;

    simState[targetPair] = {
      price: candleClose,
      open: candleOpen,
      high: candleHigh,
      low: candleLow,
      close: candleClose,
      ema34: candleClose + step,
      ema55: candleClose - step,
      change24h: step * 5,
      changePercent: 0.35,
    };
  } else if (scenario === 'SELL') {
    // SELL IF: high >= zone_low AND high <= zone_high AND close < zone_high AND close < open AND EMA34 < EMA55
    const candleHigh = zoneHigh - step * 0.4;
    const candleOpen = zoneHigh - step * 0.8;
    const candleClose = zoneLow - step * 1.2;
    const candleLow = zoneLow - step * 2.0;

    simState[targetPair] = {
      price: candleClose,
      open: candleOpen,
      high: candleHigh,
      low: candleLow,
      close: candleClose,
      ema34: candleClose - step,
      ema55: candleClose + step,
      change24h: -step * 5,
      changePercent: -0.35,
    };
  }

  // Force check with active session to execute immediately
  const result = await runSignalCheck({ forceSession: true });
  res.json({ success: true, scenario, targetPair, result });
});

// Vite Middleware Integration (Mounting Vite in dev, static files in prod)
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Arewa Critics Signal Bot server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
