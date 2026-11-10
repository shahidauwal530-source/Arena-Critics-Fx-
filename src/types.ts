export type Pair = 'XAUUSD' | 'EURUSD' | 'BTCUSD';
export type ApiSymbol = 'XAU/USD' | 'EUR/USD' | 'BTC/USD';
export type ZoneType = 'Support' | 'Resistance';
export type SignalDirection = 'BUY' | 'SELL' | 'WAIT';

export interface KeyZone {
  id: string;
  pair: Pair;
  type: ZoneType;
  zone_low: number;
  zone_high: number;
  createdAt: string;
}

export interface CandleM15 {
  datetime?: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface PairQuote {
  pair: Pair;
  symbol: ApiSymbol;
  price: number;
  high24h: number;
  low24h: number;
  change24h: number;
  changePercent24h: number;
  timestamp: string;
}

export interface MarketAnalysis {
  pair: Pair;
  symbol: ApiSymbol;
  current_price: number;
  candle: CandleM15;
  ema34: number;
  ema55: number;
  activeZone: KeyZone | null;
  zoneRelation: 'IN_SUPPORT' | 'IN_RESISTANCE' | 'BETWEEN_ZONES' | 'ABOVE_ALL' | 'BELOW_ALL';
  bullishRejection: boolean;
  bearishRejection: boolean;
  emaCondition: 'BULLISH' | 'BEARISH' | 'FLAT';
}

export interface SignalRecord {
  id: string;
  pair: Pair;
  direction: SignalDirection;
  entry_zone: string;
  sl: number;
  tp1: number;
  tp2: number;
  reason: string;
  ema34: number;
  ema55: number;
  current_price: number;
  candle?: CandleM15;
  timestamp: string;
  session: string;
  lotSize: number;
  riskPercent: number;
}

export interface SessionInfo {
  status: 'LONDON' | 'NEW_YORK' | 'CLOSED';
  sessionName: string;
  isOpen: boolean;
  timeWAT: string;
  isOverride: boolean;
}

export interface SignalCheckResponse {
  pair: Pair | 'ALL';
  direction: SignalDirection;
  entry_zone: string;
  sl: number;
  tp1: number;
  tp2: number;
  reason: string;
  ema34: number;
  ema55: number;
  current_price: number;
  candle?: CandleM15;
  timestamp: string;
  session: SessionInfo;
  lotSize: number;
  riskPercent: number;
  detailedAnalysis?: MarketAnalysis[];
}

export interface BotSettings {
  apiKey: string;
  hasEnvKey: boolean;
  sessionOverride: boolean;
  checkIntervalSeconds: number;
  isSimulatedMode: boolean;
  lastCheckedAt: string | null;
}
