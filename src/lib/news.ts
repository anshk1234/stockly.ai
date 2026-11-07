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
  sourceUrl: string;
  link: string;
  pubDate: string;
  snippet: string;
}

/**
 * Fetch live, authentic financial RSS wire articles from Google News
 */
async function fetchLiveFinancialRss(
  category: "IN" | "US" | "CRYPTO"
): Promise<RawArticle[]> {
  const query =
    category === "CRYPTO"
      ? "Bitcoin+Ethereum+Crypto+market+when:2d"
      : category === "IN"
      ? "Sensex+Nifty+Indian+stock+market+when:2d"
      : "Wall+Street+stock+market+SP500+Nasdaq+when:2d";

  const url =
    category === "IN"
      ? `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`
      : `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      throw new Error(`RSS fetch returned status ${res.status}`);
    }

    const xml = await res.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const articles: RawArticle[] = [];
    let match;

    while ((match = itemRegex.exec(xml)) !== null && articles.length < 25) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = itemContent.match(/<source[^>]*url="([^"]*)"[^>]*>([\s\S]*?)<\/source>/);
      const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);

      const rawTitle = titleMatch
        ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim()
        : "";
      const publisher = sourceMatch
        ? sourceMatch[2].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim()
        : "Financial News";
      const sourceUrl = sourceMatch ? sourceMatch[1] : "";
      const link = linkMatch ? linkMatch[1].trim() : "";
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toUTCString();

      // Clean publisher from title (e.g. "Headline - Reuters" -> "Headline")
      let cleanTitle = rawTitle;
      if (publisher && cleanTitle.toLowerCase().endsWith(publisher.toLowerCase())) {
        cleanTitle = cleanTitle
          .slice(0, -publisher.length)
          .replace(/[\s\-\–\|]+$/, "")
          .trim();
      }

      // Clean description snippet
      let snippet = "";
      if (descMatch) {
        const decoded = descMatch[1]
          .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, " ")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        const lowerDecoded = decoded.toLowerCase();
        const lowerTitle = cleanTitle.toLowerCase();
        if (!decoded || lowerDecoded.length < 35 || lowerDecoded.startsWith(lowerTitle)) {
          snippet = `Key developments impacting benchmark indices, institutional portfolio flows, and macroeconomic sentiment across markets as reported by ${publisher}.`;
        } else {
          snippet = decoded;
        }
      } else {
        snippet = `Key developments impacting benchmark indices, institutional portfolio flows, and macroeconomic sentiment across markets as reported by ${publisher}.`;
      }

      if (cleanTitle) {
        articles.push({
          title: cleanTitle,
          publisher,
          sourceUrl,
          link,
          pubDate: new Date(pubDate).toISOString(),
          snippet,
        });
      }
    }

    return articles;
  } catch (error) {
    console.error("Error fetching live financial RSS:", error);
    return [];
  }
}

/**
 * Retrieve curated Market Summary (Hourly Cache)
 */
export async function getMarketSummary(
  category: "IN" | "US" | "CRYPTO" = "IN"
): Promise<MarketSummaryResponse> {
  const cacheKey = `market-summary-wire-${category}`;
  // 1 hour server cache (3600 seconds)
  const ttl = 3600;

  return serverCache.getOrSet(cacheKey, ttl, async () => {
    const rawArticles = await fetchLiveFinancialRss(category);

    // Extract unique sources with favicons
    const sourceMap = new Map<string, SourceInfo>();
    for (const art of rawArticles) {
      if (art.publisher && !sourceMap.has(art.publisher)) {
        let domain = "";
        try {
          if (art.sourceUrl) {
            domain = new URL(art.sourceUrl).hostname.replace(/^www\./, "");
          }
        } catch {
          domain = "";
        }

        sourceMap.set(art.publisher, {
          name: art.publisher,
          domain,
          favicon: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : undefined,
        });
      }
    }

    const sources = Array.from(sourceMap.values());

    const newsItems: NewsItem[] = rawArticles.slice(0, 8).map((art, idx) => ({
      id: `wire-${idx}-${art.pubDate}`,
      title: art.title,
      publisher: art.publisher,
      link: art.link,
      publishedAt: art.pubDate,
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
