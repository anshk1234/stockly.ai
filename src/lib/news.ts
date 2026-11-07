import { serverCache } from "./cache";
import { NewsItem } from "./types";

export interface SourceInfo {
  name: string;
  domain?: string;
  favicon?: string;
}

export interface MarketSummaryResponse {
  news: NewsItem[];
  sourcesCount: number;
  sources: SourceInfo[];
  lastUpdated: string;
}

interface RawArticle {
  title: string;
  publisher: string;
  domain: string;
  sourceUrl: string;
  link: string;
  pubDate: Date;
  snippet: string;
}

interface FeedConfig {
  publisher: string;
  domain: string;
  url: string;
}

const WIRE_FEEDS: Record<"IN" | "US" | "CRYPTO", FeedConfig[]> = {
  IN: [
    {
      publisher: "The Economic Times",
      domain: "economictimes.indiatimes.com",
      url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    },
    {
      publisher: "Livemint",
      domain: "livemint.com",
      url: "https://www.livemint.com/rss/markets",
    },
    {
      publisher: "The Economic Times (Stocks)",
      domain: "economictimes.indiatimes.com",
      url: "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms",
    },
  ],
  US: [
    {
      publisher: "CNBC Markets",
      domain: "cnbc.com",
      url: "https://www.cnbc.com/id/10000664/device/rss/rss.html",
    },
    {
      publisher: "CNBC Business",
      domain: "cnbc.com",
      url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    },
  ],
  CRYPTO: [
    {
      publisher: "Cointelegraph",
      domain: "cointelegraph.com",
      url: "https://cointelegraph.com/rss",
    },
    {
      publisher: "CoinDesk",
      domain: "coindesk.com",
      url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    },
  ],
};

function cleanText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#x201c;|&#x201d;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#x2018;|&#x2019;|&lsquo;|&rsquo;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetch direct, authentic wire feeds containing genuine journalistic article summaries
 */
async function fetchDirectWireFeeds(
  category: "IN" | "US" | "CRYPTO"
): Promise<RawArticle[]> {
  const feeds = WIRE_FEEDS[category] || WIRE_FEEDS.IN;
  const articles: RawArticle[] = [];

  const promises = feeds.map(async (feed) => {
    try {
      const res = await fetch(feed.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        next: { revalidate: 600 },
      });

      if (!res.ok) return [];

      const xml = await res.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      const feedArticles: RawArticle[] = [];
      let match;

      while ((match = itemRegex.exec(xml)) !== null && feedArticles.length < 15) {
        const item = match[1];
        const rawTitle = item.match(/<title>([\s\S]*?)<\/title>/)?.[1];
        const rawDesc = item.match(/<description>([\s\S]*?)<\/description>/)?.[1];
        const rawLink = item.match(/<link>([\s\S]*?)<\/link>/)?.[1];
        const rawPubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];

        if (!rawTitle) continue;

        const title = cleanText(rawTitle);
        let snippet = cleanText(rawDesc || "");

        // Remove any residual trailing author / image markup
        snippet = snippet
          .replace(/^(Photo|Image|Credit|Source):.*$/gim, "")
          .trim();

        const pubDate = rawPubDate
          ? new Date(rawPubDate.replace(/<!\[CDATA\[(.*?)\]\]>/, "$1").trim())
          : new Date();
        const link = rawLink
          ? rawLink.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim()
          : "";

        // Ensure we only include items that have a genuine article description
        if (title && snippet && snippet.length > 25) {
          feedArticles.push({
            title,
            snippet,
            publisher: feed.publisher.replace(" (Stocks)", "").replace(" Markets", "").replace(" Business", ""),
            domain: feed.domain,
            sourceUrl: `https://${feed.domain}`,
            link,
            pubDate: isNaN(pubDate.getTime()) ? new Date() : pubDate,
          });
        }
      }

      return feedArticles;
    } catch (err) {
      console.warn(`Failed to fetch wire from ${feed.publisher}:`, err);
      return [];
    }
  });

  const results = await Promise.all(promises);
  results.forEach((list) => articles.push(...list));

  // Deduplicate by title
  const seen = new Set<string>();
  const uniqueArticles: RawArticle[] = [];
  for (const art of articles) {
    const key = art.title.toLowerCase().slice(0, 40);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueArticles.push(art);
    }
  }

  // Sort chronologically: newest published stories first
  uniqueArticles.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return uniqueArticles;
}

/**
 * Retrieve curated Market Summary (30-Minute Cache, Authentic Journalistic Descriptions)
 */
export async function getMarketSummary(
  category: "IN" | "US" | "CRYPTO" = "IN"
): Promise<MarketSummaryResponse> {
  const cacheKey = `market-summary-wire-v3-${category}`;
  // 30 minutes server cache (1800 seconds)
  const ttl = 1800;

  return serverCache.getOrSet(cacheKey, ttl, async () => {
    const rawArticles = await fetchDirectWireFeeds(category);

    // Extract unique sources with favicons
    const sourceMap = new Map<string, SourceInfo>();
    for (const art of rawArticles) {
      if (art.publisher && !sourceMap.has(art.publisher)) {
        sourceMap.set(art.publisher, {
          name: art.publisher,
          domain: art.domain,
          favicon: art.domain
            ? `https://www.google.com/s2/favicons?domain=${art.domain}&sz=32`
            : undefined,
        });
      }
    }

    const sources = Array.from(sourceMap.values());

    const newsItems: NewsItem[] = rawArticles.slice(0, 8).map((art, idx) => ({
      id: `wire-${idx}-${art.pubDate.getTime()}`,
      title: art.title,
      publisher: art.publisher,
      link: art.link,
      publishedAt: art.pubDate.toISOString(),
      summary: art.snippet,
    }));

    return {
      news: newsItems,
      sourcesCount: sources.length > 0 ? sources.length : newsItems.length,
      sources,
      lastUpdated: new Date().toISOString(),
    };
  });
}
