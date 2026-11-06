import YahooFinance from "yahoo-finance2";
import {
  AssetQuote,
  DetailedStockQuote,
  CandlePoint,
  NewsItem,
  MarketSentiment,
  TimeRange,
} from "./types";
import { serverCache } from "./cache";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const ASSET_NAMES: Record<string, { name: string; currency: string }> = {
  "^NSEI": { name: "NIFTY 50", currency: "INR" },
  "^BSESN": { name: "S&P BSE Sensex", currency: "INR" },
  "^NSEBANK": { name: "Nifty Bank Index", currency: "INR" },
  "BTC-USD": { name: "Bitcoin", currency: "USD" },
  "ETH-USD": { name: "Ethereum", currency: "USD" },
  "SOL-USD": { name: "Solana", currency: "USD" },
  "XRP-USD": { name: "XRP", currency: "USD" },
  "^GSPC": { name: "S&P 500", currency: "USD" },
  "^IXIC": { name: "Nasdaq Composite", currency: "USD" },
  "^DJI": { name: "Dow Jones", currency: "USD" },
  "NVDA": { name: "NVIDIA Corporation", currency: "USD" },
  "MSFT": { name: "Microsoft Corporation", currency: "USD" },
  "AAPL": { name: "Apple Inc.", currency: "USD" },
  "GOOGL": { name: "Alphabet Inc.", currency: "USD" },
  "RELIANCE.NS": { name: "Reliance Industries", currency: "INR" },
  "TCS.NS": { name: "Tata Consultancy Services", currency: "INR" },
  "HDFCBANK.NS": { name: "HDFC Bank Ltd", currency: "INR" },
};

/**
 * Fetch intraday sparkline closes for a ticker (cached for 30s)
 */
async function fetchSparkline(symbol: string): Promise<number[]> {
  return serverCache.getOrSet(`sparkline-${symbol}`, 30, async () => {
    try {
      const period1 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = await yf.chart(symbol, {
        period1,
        interval: "15m",
      });

      if (result && result.quotes && result.quotes.length > 0) {
        const validCloses = result.quotes
          .map((q) => q.close)
          .filter((c): c is number => typeof c === "number" && !isNaN(c));

        return validCloses.slice(-25);
      }
    } catch (err) {
      console.error(`Error fetching sparkline for ${symbol}:`, err);
    }
    return [];
  });
}

/**
 * Retrieve Top Assets dynamically (cached for 15s)
 */
export async function getTopAssets(region: "IN" | "US" = "IN"): Promise<AssetQuote[]> {
  return serverCache.getOrSet(`top-assets-${region}`, 15, async () => {
    const symbols =
      region === "IN"
        ? ["^NSEI", "^BSESN", "^NSEBANK", "BTC-USD"]
        : ["^GSPC", "^IXIC", "^DJI", "BTC-USD"];

    try {
      const quotes = await yf.quote(symbols);
      const quotesList = Array.isArray(quotes) ? quotes : [quotes];

      const results = await Promise.all(
        quotesList.map(async (q) => {
          const symbol = q.symbol;
          const config = ASSET_NAMES[symbol] || {
            name: q.shortName || q.symbol,
            currency: q.currency || "USD",
          };

          const sparkline = await fetchSparkline(symbol);

          return {
            symbol,
            name: config.name,
            shortName: q.shortName,
            price: q.regularMarketPrice ?? 0,
            change: q.regularMarketChange ?? 0,
            changePercent: q.regularMarketChangePercent ?? 0,
            currency: config.currency,
            exchange: q.exchange,
            marketState: q.marketState,
            sparkline,
          };
        })
      );

      return results;
    } catch (error) {
      console.error("Error fetching top assets from Yahoo Finance:", error);
      return [];
    }
  });
}

/**
 * Retrieve Crypto Movements (Bitcoin, Ethereum, Solana) with sparklines
 */
export async function getCryptoAssets(): Promise<AssetQuote[]> {
  return serverCache.getOrSet("crypto-movements", 15, async () => {
    const symbols = ["BTC-USD", "ETH-USD", "SOL-USD"];
    try {
      const quotes = await yf.quote(symbols);
      const list = Array.isArray(quotes) ? quotes : [quotes];

      return await Promise.all(
        list.map(async (q) => {
          const config = ASSET_NAMES[q.symbol] || {
            name: q.shortName || q.symbol,
            currency: "USD",
          };

          const sparkline = await fetchSparkline(q.symbol);

          return {
            symbol: q.symbol,
            name: config.name,
            shortName: q.shortName,
            price: q.regularMarketPrice ?? 0,
            change: q.regularMarketChange ?? 0,
            changePercent: q.regularMarketChangePercent ?? 0,
            currency: "USD",
            exchange: "CRYPTO",
            marketState: "REGULAR",
            sparkline,
          };
        })
      );
    } catch (error) {
      console.error("Error fetching crypto assets:", error);
      return [];
    }
  });
}

