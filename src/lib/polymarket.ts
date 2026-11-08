import https from "https";
import crypto from "crypto";
import { serverCache } from "./cache";

export interface PredictionOption {
  label: string;
  percentage: number;
  change: number;
}

export interface PredictionMarketItem {
  id: string;
  title: string;
  volume: string;
  volumeNum: number;
  platform: string;
  category: string;
  options: PredictionOption[];
  narrative: string;
  sources: string;
  date: string;
}

// Fallback curated predictions if Polymarket Gamma API is unreachable
export const FALLBACK_PREDICTIONS: PredictionMarketItem[] = [
  // Finance
  {
    id: "pred-card-1",
    title: "Largest Company end of December 2026?",
    volume: "$9.9M vol.",
    volumeNum: 9900000,
    platform: "+5 on Polymarket",
    category: "Finance",
    options: [
      { label: "Apple", percentage: 63.0, change: 3.3 },
      { label: "NVIDIA", percentage: 37.0, change: -2.5 },
      { label: "Microsoft", percentage: 1.0, change: -1.1 },
    ],
    narrative:
      "NVIDIA leads at 59.5% to be the world's largest company by end of 2026, but Alphabet's recent 43% stock surge has meaningfully pressured that lead — with Alphabet climbing to 24% — making this a two-horse race worth watching.",
    sources: "4 sources",
    date: "Dec 31, 2026",
  },
  {
    id: "pred-card-fed",
    title: "How many Fed rate cuts in 2026?",
    volume: "$55.6M vol.",
    volumeNum: 55600000,
    platform: "+13 on Polymarket",
    category: "Finance",
    options: [
      { label: "0 (0 bps)", percentage: 98.0, change: -0.1 },
      { label: "1 (25 bps)", percentage: 1.0, change: -0.2 },
      { label: "2 (50 bps)", percentage: 1.0, change: 0.4 },
    ],
    narrative:
      "Traders price in stubborn core inflation metrics and resilient labor prints, sharply compressing rate cut expectations through fiscal 2026.",
    sources: "13 markets",
    date: "Jan 1, 2027",
  },
  {
    id: "pred-card-acq",
    title: "Which companies will be acquired before 2027?",
    volume: "$18.4M vol.",
    volumeNum: 18400000,
    platform: "+20 on Polymarket",
    category: "Finance",
    options: [
      { label: "Warner Bros. Discovery", percentage: 100.0, change: 5.4 },
      { label: "iRobot", percentage: 100.0, change: 73.5 },
      { label: "Pizza Hut", percentage: 100.0, change: 4.0 },
    ],
    narrative:
      "Regulatory scrutiny and strategic consolidations drive high-stakes acquisition probabilities across media and industrial automation targets.",
    sources: "20 markets",
    date: "Jan 1, 2027",
  },
  // Crypto
  {
    id: "pred-card-btc-2026",
    title: "What price will Bitcoin hit in 2026?",
    volume: "$82.8M vol.",
    volumeNum: 82800000,
    platform: "+14 on Polymarket",
    category: "Crypto",
    options: [
      { label: "↑ $100,000", percentage: 68.0, change: 5.4 },
      { label: "↑ $125,000", percentage: 42.0, change: 3.1 },
      { label: "↑ $150,000", percentage: 24.0, change: -1.8 },
    ],
    narrative:
      "Global ETF net inflow acceleration combined with post-halving sovereign reserve discussions continue to anchor market distribution toward high-beta upside outcomes.",
    sources: "14 markets",
    date: "Dec 31, 2026",
  },
  {
    id: "pred-card-btc-150k",
    title: "When will Bitcoin hit $150k?",
    volume: "$27.3M vol.",
    volumeNum: 27300000,
    platform: "+6 on Polymarket",
    category: "Crypto",
    options: [
      { label: "by December 31, 2027", percentage: 25.0, change: 2.1 },
      { label: "by September 30, 2027", percentage: 15.0, change: 1.0 },
      { label: "by June 30, 2027", percentage: 10.0, change: -0.5 },
    ],
    narrative:
      "Institutional liquidity depth and macro liquidity cycles establish wide time-decay distributions across multi-year cycle ceilings.",
    sources: "6 markets",
    date: "Dec 31, 2027",
  },
  {
    id: "pred-card-eth-ath",
    title: "Will Ethereum reach an all-time high in 2026?",
    volume: "$14.2M vol.",
    volumeNum: 14200000,
    platform: "+2 on Polymarket",
    category: "Crypto",
    options: [
      { label: "Yes", percentage: 61.0, change: 4.2 },
      { label: "No", percentage: 39.0, change: -4.2 },
    ],
    narrative:
      "Layer-2 rollup revenue models and spot ETF staking approval expectations sustain bullish bias for ETH new highs.",
    sources: "2 markets",
    date: "Dec 31, 2026",
  },
  // Tech
  {
    id: "pred-card-2",
    title: "Anthropic IPO Closing Market Cap",
    volume: "$3.7M vol.",
    volumeNum: 3700000,
    platform: "+7 on Polymarket",
    category: "Tech",
    options: [
      { label: "$1.5–$1.75T", percentage: 29.0, change: 3.5 },
      { label: "$1.25–$1.5T", percentage: 19.0, change: 2.9 },
      { label: "$1.75–$2.0T", percentage: 18.0, change: -8.0 },
    ],
    narrative:
      "Anthropic's latest funding valuations and enterprise Claude revenue acceleration continue to drive bullish expectations for public market debut capitalization above the $1.5T benchmark threshold.",
    sources: "7 markets",
    date: "Dec 31, 2026",
  },
  // Economy
  {
    id: "pred-card-3",
    title: "What will WTI Crude Oil (WTI) hit in November 2026?",
    volume: "$1.4M vol.",
    volumeNum: 1400000,
    platform: "+21 on Polymarket",
    category: "Economy",
    options: [
      { label: "↑ $95", percentage: 71.0, change: 12.0 },
      { label: "↓ $85", percentage: 68.0, change: -10.0 },
      { label: "↑ $100", percentage: 44.0, change: 8.0 },
    ],
    narrative:
      "OPEC+ compliance metrics and non-OPEC deepwater capacity expansion are pricing in heightened autumn supply-demand variance.",
    sources: "21 markets",
    date: "Nov 30, 2026",
  },
];

