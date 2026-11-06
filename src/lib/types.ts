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
}

export interface SparklinePoint {
  date: string;
  close: number;
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
  status: 'Bullish' | 'Bearish' | 'Neutral' | 'Upbeat';
  score: number; // 0 to 10
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
