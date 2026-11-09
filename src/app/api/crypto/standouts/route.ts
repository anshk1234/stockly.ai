import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export interface CryptoStandoutChartPoint {
  time: number;
  value: number;
}

export interface CryptoStandoutItem {
  symbol: string;
  ticker: string;
  displaySymbol: string;
  name: string;
  category: string;
  price: number;
  formattedPrice: string;
  changePercent: number;
  baselinePrice: number;
  formattedBaseline: string;
  volume: number;
  formattedVolume: string;
  marketCap: number;
  formattedMarketCap: string;
  peRatio: string;
  dividendYield: string;
  catalyst: string;
  chart: {
    points: CryptoStandoutChartPoint[];
    min: number;
    max: number;
    baselineYPercent: number; // 0 to 100% position on SVG Y-axis
    timeLabels: { label: string; xPercent: number }[];
  };
}

// Coinbase 50 Index major constituent candidates
const COINBASE_50_POOL: { symbol: string; ticker: string; name: string }[] = [
  { symbol: "VET-USD", ticker: "VET", name: "VeChain USD" },
  { symbol: "AAVE-USD", ticker: "AAVE", name: "Aave USD" },
  { symbol: "LINK-USD", ticker: "LINK", name: "Chainlink USD" },
  { symbol: "NEAR-USD", ticker: "NEAR", name: "NEAR Protocol USD" },
  { symbol: "SUI-USD", ticker: "SUI", name: "Sui USD" },
  { symbol: "SOL-USD", ticker: "SOL", name: "Solana USD" },
  { symbol: "AVAX-USD", ticker: "AVAX", name: "Avalanche USD" },
  { symbol: "RENDER-USD", ticker: "RENDER", name: "Render USD" },
  { symbol: "INJ-USD", ticker: "INJ", name: "Injective USD" },
  { symbol: "UNI-USD", ticker: "UNI", name: "Uniswap USD" },
  { symbol: "FET-USD", ticker: "FET", name: "Fetch.ai USD" },
  { symbol: "DOT-USD", ticker: "DOT", name: "Polkadot USD" },
  { symbol: "ALGO-USD", ticker: "ALGO", name: "Algorand USD" },
  { symbol: "ATOM-USD", ticker: "ATOM", name: "Cosmos USD" },
];

function formatCompact(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num) || num === 0) return "N/A";
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

export function formatCryptoPrice(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (price >= 1) {
    return `$${price.toFixed(2)}`;
  }
  if (price >= 0.01) {
    return `$${price.toFixed(4)}`;
  }
  return `$${price.toFixed(6)}`;
}

function generateCatalyst(
  name: string,
  ticker: string,
  changePercent: number,
  volumeFormatted: string,
  baselinePrice: number
): string {
  const isUp = changePercent >= 0;
  const absChange = Math.abs(changePercent).toFixed(2);
  const baselineStr = baselinePrice < 1 ? baselinePrice.toFixed(4) : baselinePrice.toFixed(2);

  if (isUp) {
    if (changePercent > 4) {
      return `${name} (${ticker}) surged +${absChange}% over the past 24 hours on elevated volume of $${volumeFormatted}, outpacing the broader altcoin market as buyers absorbed supply above the $${baselineStr} baseline.`;
    }
    return `${name} (${ticker}) rose modestly (+${absChange}%) as part of a broad uptick in crypto sentiment, with 24-hour trading volume reaching $${volumeFormatted} across Coinbase 50 Index constituents.`;
  } else {
    if (changePercent < -3.5) {
      return `${name} (${ticker}) experienced sharp consolidation (-${absChange}%) under broader market headwinds, trading lower from 24-hour baseline levels near $${baselineStr} on $${volumeFormatted} in volume.`;
    }
    return `${name} (${ticker}) edged lower (-${absChange}%) as part of a routine intraday consolidation, with no coin-specific adverse catalyst, as market participants maintained $${volumeFormatted} in steady 24-hour liquidity.`;
  }
}

// In-memory cache for 60 seconds
let standoutsCache: { data: CryptoStandoutItem[]; timestamp: number } | null = null;

