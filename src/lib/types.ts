export interface AssetQuote {
  symbol: string;
  name: string;
  shortName?: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  exchange?: string;
  marketState?: string;
  sparkline?: number[];
  // Multi-period performance for watchlist
  perf1D?: number;
  perf5D?: number;
  perf1M?: number;
  perf6M?: number;
}

export type AssetClass = "EQUITY" | "CRYPTOCURRENCY" | "INDEX" | "ETF";

export interface DetailedStockQuote {
  symbol: string;
  name: string;
  shortName?: string;
  currency: string;
  exchange: string;
  country?: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  marketState: string;

  assetClass?: AssetClass;
  quoteType?: string;

  marketCap?: number;
  dayLow?: number;
  dayHigh?: number;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;

  // Equity specific
  trailingPE?: number;
  forwardPE?: number;
  eps?: number;
  dividendYield?: number;
  volume?: number;
  averageVolume?: number;

  ceo?: string;
  ipoDate?: string;
  fullTimeEmployees?: number;
  sector?: string;
  industry?: string;
  summary?: string;
  website?: string;
  analystRating?: string;
  analystConsensus?: AnalystConsensusData;

  // Crypto specific
  circulatingSupply?: number;
  totalSupply?: number;
  maxSupply?: number;
  volume24Hr?: number;
  coinMarketCapLink?: string;
  genesisDate?: string;

  // Index specific
  indexType?: string;
  constituentsCount?: number;
}

export interface AnalystConsensusData {
  recommendationKey?: string;
  recommendationRating: string;
  totalAnalysts: number;
  bearishCount: number;
  neutralCount: number;
  bullishCount: number;
  targetLow?: number;
  targetHigh?: number;
  targetMean?: number;
  targetMedian?: number;
  currentPrice?: number;
  currency?: string;
}

export interface AnalystRecommendationRow {
  id: string;
  firm: string;
  analyst: string;
  toGrade: string;
  fromGrade?: string;
  action?: string;
  priceTargetAction?: string;
  currentPriceTarget?: number;
  priorPriceTarget?: number;
  upside?: number;
  date: string;
}

export interface StockAnalysisData {
  symbol: string;
  name: string;
  currency: string;
  currentPrice: number;
  consensus: {
    recommendationKey: string;
    recommendationRating: string;
    totalAnalysts: number;
    bullishCount: number;
    neutralCount: number;
    bearishCount: number;
    bullishPct: number;
    neutralPct: number;
    bearishPct: number;
  };
  targets: {
    low?: number;
    high?: number;
    mean?: number;
    median?: number;
    currentPrice?: number;
    currency?: string;
  };
  history: AnalystRecommendationRow[];
  synthesis: {
    overview: string;
    rangeAnalysis: string;
    recentChanges: string;
    sentimentContext: string;
  };
}

export interface CandlePoint {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  id: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
  summary?: string;
}

export interface MarketSentiment {
  status: "Bullish" | "Bearish" | "Neutral" | "Upbeat";
  score: number;
  description: string;
  marketOpen: boolean;
  marketTimeIST: string;
}

export interface SearchResult {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  quoteType?: string;
}

export interface TrendingSearchAsset {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  country?: string;
}

export interface SearchRecommendationData {
  recent: { symbol: string; name: string }[];
  trending: TrendingSearchAsset[];
}

export type TimeRange = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX";

export type AssetCategory = "IN" | "US" | "EUROPE" | "ASIA" | "CURRENCIES" | "CRYPTO" | "FUTURES";

export type DashboardTab = "Markets" | "Crypto" | "Predictions" | "Watchlist";

export interface MarketMoverItem {
  name: string;
  symbol: string;
  cleanSymbol: string;
  price: string;
  change: string;
  isGain: boolean;
}

export interface MarketMoversData {
  gainers: MarketMoverItem[];
  losers: MarketMoverItem[];
  active: MarketMoverItem[];
}

export interface DiscoverStory {
  id: string;
  title: string;
  link: string;
  imageUrl: string;
  publisher: string;
  publishedAt?: string;
  sourcesCount: number;
  sourceDomains: string[];
}

export interface EnrichedAlert {
  id: string;
  symbol: string;
  name: string;
  criteria: "TARGET_PRICE" | "MOVEMENT_AMOUNT";
  targetPrice?: number;
  movementPct?: number;
  channels: string[];
  status: "ACTIVE" | "TRIGGERED" | "DISMISSED";
  triggeredAt?: number | null;
  createdAt: number;
  currentPrice: number;
  change: number;
  changePercent: number;
  currency: string;
  distancePercent: number;
  additionalInstructions?: string;
}

export interface MovementSource {
  title: string;
  publisher: string;
  link: string;
  favicon?: string;
}

export interface MovementNode {
  date: string; // e.g. "Nov 20" or "Nov 21, 4:49 AM ET"
  isStatusNode?: boolean;
  statusText?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  afterHoursPrice?: number;
  afterHoursChangePercent?: number;
  currency?: string;
  narrative?: string;
  sources: MovementSource[];
  sourceCount: number;
}

export interface NotablePriceMovementData {
  symbol: string;
  marketStatus: "OPEN" | "CLOSED";
  marketStatusText: string;
  movements: MovementNode[];
}