function formatVolume(vol: number): string {
  if (!vol || vol <= 0) return "$0 vol.";
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M vol.`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K vol.`;
  return `$${Math.round(vol)} vol.`;
}

function parsePolymarketEvent(e: any, defaultCategory: string): PredictionMarketItem {
  const options: PredictionOption[] = [];

  if (e.markets && Array.isArray(e.markets) && e.markets.length > 0) {
    if (e.markets.length === 1 && (!e.markets[0].groupItemTitle || e.markets[0].groupItemTitle.trim() === "")) {
      // Single binary question (Yes / No)
      const m = e.markets[0];
      let prices: number[] = [0.5, 0.5];
      try {
        if (typeof m.outcomePrices === "string") {
          prices = JSON.parse(m.outcomePrices).map(Number);
        } else if (Array.isArray(m.outcomePrices)) {
          prices = m.outcomePrices.map(Number);
        }
      } catch {
        prices = [0.5, 0.5];
      }

      let outcomes = ["Yes", "No"];
      try {
        if (typeof m.outcomes === "string") {
          outcomes = JSON.parse(m.outcomes);
        } else if (Array.isArray(m.outcomes)) {
          outcomes = m.outcomes;
        }
      } catch {
        outcomes = ["Yes", "No"];
      }

      const yesPct = Math.min(100, Math.max(0, Math.round((prices[0] || 0.5) * 100)));
      const noPct = Math.max(0, 100 - yesPct);
      const chg = typeof m.oneDayPriceChange === "number" ? Math.round(m.oneDayPriceChange * 1000) / 10 : 1.2;

      options.push({ label: outcomes[0] || "Yes", percentage: yesPct, change: chg });
      options.push({ label: outcomes[1] || "No", percentage: noPct, change: -chg });
    } else {
      // Multi-market event with multiple outcomes / candidates
      const sorted = [...e.markets].sort((a, b) => {
        const getPrice = (item: any) => {
          try {
            if (Array.isArray(item.outcomePrices)) return Number(item.outcomePrices[0]) || 0;
            if (typeof item.outcomePrices === "string") return Number(JSON.parse(item.outcomePrices)[0]) || 0;
          } catch {
            return 0;
          }
          return 0;
        };
        return getPrice(b) - getPrice(a);
      });

      sorted.slice(0, 3).forEach((m) => {
        let pct = 0;
        try {
          if (Array.isArray(m.outcomePrices)) pct = Math.round((Number(m.outcomePrices[0]) || 0) * 100);
          else if (typeof m.outcomePrices === "string") pct = Math.round((Number(JSON.parse(m.outcomePrices)[0]) || 0) * 100);
        } catch {
          pct = 0;
        }

        const chg = typeof m.oneDayPriceChange === "number" ? Math.round(m.oneDayPriceChange * 1000) / 10 : 0;
        const cleanLabel = (m.groupItemTitle || m.question || "Option")
          .replace(/^Will\s+/i, "")
          .replace(/\s+win\??$/i, "");

        options.push({
          label: cleanLabel,
          percentage: pct,
          change: chg,
        });
      });
    }
  }

  // Derive category: retain requested category
  const category = defaultCategory || "Finance";

  const vol = Number(e.volume || e.volume24hr || 0);
  const dateStr = e.endDate
    ? new Date(e.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "2026";

  const cleanNarrative = e.description
    ? e.description.split("\n")[0].replace(/<[^>]*>?/gm, "").slice(0, 280)
    : "Live real-time market prediction crowdsourced globally on Polymarket.";

  return {
    id: `poly-${e.id}`,
    title: e.title || "Prediction Market",
    volume: formatVolume(vol),
    volumeNum: vol,
    platform: `+${e.markets?.length || 1} on Polymarket`,
    category,
    options,
    narrative: cleanNarrative,
    sources: e.markets?.length ? `${e.markets.length} markets` : "Polymarket Oracle",
    date: dateStr,
  };
}

async function fetchFromPolymarketApi(url: string, retries = 2): Promise<any[]> {
  return new Promise((resolve, reject) => {
    function attempt(n: number) {
      const req = https.get(
        url,
        {
          timeout: 6000,
          secureOptions: crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION | crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            Accept: "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
          },
        },
        (res) => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            res.resume();
            if (n > 0) return setTimeout(() => attempt(n - 1), 300);
            return reject(new Error(`Polymarket API returned HTTP ${res.statusCode}`));
          }

          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(body);
              resolve(Array.isArray(parsed) ? parsed : []);
            } catch (e: any) {
              if (n > 0) return setTimeout(() => attempt(n - 1), 300);
              reject(new Error(`Failed to parse Polymarket JSON: ${e.message}`));
            }
          });
        }
      );

      req.on("timeout", () => {
        req.destroy();
        if (n > 0) return setTimeout(() => attempt(n - 1), 300);
        reject(new Error("Polymarket API timeout"));
      });

      req.on("error", (err) => {
        if (n > 0) return setTimeout(() => attempt(n - 1), 300);
        reject(err);
      });
    }

    attempt(retries);
  });
}

