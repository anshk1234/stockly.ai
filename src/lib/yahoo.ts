import YahooFinance from "yahoo-finance2";
import { AssetQuote, NewsItem, MarketSentiment } from "./types";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const ASSET_NAMES: Record<string, { name: string; currency: string }> = {
  "^NSEI": { name: "NIFTY 50", currency: "INR" },
  "^BSESN": { name: "S&P BSE Sensex", currency: "INR" },
  "^NSEBANK": { name: "Nifty Bank Index", currency: "INR" },
  "BTC-USD": { name: "Bitcoin", currency: "USD" },
  "^GSPC": { name: "S&P 500", currency: "USD" },
  "^IXIC": { name: "Nasdaq Composite", currency: "USD" },
  "^DJI": { name: "Dow Jones", currency: "USD" },
  "MSFT": { name: "Microsoft Corporation", currency: "USD" },
  "AAPL": { name: "Apple Inc.", currency: "USD" },
  "NVDA": { name: "NVIDIA Corporation", currency: "USD" },
  "GOOGL": { name: "Alphabet Inc.", currency: "USD" },
  "RELIANCE.NS": { name: "Reliance Industries", currency: "INR" },
  "TCS.NS": { name: "Tata Consultancy Services", currency: "INR" },
  "HDFCBANK.NS": { name: "HDFC Bank Ltd", currency: "INR" },
};

/**
 * Fetch intraday sparkline closes for a ticker
 */
async function fetchSparkline(symbol: string): Promise<number[]> {
  try {
    const period1 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const result = await yf.chart(symbol, {
      period1,
      interval: "15m",
    });

    if (result && result.quotes && result.quotes.length > 0) {
      // Filter valid numbers and take the last 25-30 data points for a smooth sparkline
      const validCloses = result.quotes
        .map((q) => q.close)
        .filter((c): c is number => typeof c === "number" && !isNaN(c));

      return validCloses.slice(-25);
    }
  } catch (err) {
    console.error(`Error fetching sparkline for ${symbol}:`, err);
  }
  return [];
}

/**
 * Retrieve Top Assets dynamically with real-time quotes & sparklines
 */
export async function getTopAssets(region: "IN" | "US" = "IN"): Promise<AssetQuote[]> {
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
}

/**
 * Retrieve Watchlist quotes dynamically
 */
export async function getWatchlist(symbols: string[] = ["MSFT", "AAPL", "NVDA"]): Promise<AssetQuote[]> {
  try {
    const quotes = await yf.quote(symbols);
    const quotesList = Array.isArray(quotes) ? quotes : [quotes];

    return quotesList.map((q) => {
      const config = ASSET_NAMES[q.symbol] || {
        name: q.shortName || q.symbol,
        currency: q.currency || "USD",
      };

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
      };
    });
  } catch (error) {
    console.error("Error fetching watchlist from Yahoo Finance:", error);
    return [];
  }
}

/**
 * Retrieve Live Market News dynamically
 */
export async function getMarketNews(region: "IN" | "US" = "IN"): Promise<NewsItem[]> {
  try {
    const queries = region === "IN" ? ["NIFTY", "Sensex"] : ["S&P 500", "Nasdaq"];

    const searchPromises = queries.map((q) =>
      yf.search(q, { newsCount: 6 }).catch(() => ({ news: [] }))
    );

    const results = await Promise.all(searchPromises);
    const combinedNews = results.flatMap((r) => r.news || []);

    // Deduplicate by UUID or title
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
          ? `Key market developments impacting ${item.relatedTickers.join(", ")} and macroeconomic sentiment across benchmark indices.`
          : undefined,
    }));
  } catch (error) {
    console.error("Error fetching news from Yahoo Finance:", error);
    return [];
  }
}

/**
 * Determine dynamic market sentiment and hours from live quotes
 */
export async function getMarketStatus(): Promise<MarketSentiment> {
  let avgChange = 0;
  try {
    const indices = await yf.quote(["^NSEI", "^BSESN"]);
    const list = Array.isArray(indices) ? indices : [indices];
    const changes = list.map((i) => i.regularMarketChangePercent || 0);
    avgChange = changes.reduce((a, b) => a + b, 0) / (changes.length || 1);
  } catch (e) {
    console.error("Error determining market status:", e);
  }

  // Calculate IST Time
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

  // Check if NSE is open (Mon-Fri, 9:15 AM to 3:30 PM IST)
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
  const isMarketOpen = isWeekday && totalMins >= 555 && totalMins <= 930; // 9:15 to 15:30

  const status: MarketSentiment["status"] =
    avgChange > 0.5 ? "Upbeat" : avgChange < -0.5 ? "Bearish" : "Neutral";

  return {
    status,
    score: Math.min(10, Math.max(1, Math.round(5 + avgChange * 2))),
    description: avgChange >= 0 ? "Upbeat Sentiment" : "Cautious Sentiment",
    marketOpen: isMarketOpen,
    marketTimeIST: `${istFormatter.format(now)}, IST`,
  };
}

/**
 * Search tickers dynamically
 */
export async function searchSymbols(query: string) {
  try {
    const res = await yf.search(query, { quotesCount: 8, newsCount: 0 });
    return res.quotes || [];
  } catch (error) {
    console.error("Error searching symbols:", error);
    return [];
  }
}