export async function GET() {
  const now = Date.now();
  if (standoutsCache && now - standoutsCache.timestamp < 60000) {
    return NextResponse.json(
      { standouts: standoutsCache.data, cached: true },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  }

  try {
    // 1. Fetch live quotes for the Coinbase 50 pool to rank dynamically
    const symbols = COINBASE_50_POOL.map((c) => c.symbol);
    const poolQuotes = await yf.quote(symbols);

    // Score based on absolute price action & volume turnover
    const scored = poolQuotes
      .map((q) => {
        const poolItem = COINBASE_50_POOL.find((c) => c.symbol === q.symbol);
        if (!poolItem) return null;
        const absChg = Math.abs(q.regularMarketChangePercent || 0);
        const vol = q.regularMarketVolume || 0;
        const mcap = q.marketCap || 1;
        const turnover = (vol / mcap) * 100;
        // Balance move magnitude and volume interest
        const score = absChg * 1.5 + Math.min(turnover, 50);

        return {
          ...poolItem,
          quote: q,
          score,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && (item.quote.regularMarketPrice ?? 0) > 0)
      .sort((a, b) => b.score - a.score);

    // Pick the top 2-3 standout performers
    const selectedStandouts = scored.slice(0, 3);

    // 2. Fetch full 15m 24h charts for the selected standouts
    const period1 = new Date(now - 24 * 60 * 60 * 1000);

    const items: CryptoStandoutItem[] = await Promise.all(
      selectedStandouts.map(async (coin) => {
        try {
          const chartData = await yf.chart(coin.symbol, { period1, interval: "15m" });
          const quoteData = coin.quote;

          const quotes = (chartData.quotes || []).filter(
            (q) => typeof q.close === "number" && !isNaN(q.close) && q.close > 0
          );

          const currentPrice =
            quoteData.regularMarketPrice ??
            (quotes.length > 0 ? quotes[quotes.length - 1].close! : 0);

          const baselinePrice =
            quotes.length > 0 ? quotes[0].close! : (quoteData.regularMarketPreviousClose ?? currentPrice);

          const changePercent =
            quoteData.regularMarketChangePercent ??
            (baselinePrice > 0 ? ((currentPrice - baselinePrice) / baselinePrice) * 100 : 0);

          const volume = quoteData.regularMarketVolume ?? 0;
          const marketCap = quoteData.marketCap ?? 0;

          // Build clean chart points with full timestamp
          const points: CryptoStandoutChartPoint[] = quotes.map((q) => ({
            time: new Date(q.date).getTime(),
            value: Number(q.close),
          }));

          // Min and Max for scaling
          let min = Math.min(...points.map((p) => p.value), baselinePrice);
          let max = Math.max(...points.map((p) => p.value), baselinePrice);
          const range = max - min || 1;
          // Add 6% padding for clean layout
          min = min - range * 0.06;
          max = max + range * 0.06;
          const paddedRange = max - min || 1;

          // Baseline Y percentage (0 = top, 100 = bottom)
          const baselineYPercent = Math.max(
            5,
            Math.min(95, ((max - baselinePrice) / paddedRange) * 100)
          );

          // Generate 3 time labels across 24h
          const timeLabels = [
            {
              label: new Date(now - 18 * 3600 * 1000).toLocaleTimeString("en-US", {
                hour: "numeric",
                hour12: true,
              }),
              xPercent: 25,
            },
            {
              label: new Date(now - 12 * 3600 * 1000).toLocaleTimeString("en-US", {
                hour: "numeric",
                hour12: true,
              }),
              xPercent: 50,
            },
            {
              label: new Date(now - 6 * 3600 * 1000).toLocaleTimeString("en-US", {
                hour: "numeric",
                hour12: true,
              }),
              xPercent: 75,
            },
          ];

          const formattedVol = formatCompact(volume);
          const formattedBaseline = formatCryptoPrice(baselinePrice);

          return {
            symbol: coin.symbol,
            ticker: coin.ticker,
            displaySymbol: `${coin.ticker}USD`,
            name: coin.name,
            category: "CRYPTO",
            price: currentPrice,
            formattedPrice: formatCryptoPrice(currentPrice),
            changePercent,
            baselinePrice,
            formattedBaseline,
            volume,
            formattedVolume: formattedVol,
            marketCap,
            formattedMarketCap: formatCompact(marketCap),
            peRatio: "N/A",
            dividendYield: "N/A",
            catalyst: generateCatalyst(
              coin.name.replace(" USD", ""),
              coin.ticker,
              changePercent,
              formattedVol,
              baselinePrice
            ),
            chart: {
              points,
              min,
              max,
              baselineYPercent,
              timeLabels,
            },
          };
        } catch (err) {
          console.error(`Error processing standout ${coin.symbol}:`, err);
          return null;
        }
      })
    ).then((res) => res.filter((item): item is CryptoStandoutItem => item !== null));

    if (items.length > 0) {
      standoutsCache = { data: items, timestamp: now };
    }

    return NextResponse.json(
      { standouts: items },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Crypto Standouts dynamic route error:", error);
    return NextResponse.json({ standouts: [], error: "Failed to fetch standouts" }, { status: 500 });
  }
}
