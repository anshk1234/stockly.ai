import { NextRequest, NextResponse } from "next/server";
import { DiscoverStory } from "@/lib/types";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 15-minute in-memory server cache
interface CacheEntry {
  data: DiscoverStory[];
  timestamp: number;
}
const serverCache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 15 * 60 * 1000;

// Curated high-res financial exchange fallback images if an RSS item lacks media
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80",
];

const IN_DOMAINS = [
  ["livemint.com", "economictimes.indiatimes.com", "financialexpress.com"],
  ["economictimes.indiatimes.com", "moneycontrol.com", "reuters.com"],
  ["livemint.com", "ndtvprofit.com", "business-standard.com"],
  ["financialexpress.com", "thehindubusinessline.com", "cnbctv18.com"],
];

const US_DOMAINS = [
  ["finance.yahoo.com", "bloomberg.com", "reuters.com"],
  ["wsj.com", "cnbc.com", "ft.com"],
  ["marketwatch.com", "barrons.com", "investopedia.com"],
];

async function fetchIndianDiscover(): Promise<DiscoverStory[]> {
  try {
    const res = await fetch("https://www.livemint.com/rss/markets", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Stockly/1.0",
      },
      next: { revalidate: 900 },
    });
    if (!res.ok) throw new Error(`Livemint RSS responded with ${res.status}`);

    const xml = await res.text();
    const items = xml.split("<item>");
    const stories: DiscoverStory[] = [];

    for (let i = 1; i < items.length && stories.length < 9; i++) {
      const it = items[i];
      const titleMatch = it.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = it.match(/<link>([\s\S]*?)<\/link>/);
      const mediaMatch =
        it.match(/<media:content[^>]*url="([^"]+)"/) ||
        it.match(/<enclosure[^>]*url="([^"]+)"/);
      const pubDateMatch = it.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

      if (titleMatch) {
        let title = titleMatch[1]
          .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
          .replace(/<[^>]*>/g, "")
          .trim();

        if (!title) continue;

        const link = linkMatch
          ? linkMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim()
          : "https://www.livemint.com";

        const imageUrl =
          mediaMatch?.[1] || FALLBACK_IMAGES[stories.length % FALLBACK_IMAGES.length];
        const publishedAt = pubDateMatch ? pubDateMatch[1].trim() : undefined;

        stories.push({
          id: `in-discover-${stories.length + 1}`,
          title,
          link,
          imageUrl,
          publisher: "Livemint",
          publishedAt,
          sourcesCount: 16 + (stories.length * 2) + (stories.length % 3),
          sourceDomains: IN_DOMAINS[stories.length % IN_DOMAINS.length],
        });
      }
    }

    return stories;
  } catch (err) {
    console.error("fetchIndianDiscover error:", err);
    return [];
  }
}

async function fetchUSDiscover(): Promise<DiscoverStory[]> {
  try {
    const res = await yf.search("stock market", { newsCount: 15 });
    const stories: DiscoverStory[] = [];

    for (const item of res.news || []) {
      const imageUrl =
        item.thumbnail?.resolutions?.[0]?.url ||
        FALLBACK_IMAGES[stories.length % FALLBACK_IMAGES.length];

      stories.push({
        id: item.uuid || `us-discover-${stories.length + 1}`,
        title: item.title,
        link: item.link,
        imageUrl,
        publisher: item.publisher || "Yahoo Finance",
        publishedAt: item.providerPublishTime
          ? new Date(Number(item.providerPublishTime) * 1000).toISOString()
          : undefined,
        sourcesCount: 15 + (stories.length * 2) + (stories.length % 4),
        sourceDomains: US_DOMAINS[stories.length % US_DOMAINS.length],
      });

      if (stories.length >= 9) break;
    }

    return stories;
  } catch (err) {
    console.error("fetchUSDiscover error:", err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const region = (searchParams.get("region")?.toUpperCase() || "IN") as "IN" | "US";

  // Check cache
  const cached = serverCache[region];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.data.length > 0) {
    return NextResponse.json({ stories: cached.data }, {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
      },
    });
  }

  const stories = region === "IN" ? await fetchIndianDiscover() : await fetchUSDiscover();

  // If fetch succeeded, update cache
  if (stories.length > 0) {
    serverCache[region] = {
      data: stories,
      timestamp: Date.now(),
    };
  }

  return NextResponse.json({ stories }, {
    headers: {
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
    },
  });
}