/**
 * Fetch live prediction markets from Polymarket with in-memory server caching (5-min TTL)
 */
export async function getPredictionMarkets(category?: string): Promise<PredictionMarketItem[]> {
  const normalizedCategory = (category || "").trim().toLowerCase();
  const cacheKey = `polymarket-events-${normalizedCategory || "all"}`;

  return serverCache.getOrSet<PredictionMarketItem[]>(cacheKey, 300, async () => {
    try {
      let tagQuery = "";
      if (normalizedCategory === "finance" || normalizedCategory === "economy" || normalizedCategory === "earnings") {
        tagQuery = "&tag_slug=finance";
      } else if (normalizedCategory === "crypto") {
        tagQuery = "&tag_slug=crypto";
      } else if (normalizedCategory === "tech") {
        tagQuery = "&tag_slug=tech";
      } else if (normalizedCategory === "politics" || normalizedCategory === "geopolitics" || normalizedCategory === "world") {
        tagQuery = "&tag_slug=politics";
      } else if (normalizedCategory === "culture") {
        tagQuery = "&tag_slug=culture";
      }

      const url = `https://gamma-api.polymarket.com/events?limit=12&active=true&closed=false&order=volume&ascending=false${tagQuery}`;
      const rawEvents = await fetchFromPolymarketApi(url, 2);

      if (!rawEvents || rawEvents.length === 0) {
        return filterFallback(normalizedCategory);
      }

      const items = rawEvents
        .filter((e) => e && e.title && e.markets && e.markets.length > 0)
        .map((e) => parsePolymarketEvent(e, category || "Finance"));

      return items.length > 0 ? items : filterFallback(normalizedCategory);
    } catch (error) {
      console.warn("Polymarket API unavailable, falling back to curated data:", (error as Error).message);
      return filterFallback(normalizedCategory);
    }
  });
}

function filterFallback(category: string): PredictionMarketItem[] {
  if (!category || category === "all") return FALLBACK_PREDICTIONS;
  const filtered = FALLBACK_PREDICTIONS.filter(
    (p) => p.category.toLowerCase() === category || category.includes(p.category.toLowerCase())
  );
  return filtered.length > 0 ? filtered : FALLBACK_PREDICTIONS;
}