/**
 * Retrieve Popular Cryptocurrencies for sidebar
 */
export async function getPopularCryptos(): Promise<AssetQuote[]> {
  return serverCache.getOrSet("popular-cryptos", 15, async () => {
    const symbols = ["BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD"];
    try {
      const quotes = await yf.quote(symbols);
      const list = Array.isArray(quotes) ? quotes : [quotes];

      return list.map((q) => {
        const config = ASSET_NAMES[q.symbol] || {
          name: q.shortName || q.symbol,
          currency: "USD",
        };

        return {
          symbol: q.symbol,
          name: config.name,
          shortName: q.symbol.replace("-USD", ""),
          price: q.regularMarketPrice ?? 0,
          change: q.regularMarketChange ?? 0,
          changePercent: q.regularMarketChangePercent ?? 0,
          currency: "USD",
          exchange: "CRYPTO",
          marketState: "REGULAR",
        };
      });
    } catch (error) {
      console.error("Error fetching popular cryptos:", error);
      return [];
    }
  });
}

/**
 * Retrieve Detailed Stock Quote & Profile Info
 */
export async function getStockDetails(symbol: string): Promise<DetailedStockQuote | null> {
  return serverCache.getOrSet(`stock-details-${symbol}`, 15, async () => {
    try {
      const quote = await yf.quote(symbol);
      if (!quote) return null;

      const profile = await serverCache.getOrSet<any>(`profile-${symbol}`, 86400, async () => {
        try {
          const summary = await yf.quoteSummary(symbol, { modules: ["assetProfile"] });
          return summary?.assetProfile || {};
        } catch {
          return {};
        }
      });

      const ceoOfficer = (profile.companyOfficers || []).find((o: any) =>
        (o.title || "").toLowerCase().includes("ceo")
      );

      let ipoDate = "";
      if (quote.firstTradeDateMilliseconds) {
        ipoDate = new Date(quote.firstTradeDateMilliseconds).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }

      const config = ASSET_NAMES[symbol];
      const name = config?.name || quote.longName || quote.shortName || quote.symbol;

      return {
        symbol: quote.symbol,
        name,
        shortName: quote.shortName,
        currency: quote.currency || "USD",
        exchange: quote.fullExchangeName || quote.exchange || "NASDAQ",
        country: profile.country || (symbol.endsWith(".NS") || symbol.endsWith(".BO") ? "India" : "United States"),
        price: quote.regularMarketPrice ?? 0,
        change: quote.regularMarketChange ?? 0,
        changePercent: quote.regularMarketChangePercent ?? 0,
        previousClose: quote.regularMarketPreviousClose ?? quote.regularMarketPrice ?? 0,
        marketState: quote.marketState || "REGULAR",

        marketCap: quote.marketCap,
        dayLow: quote.regularMarketDayLow,
        dayHigh: quote.regularMarketDayHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        trailingPE: quote.trailingPE,
        forwardPE: quote.forwardPE,
        eps: quote.epsTrailingTwelveMonths,
        dividendYield: quote.trailingAnnualDividendYield ?? quote.dividendYield,
        volume: quote.regularMarketVolume,
        averageVolume: quote.averageDailyVolume3Month,

        ceo: ceoOfficer?.name?.replace(/Mr\.\s+|Ms\.\s+/g, "").trim(),
        ipoDate,
        fullTimeEmployees: profile.fullTimeEmployees,
        sector: profile.sector,
        industry: profile.industry,
        summary: profile.longBusinessSummary,
        website: profile.website,
        analystRating: quote.averageAnalystRating,
      };
    } catch (error) {
      console.error(`Error fetching detailed stock for ${symbol}:`, error);
      return null;
    }
  });
}

/**
 * Retrieve Historical Chart Candlesticks
 */
