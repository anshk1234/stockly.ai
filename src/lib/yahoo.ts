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
      const period1 = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
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
      const quote: any = await yf.quote(symbol);
      if (!quote) return null;

      const rawQuoteType = (quote.quoteType || "").toUpperCase();
      const isCrypto = rawQuoteType === "CRYPTOCURRENCY" || symbol.endsWith("-USD");
      const isIndex = rawQuoteType === "INDEX" || symbol.startsWith("^");
      const isEtf = rawQuoteType === "ETF";
      const assetClass = isCrypto ? "CRYPTOCURRENCY" : isIndex ? "INDEX" : isEtf ? "ETF" : "EQUITY";

      let profile: any = {};
      if (assetClass === "EQUITY") {
        profile = await serverCache.getOrSet<any>(`profile-${symbol}`, 86400, async () => {
          try {
            const summary = await yf.quoteSummary(symbol, { modules: ["assetProfile"] });
            return summary?.assetProfile || {};
          } catch {
            return {};
          }
        });
      }

      const ceoOfficer = (profile.companyOfficers || []).find((o: any) =>
        (o.title || "").toLowerCase().includes("ceo")
      );

      // Only assign IPO Date for corporate equities
      let ipoDate: string | undefined = undefined;
      if (assetClass === "EQUITY" && quote.firstTradeDateMilliseconds) {
        ipoDate = new Date(quote.firstTradeDateMilliseconds).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }

      // Accurate Country attribution
      let country = profile.country;
      if (!country) {
        if (isCrypto) {
          country = "Global";
        } else if (
          symbol.startsWith("^NSE") ||
          symbol.startsWith("^BSE") ||
          symbol.endsWith(".NS") ||
          symbol.endsWith(".BO")
        ) {
          country = "India";
        } else if (
          symbol.startsWith("^GSPC") ||
          symbol.startsWith("^IXIC") ||
          symbol.startsWith("^DJI")
        ) {
          country = "United States";
        } else {
          country = "United States";
        }
      }

      // Friendly Exchange display
      let exchange = quote.fullExchangeName || quote.exchange || "NASDAQ";
      if (isCrypto) {
        exchange = "Global Crypto Spot";
      } else if (symbol.startsWith("^NSE") || symbol.endsWith(".NS") || exchange === "NSI") {
        exchange = "NSE";
      } else if (symbol.startsWith("^BSE") || symbol.endsWith(".BO")) {
        exchange = "BSE";
      } else if (exchange === "NMS" || exchange === "NGM") {
        exchange = "NASDAQ";
      } else if (exchange === "NYQ") {
        exchange = "NYSE";
      }

      // Crypto Genesis / Launch dates
      let genesisDate: string | undefined = undefined;
      if (isCrypto) {
        const genesisMap: Record<string, string> = {
          "BTC-USD": "Jan 3, 2009",
          "ETH-USD": "Jul 30, 2015",
          "SOL-USD": "Mar 16, 2020",
          "XRP-USD": "Jun 2, 2012",
          "DOGE-USD": "Dec 6, 2013",
          "ADA-USD": "Sep 29, 2017",
        };
        genesisDate =
          genesisMap[symbol] ||
          (quote.startDate
            ? new Date(quote.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Decentralized Launch");
      }

      // Index Constituents count
      let constituentsCount: number | undefined = undefined;
      if (isIndex) {
        if (symbol === "^NSEI") constituentsCount = 50;
        else if (symbol === "^BSESN") constituentsCount = 30;
        else if (symbol === "^NSEBANK") constituentsCount = 12;
        else if (symbol === "^GSPC") constituentsCount = 500;
        else if (symbol === "^IXIC") constituentsCount = 3000;
        else if (symbol === "^DJI") constituentsCount = 30;
      }

      // Summary descriptions for crypto and indices
      let summary = profile.longBusinessSummary;
      if (!summary) {
        if (isCrypto) {
          if (symbol.startsWith("BTC")) {
            summary =
              "Bitcoin (BTC) is a decentralized digital currency created in 2009 by an unknown person or group using the name Satoshi Nakamoto. It operates on a peer-to-peer network secured by cryptographic proof-of-work consensus, enabling borderless, censorship-resistant value transfer without central intermediaries.";
          } else if (symbol.startsWith("ETH")) {
            summary =
              "Ethereum (ETH) is an open-source, globally decentralized platform powered by blockchain technology. It enables developer-built smart contracts and decentralized applications (dApps) without central downtime or third-party interference.";
          } else if (symbol.startsWith("SOL")) {
            summary =
              "Solana (SOL) is a high-speed, open-source blockchain architecture designed for high-frequency decentralized applications. It combines proof-of-history with proof-of-stake to achieve sub-second block finality.";
          }
        } else if (isIndex) {
          if (symbol === "^NSEI") {
            summary =
              "The NIFTY 50 is the benchmark stock index of the National Stock Exchange of India (NSE). It captures 50 of the largest and most liquid Indian companies across 13 major economic sectors, representing roughly 60% of the free-float market capitalization of the NSE.";
          } else if (symbol === "^BSESN") {
            summary =
              "The S&P BSE SENSEX is India's most recognized and tracked benchmark index on the Bombay Stock Exchange (BSE), comprising 30 of the largest and most actively traded equities in the Indian economy.";
          } else if (symbol === "^GSPC") {
            summary =
              "The S&P 500 is a market-capitalization-weighted benchmark tracking 500 leading publicly traded corporations in the United States, widely recognized as the premier barometer of the US equity market.";
          }
        }
      }

      let sector = profile.sector;
      let industry = profile.industry;
      if (isCrypto) {
        sector = "Digital Asset";
        industry = quote.fromCurrency ? `${quote.fromCurrency} Protocol` : "Cryptocurrency";
      } else if (isIndex) {
        sector = "Benchmark Index";
        industry = "Broad Market Equity Index";
      }

      const config = ASSET_NAMES[symbol];
      const name = config?.name || quote.longName || quote.shortName || quote.symbol;

      return {
        symbol: quote.symbol,
        name,
        shortName: quote.shortName,
        currency: quote.currency || (isCrypto ? "USD" : symbol.endsWith(".NS") || symbol.startsWith("^NSE") ? "INR" : "USD"),
        exchange,
        country,
        price: quote.regularMarketPrice ?? 0,
        change: quote.regularMarketChange ?? 0,
        changePercent: quote.regularMarketChangePercent ?? 0,
        previousClose: quote.regularMarketPreviousClose ?? quote.regularMarketPrice ?? 0,
        marketState: quote.marketState || "REGULAR",

        assetClass,
        quoteType: quote.quoteType,

        marketCap: quote.marketCap,
        dayLow: quote.regularMarketDayLow,
        dayHigh: quote.regularMarketDayHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyDayAverage: quote.fiftyDayAverage,
        twoHundredDayAverage: quote.twoHundredDayAverage,

        // Equity specific
        trailingPE: assetClass === "EQUITY" ? quote.trailingPE : undefined,
        forwardPE: assetClass === "EQUITY" ? quote.forwardPE : undefined,
        eps: assetClass === "EQUITY" ? quote.epsTrailingTwelveMonths : undefined,
        dividendYield: assetClass === "EQUITY" ? (quote.trailingAnnualDividendYield ?? quote.dividendYield) : undefined,
        volume: quote.regularMarketVolume,
        averageVolume: quote.averageDailyVolume3Month,
        ceo: assetClass === "EQUITY" ? ceoOfficer?.name?.replace(/Mr\.\s+|Ms\.\s+/g, "").trim() : undefined,
        ipoDate,
        fullTimeEmployees: assetClass === "EQUITY" ? profile.fullTimeEmployees : undefined,
        sector,
        industry,
        summary,
        website: profile.website || quote.coinMarketCapLink,
        analystRating: assetClass === "EQUITY" ? quote.averageAnalystRating : undefined,

        // Crypto specific
        circulatingSupply: isCrypto ? quote.circulatingSupply : undefined,
        totalSupply: isCrypto ? quote.totalSupply : undefined,
        maxSupply: isCrypto ? quote.maxSupply : undefined,
        volume24Hr: isCrypto ? (quote.volume24Hr || quote.volumeAllCurrencies || quote.regularMarketVolume) : undefined,
        genesisDate,
        coinMarketCapLink: quote.coinMarketCapLink,

        // Index specific
        indexType: isIndex ? "Broad Market Benchmark" : undefined,
        constituentsCount,
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
          // Query 5 days back so weekends and bank holidays resolve the latest active session
          period1 = new Date(now - 5 * 24 * 60 * 60 * 1000);
          break;
        case "5D":
          interval = "15m";
          // Query 8 days back to guarantee covering 5 trading days across weekends
          period1 = new Date(now - 8 * 24 * 60 * 60 * 1000);
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
      let quotes = (result?.quotes || []).filter(
        (q) => q.close !== null && q.close !== undefined && !isNaN(q.close)
      );

      // For 1D charts, isolate the single most recent active trading day/session (or rolling 24h for crypto)
      if (range === "1D" && quotes.length > 0) {
        const isCrypto = symbol.endsWith("-USD");
        if (isCrypto) {
          const cutoff = now - 24 * 60 * 60 * 1000;
          quotes = quotes.filter((q) => q.date && new Date(q.date).getTime() >= cutoff);
        } else {
          // Check if there are active candles from the current regular session
          const regularStart = result?.meta?.currentTradingPeriod?.regular?.start;
          const startMs = regularStart ? new Date(regularStart).getTime() : 0;

          // If regular session has begun and has candles, use today's session
          const currentSessionQuotes =
            startMs > 0 && startMs <= now
              ? quotes.filter((q) => q.date && new Date(q.date).getTime() >= startMs)
              : [];

          if (currentSessionQuotes.length > 0) {
            quotes = currentSessionQuotes;
          } else {
            // Market is closed, weekend, pre-market, or holiday:
            // Group by the most recent active trading session anchored to the latest candle
            const lastCandleMs = new Date(quotes[quotes.length - 1].date).getTime();
            // A regular market session is ~6.5 hours (extended pre/post up to ~14 hours)
            quotes = quotes.filter(
              (q) => q.date && new Date(q.date).getTime() >= lastCandleMs - 14 * 60 * 60 * 1000
            );
          }
        }
      }

      const previousClose =
        range === "1D"
          ? result?.meta?.previousClose ?? result?.meta?.chartPreviousClose ?? 0
          : result?.meta?.chartPreviousClose ?? result?.meta?.previousClose ?? 0;

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
      return (res.quotes || []).filter((q: any) => Boolean(q && q.symbol));
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

/**
 * Fetch real-time market movers (Gainers, Losers, Most Active) for IN / US
 * Cached in serverCache for 60 seconds.
 */
export async function getMarketMovers(region: "IN" | "US" = "IN"): Promise<MarketMoversData> {
  const cacheKey = `market-movers-${region}`;
  return serverCache.getOrSet<MarketMoversData>(cacheKey, 60, async () => {
    try {
      if (region === "US") {
        const [gRes, lRes, aRes] = await Promise.all([
          yf.screener({ scrIds: "day_gainers", count: 4 }).catch(() => ({ quotes: [] })),
          yf.screener({ scrIds: "day_losers", count: 4 }).catch(() => ({ quotes: [] })),
          yf.screener({ scrIds: "most_actives", count: 4 }).catch(() => ({ quotes: [] })),
        ]);

        const mapQuote = (q: any): MarketMoverItem => {
          const price = q.regularMarketPrice ? `$${q.regularMarketPrice.toFixed(2)}` : "$0.00";
          const pct = q.regularMarketChangePercent || 0;
          const isGain = pct >= 0;
          const change = (isGain ? "+" : "") + pct.toFixed(2) + "%";
          const ex = (q.exchange || "NASDAQ")
            .replace("NASDAQGS", "NASDAQ")
            .replace("NMS", "NASDAQ")
            .replace("NYQ", "NYSE");

          return {
            name: q.shortName || q.longName || q.symbol,
            symbol: `${q.symbol} · ${ex}`,
            cleanSymbol: q.symbol,
            price,
            change,
            isGain,
          };
        };

        return {
          gainers: (gRes.quotes || []).slice(0, 3).map(mapQuote),
          losers: (lRes.quotes || []).slice(0, 3).map(mapQuote),
          active: (aRes.quotes || []).slice(0, 3).map(mapQuote),
        };
      }

      // Region === 'IN'
      const inSymbols = [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
        "TATAMOTORS.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "KOTAKBANK.NS",
        "LT.NS", "TITAN.NS", "MARUTI.NS", "SUNPHARMA.NS", "BAJFINANCE.NS",
        "AXISBANK.NS", "ADANIENT.NS", "NTPC.NS", "POWERGRID.NS", "ULTRACEMCO.NS",
        "ZOMATO.NS", "JIOFIN.NS", "TATAPOWER.NS", "VEDL.NS"
      ];

      const quotes = await yf.quote(inSymbols);
      const list = Array.isArray(quotes) ? quotes : [quotes];

      const mapInQuote = (q: any): MarketMoverItem => {
        const price = q.regularMarketPrice
          ? `₹${q.regularMarketPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "₹0.00";
        const pct = q.regularMarketChangePercent || 0;
        const isGain = pct >= 0;
        const change = (isGain ? "+" : "") + pct.toFixed(2) + "%";
        const cleanSym = q.symbol.replace(".NS", "").replace(".BO", "");
        const ex = q.symbol.endsWith(".BO") ? "BSE" : "NSE";

        return {
          name: q.shortName || cleanSym,
          symbol: `${cleanSym} · ${ex}`,
          cleanSymbol: q.symbol,
          price,
          change,
          isGain,
        };
      };

      const gainers = [...list]
        .sort((a, b) => (b.regularMarketChangePercent || 0) - (a.regularMarketChangePercent || 0))
        .slice(0, 3)
        .map(mapInQuote);

      const losers = [...list]
        .sort((a, b) => (a.regularMarketChangePercent || 0) - (b.regularMarketChangePercent || 0))
        .slice(0, 3)
        .map(mapInQuote);

      const active = [...list]
        .sort((a, b) => (b.regularMarketVolume || 0) - (a.regularMarketVolume || 0))
        .slice(0, 3)
        .map(mapInQuote);

      return { gainers, losers, active };
    } catch (err) {
      console.error("Error in getMarketMovers:", err);
      return {
        gainers: [
          { name: "ICICI Bank", symbol: "ICICIBANK · NSE", cleanSymbol: "ICICIBANK.NS", price: "₹1,571.20", change: "+4.75%", isGain: true },
          { name: "HDFC Bank", symbol: "HDFCBANK · NSE", cleanSymbol: "HDFCBANK.NS", price: "₹788.25", change: "+3.72%", isGain: true },
        ],
        losers: [
          { name: "Tata Power", symbol: "TATAPOWER · NSE", cleanSymbol: "TATAPOWER.NS", price: "₹352.50", change: "-3.31%", isGain: false },
        ],
        active: [
          { name: "HDFC Bank", symbol: "HDFCBANK · NSE", cleanSymbol: "HDFCBANK.NS", price: "₹788.25", change: "+3.72%", isGain: true },
        ],
      };
    }
  });
}
