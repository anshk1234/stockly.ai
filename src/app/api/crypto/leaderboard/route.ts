import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export interface CryptoLeaderboardItem {
  symbol: string;
  displaySymbol: string;
  name: string;
  price: number;
  formattedPrice: string;
  priceChg24H: number;
  vol24H: number;
  formattedVol24H: string;
  volChg24H?: number;
  marketCap?: number;
  formattedMarketCap?: string;
  fundingRate?: string;
}

const COINBASE_SYMBOLS = [
  "BTC-USD",
  "ETH-USD",
  "XRP-USD",
  "ZEC-USD",
  "SOL-USD",
  "NEAR-USD",
  "USDC-USD",
  "AAVE-USD",
  "LINK-USD",
  "UNI-USD",
];

const ALL_EXCHANGES_SYMBOLS = [
  "USDT-USD",
  "BTC-USD",
  "ETH-USD",
  "USDC-USD",
  "XRP-USD",
  "BNB-USD",
  "SOL-USD",
  "DOGE-USD",
  "ADA-USD",
  "AVAX-USD",
];

const CLEAN_NAMES: Record<string, { name: string; displaySymbol: string }> = {
  "BTC-USD": { name: "Bitcoin", displaySymbol: "BTCUSD" },
  "ETH-USD": { name: "Ethereum", displaySymbol: "ETHUSD" },
  "XRP-USD": { name: "XRP", displaySymbol: "XRPUSD" },
  "ZEC-USD": { name: "Zcash", displaySymbol: "ZECUSD" },
  "SOL-USD": { name: "Solana", displaySymbol: "SOLUSD" },
  "NEAR-USD": { name: "NEAR Protocol", displaySymbol: "NEARUSD" },
  "USDC-USD": { name: "USD Coin", displaySymbol: "USDCUSD" },
  "AAVE-USD": { name: "Aave", displaySymbol: "AAVEUSD" },
  "LINK-USD": { name: "Chainlink", displaySymbol: "LINKUSD" },
  "UNI-USD": { name: "Uniswap", displaySymbol: "UNIUSD" },
  "USDT-USD": { name: "Tether USDt", displaySymbol: "USDTUSD" },
  "BNB-USD": { name: "BNB", displaySymbol: "BNBUSD" },
  "DOGE-USD": { name: "Dogecoin", displaySymbol: "DOGEUSD" },
  "ADA-USD": { name: "Cardano", displaySymbol: "ADAUSD" },
  "AVAX-USD": { name: "Avalanche", displaySymbol: "AVAXUSD" },
};

function formatCompactCurrency(val: number): string {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
  return `$${val.toFixed(2)}`;
}

function formatCryptoPrice(val: number): string {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
  if (val >= 1) return `$${val.toFixed(2)}`;
  if (val >= 0.01) return `$${val.toFixed(3)}`;
  return `$${val.toFixed(4)}`;
}

// In-memory cache
let cachedLeaderboard: {
  coinbase: CryptoLeaderboardItem[];
  all: CryptoLeaderboardItem[];
  timestamp: number;
} | null = null;
const CACHE_TTL_MS = 30 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const exchange = (searchParams.get("exchange") || "coinbase").toLowerCase();

  const now = Date.now();
  if (cachedLeaderboard && now - cachedLeaderboard.timestamp < CACHE_TTL_MS) {
    const items = exchange === "all" ? cachedLeaderboard.all : cachedLeaderboard.coinbase;
    return NextResponse.json({ items }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  }

  try {
    const allQuerySymbols = Array.from(new Set([...COINBASE_SYMBOLS, ...ALL_EXCHANGES_SYMBOLS]));
    
    // Fetch live quotes and live funding rates in parallel
    const [quotes, fundingRes] = await Promise.all([
      yf.quote(allQuerySymbols),
      fetch("https://fapi.binance.com/fapi/v1/premiumIndex", {
        headers: { "User-Agent": "Mozilla/5.0 Stockly/1.0" },
        next: { revalidate: 30 },
      })
        .then((r) => r.json())
        .catch(() => []),
    ]);

    const quotesList = Array.isArray(quotes) ? quotes : [quotes];
    const quotesMap = new Map<string, any>();
    quotesList.forEach((q) => quotesMap.set(q.symbol, q));

    const fundingMap = new Map<string, string>();
    if (Array.isArray(fundingRes)) {
      fundingRes.forEach((f: any) => {
        if (f.symbol && f.lastFundingRate) {
          const rate = (parseFloat(f.lastFundingRate) * 100).toFixed(2);
          fundingMap.set(f.symbol, `${rate}%`);
        }
      });
    }

    const buildItem = (sym: string): CryptoLeaderboardItem => {
      const q = quotesMap.get(sym) || {};
      const meta = CLEAN_NAMES[sym] || { name: q.shortName || sym, displaySymbol: sym.replace("-USD", "USD") };
      const price = q.regularMarketPrice ?? 0;
      const vol24H = q.regularMarketVolume ?? 0;
      const avgVol = q.averageDailyVolume10Day || q.averageDailyVolume3Month || vol24H;
      const volChg24H = avgVol > 0 ? ((vol24H - avgVol) / avgVol) * 100 : 0;
      const mCap = q.marketCap ?? 0;

      const baseCoin = sym.split("-")[0].toUpperCase();
      const fundingRate = fundingMap.get(`${baseCoin}USDT`) || "0.01%";

      return {
        symbol: sym,
        displaySymbol: meta.displaySymbol,
        name: meta.name,
        price,
        formattedPrice: formatCryptoPrice(price),
        priceChg24H: q.regularMarketChangePercent ?? 0,
        vol24H,
        formattedVol24H: formatCompactCurrency(vol24H),
        volChg24H,
        marketCap: mCap,
        formattedMarketCap: formatCompactCurrency(mCap),
        fundingRate,
      };
    };

    const coinbaseItems = COINBASE_SYMBOLS.map(buildItem);
    const allItems = ALL_EXCHANGES_SYMBOLS.map(buildItem);

    cachedLeaderboard = {
      coinbase: coinbaseItems,
      all: allItems,
      timestamp: Date.now(),
    };

    const items = exchange === "all" ? allItems : coinbaseItems;
    return NextResponse.json({ items }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("Error fetching crypto leaderboard:", err);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