export async function getStockChart(
  symbol: string,
  range: TimeRange = "1D"
): Promise<{ candles: CandlePoint[]; previousClose: number }> {
  const ttl = ["1D", "5D"].includes(range) ? 60 : 300;

  return serverCache.getOrSet(`chart-${symbol}-${range}`, ttl, async () => {
    try {
      let interval: "2m" | "5m" | "15m" | "1h" | "1d" | "1wk" | "1mo" = "5m";
      let period1: Date;
      const now = Date.now();

      switch (range) {
        case "1D":
          interval = "5m";
          period1 = new Date(now - 1 * 24 * 60 * 60 * 1000);
          break;
        case "5D":
          interval = "15m";
          period1 = new Date(now - 5 * 24 * 60 * 60 * 1000);
          break;
        case "1M":
          interval = "1d";
          period1 = new Date(now - 30 * 24 * 60 * 60 * 1000);
          break;
        case "6M":
          interval = "1d";
          period1 = new Date(now - 180 * 24 * 60 * 60 * 1000);
          break;
        case "YTD":
          interval = "1d";
          period1 = new Date(new Date().getFullYear(), 0, 1);
          break;
        case "1Y":
          interval = "1d";
          period1 = new Date(now - 365 * 24 * 60 * 60 * 1000);
          break;
        case "5Y":
          interval = "1wk";
          period1 = new Date(now - 5 * 365 * 24 * 60 * 60 * 1000);
          break;
        case "MAX":
        default:
          interval = "1mo";
          period1 = new Date(now - 25 * 365 * 24 * 60 * 60 * 1000);
          break;
      }

      const result = await yf.chart(symbol, { period1, interval });
      const quotes = result?.quotes || [];
      const previousClose = result?.meta?.chartPreviousClose ?? result?.meta?.previousClose ?? 0;

      const candles: CandlePoint[] = quotes
        .filter((q) => q.close !== null && q.close !== undefined && !isNaN(q.close))
        .map((q) => ({
          date: q.date ? new Date(q.date).toISOString() : new Date().toISOString(),
          timestamp: q.date ? new Date(q.date).getTime() : Date.now(),
          open: q.open ?? q.close ?? 0,
          high: q.high ?? q.close ?? 0,
          low: q.low ?? q.close ?? 0,
          close: q.close ?? 0,
          volume: q.volume ?? 0,
        }));

      return { candles, previousClose };
    } catch (error) {
      console.error(`Error fetching chart for ${symbol}:`, error);
      return { candles: [], previousClose: 0 };
    }
  });
}

/**
 * Retrieve Watchlist quotes with multi-period performance (1D, 5D, 1M, 6M)
 */
export async function getWatchlist(symbols: string[] = ["MSFT", "AAPL", "NVDA"]): Promise<AssetQuote[]> {
  const cacheKey = `watchlist-perf-${[...symbols].sort().join(",")}`;

  return serverCache.getOrSet(cacheKey, 15, async () => {
    try {
      const quotes = await yf.quote(symbols);
      const quotesList = Array.isArray(quotes) ? quotes : [quotes];

      const results = await Promise.all(
        quotesList.map(async (q) => {
          const config = ASSET_NAMES[q.symbol] || {
            name: q.shortName || q.symbol,
            currency: q.currency || "USD",
          };

          // Fetch historical 6M daily candles to compute accurate 1D, 5D, 1M, 6M returns
          const perf1D = q.regularMarketChangePercent ?? 0;
          let perf5D = 0;
          let perf1M = 0;
          let perf6M = 0;

          try {
            const period1 = new Date(Date.now() - 190 * 24 * 60 * 60 * 1000);
            const chartData = await yf.chart(q.symbol, { period1, interval: "1d" });
            const historical = (chartData.quotes || []).filter((h) => h.close !== null && !isNaN(h.close as number));

            if (historical.length >= 2) {
              const current = q.regularMarketPrice || (historical[historical.length - 1].close as number);
              const p5 = (historical[Math.max(0, historical.length - 6)]?.close as number) || current;
              const p1m = (historical[Math.max(0, historical.length - 23)]?.close as number) || current;
              const p6m = (historical[0]?.close as number) || current;

              perf5D = ((current - p5) / p5) * 100;
              perf1M = ((current - p1m) / p1m) * 100;
              perf6M = ((current - p6m) / p6m) * 100;
            }
          } catch {
            // fallback
          }

          return {
            symbol: q.symbol,
            name: config.name,
            shortName: q.shortName,
            price: q.regularMarketPrice ?? 0,
            change: q.regularMarketChange ?? 0,
            changePercent: q.regularMarketChangePercent ?? 0,
            currency: config.currency,
            exchange: q.fullExchangeName || q.exchange,
            marketState: q.marketState,
            perf1D,
            perf5D,
            perf1M,
            perf6M,
          };
        })
      );

      return results;
    } catch (error) {
      console.error("Error fetching watchlist from Yahoo Finance:", error);
      return [];
    }
  });
}

/**
 * Retrieve Live Market News dynamically
 */
