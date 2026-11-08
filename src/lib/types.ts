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

