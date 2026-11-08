import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import {
  INDIA_HEATMAP_CONSTITUENTS,
  US_HEATMAP_CONSTITUENTS,
  HeatmapStockItem,
} from "@/lib/heatmap-data";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// Server-side in-memory cache
const heatmapCache: Record<string, { data: HeatmapStockItem[]; timestamp: number }> = {};
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes (protects Vercel serverless compute limits)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = (searchParams.get("region") || "IN").toUpperCase();

  const baseConstituents: HeatmapStockItem[] =
    region === "US" ? US_HEATMAP_CONSTITUENTS : INDIA_HEATMAP_CONSTITUENTS;

  const now = Date.now();
  const cached = heatmapCache[region];
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      { stocks: cached.data, region, cached: true },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120",
        },
      }
    );
  }

  try {
    const symbols = baseConstituents.map((c) => c.cleanSymbol);
    const quotes = await yf.quote(symbols);
    const quotesList = Array.isArray(quotes) ? quotes : [quotes];
    const quotesMap = new Map(quotesList.map((q) => [q.symbol, q]));

    const enriched: HeatmapStockItem[] = baseConstituents.map((item) => {
      const q = quotesMap.get(item.cleanSymbol);
      if (q) {
        return {
          ...item,
          price: q.regularMarketPrice ?? item.price,
          changePercent: q.regularMarketChangePercent ?? item.changePercent,
          change: q.regularMarketChange ?? item.change,
        };
      }
      return item;
    });

    heatmapCache[region] = { data: enriched, timestamp: now };

    return NextResponse.json(
      { stocks: enriched, region, cached: false },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    console.warn("Failed to fetch live heatmap quotes from Yahoo, using fallback:", err);
    return NextResponse.json(
      { stocks: baseConstituents, region, cached: false, fallback: true },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  }
}