export async function getMarketNews(category: "IN" | "US" | "CRYPTO" = "IN"): Promise<NewsItem[]> {
  return serverCache.getOrSet(`news-${category}`, 120, async () => {
    try {
      const queries =
        category === "CRYPTO"
          ? ["Bitcoin crypto", "Ethereum crypto"]
          : category === "IN"
          ? ["NIFTY", "Sensex"]
          : ["S&P 500", "Nasdaq"];

      const searchPromises = queries.map((q) =>
        yf.search(q, { newsCount: 6 }).catch(() => ({ news: [] }))
      );

      const results = await Promise.all(searchPromises);
      const combinedNews = results.flatMap((r) => r.news || []);

      const uniqueMap = new Map<string, any>();
      for (const item of combinedNews) {
        const key = item.uuid || item.title;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item);
        }
      }

      const uniqueItems = Array.from(uniqueMap.values());

      return uniqueItems.map((item) => ({
        id: item.uuid || Math.random().toString(),
        title: item.title,
        publisher: item.publisher || "Finance News",
        link: item.link,
        publishedAt: item.providerPublishTime
          ? new Date(item.providerPublishTime).toISOString()
          : new Date().toISOString(),
        summary:
          item.relatedTickers && item.relatedTickers.length > 0
            ? `Key market developments impacting ${item.relatedTickers.join(", ")} and macroeconomic sentiment across markets.`
            : undefined,
      }));
    } catch (error) {
      console.error("Error fetching news from Yahoo Finance:", error);
      return [];
    }
  });
}

/**
 * Determine dynamic market sentiment and hours from live quotes (cached for 30s)
 */
export async function getMarketStatus(): Promise<MarketSentiment> {
  return serverCache.getOrSet("market-status", 30, async () => {
    let avgChange = 0;
    try {
      const indices = await yf.quote(["^NSEI", "^BSESN"]);
      const list = Array.isArray(indices) ? indices : [indices];
      const changes = list.map((i) => i.regularMarketChangePercent || 0);
      avgChange = changes.reduce((a, b) => a + b, 0) / (changes.length || 1);
    } catch (e) {
      console.error("Error determining market status:", e);
    }

    const now = new Date();
    const istFormatter = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const istTimeStr = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
      weekday: "short",
    }).format(now);

    const [day, time] = istTimeStr.split(" ");
    const [hours, mins] = (time || "0:0").split(":").map(Number);
    const totalMins = hours * 60 + mins;
    const isWeekday = !["Sat", "Sun"].includes(day);
    const isMarketOpen = isWeekday && totalMins >= 555 && totalMins <= 930;

    const status: MarketSentiment["status"] =
      avgChange > 0.5 ? "Upbeat" : avgChange < -0.5 ? "Bearish" : "Neutral";

    return {
      status,
      score: Math.min(10, Math.max(1, Math.round(5 + avgChange * 2))),
      description: avgChange >= 0 ? "Upbeat Sentiment" : "Cautious Sentiment",
      marketOpen: isMarketOpen,
      marketTimeIST: `${istFormatter.format(now)}, IST`,
    };
  });
}

/**
 * Search tickers dynamically (cached for 10 mins)
 */
export async function searchSymbols(query: string) {
  const normalized = query.trim().toUpperCase();
  return serverCache.getOrSet(`search-${normalized}`, 600, async () => {
    try {
      const res = await yf.search(query, { quotesCount: 8, newsCount: 0 });
      return res.quotes || [];
    } catch (error) {
      console.error("Error searching symbols:", error);
      return [];
    }
  });
}

/**
 * Retrieve Trending & Recommended Assets for Search Dropdown dynamically from Yahoo Finance
 */
export async function getTrendingSearchAssets() {
  return serverCache.getOrSet("trending-search-recommendations", 60, async () => {
    try {
      // Real trending stock symbols modeled on Perplexity Finance recommendation dropdown
      const trendingSymbols = ["TITN", "HCI", "TPCS", "GDYN", "NVDA"];
      const quotes = await yf.quote(trendingSymbols);
      const list = Array.isArray(quotes) ? quotes : [quotes];

      const trending = list.map((q) => ({
        symbol: q.symbol,
        name: q.longName || q.shortName || q.symbol,
        exchange: (q.fullExchangeName || q.exchange || "NASDAQ").replace("NASDAQGS", "NASDAQ").replace("NSI", "NSE"),
        currency: q.currency || "USD",
        price: q.regularMarketPrice ?? 0,
        change: q.regularMarketChange ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0,
        country: "US",
      }));

      const recent = [
        { symbol: "GOOG", name: "Alphabet Inc. GOOG" },
        { symbol: "AAPL", name: "Apple Inc. AAPL" },
        { symbol: "NVDA", name: "NVIDIA Corporation NVDA" },
        { symbol: "BTC-USD", name: "Bitcoin BTC" },
      ];

      return { recent, trending };
    } catch (error) {
      console.error("Error fetching trending search assets:", error);
      return {
        recent: [
          { symbol: "GOOG", name: "Alphabet Inc. GOOG" },
          { symbol: "AAPL", name: "Apple Inc. AAPL" },
          { symbol: "NVDA", name: "NVIDIA Corporation NVDA" },
          { symbol: "BTC-USD", name: "Bitcoin BTC" },
        ],
        trending: [],
      };
    }
  });
}
