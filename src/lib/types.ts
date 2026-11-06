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

  marketCap?: number;
  dayLow?: number;
  dayHigh?: number;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
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

export type TimeRange = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX";

export type DashboardTab = "Markets" | "Crypto" | "Predictions" | "Watchlist";
