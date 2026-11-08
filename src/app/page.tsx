"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { SubHeader } from "@/components/SubHeader";
import { TopAssetsStrip } from "@/components/TopAssetsStrip";
import { MarketSummary, SourceItem } from "@/components/MarketSummary";
import { WatchlistWidget } from "@/components/WatchlistWidget";
import { PredictionWidget } from "@/components/PredictionWidget";
import { MarketMoversWidget } from "@/components/MarketMoversWidget";
import { MarketHeatmap } from "@/components/MarketHeatmap";
import { SearchModal } from "@/components/SearchModal";
import { CryptoView } from "@/components/views/CryptoView";
import { PredictionsView } from "@/components/views/PredictionsView";
import { WatchlistView } from "@/components/views/WatchlistView";
import { PageContainer, TwoColumnLayout } from "@/components/ui/layout";
import { AssetQuote, NewsItem, MarketSentiment, DashboardTab } from "@/lib/types";

export default function Home() {
  const [region, setRegion] = useState<"IN" | "US">("IN");
  const [activeTab, setActiveTab] = useState<DashboardTab>("Markets");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Dynamic Data States
  const [assets, setAssets] = useState<AssetQuote[]>([]);
  const [watchlist, setWatchlist] = useState<AssetQuote[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [sourcesCount, setSourcesCount] = useState<number>(0);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [sentiment, setSentiment] = useState<MarketSentiment | null>(null);

  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Watchlist Symbols
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([
    "MSFT",
    "AAPL",
    "NVDA",
  ]);

  // In-memory client caches for region switching (60-second freshness window)
  const assetsCacheRef = useRef<Record<string, { assets: AssetQuote[]; timestamp: number }>>({});
  const newsCacheRef = useRef<Record<string, { news: NewsItem[]; sourcesCount: number; sources: SourceItem[]; lastUpdated: Date; timestamp: number }>>({});

  // Fetch Top Assets (serves instantly from memory if region was recently loaded)
  const fetchAssets = useCallback(async (selectedRegion: "IN" | "US") => {
    const cached = assetsCacheRef.current[selectedRegion];
    const now = Date.now();
    if (cached && now - cached.timestamp < 60000) {
      setAssets(cached.assets);
      setIsLoadingAssets(false);
      return;
    }

    setIsLoadingAssets(true);
    try {
      const res = await fetch(`/api/assets?region=${selectedRegion}`);
      const data = await res.json();
      if (data.assets) {
        assetsCacheRef.current[selectedRegion] = {
          assets: data.assets,
          timestamp: Date.now(),
        };
        setAssets(data.assets);
      }
    } catch (err) {
      console.error("Failed to load assets:", err);
    } finally {
      setIsLoadingAssets(false);
    }
  }, []);

  // Fetch Market News Summary (Perplexity-style Live Wire & Synthesis)
  const fetchNews = useCallback(async (selectedRegion: "IN" | "US") => {
    const cached = newsCacheRef.current[selectedRegion];
    const now = Date.now();
    if (cached && now - cached.timestamp < 60000) {
      setNews(cached.news);
      setSourcesCount(cached.sourcesCount);
      setSources(cached.sources);
      setLastUpdated(cached.lastUpdated);
      setIsLoadingNews(false);
      return;
    }

    setIsLoadingNews(true);
    try {
      const res = await fetch(`/api/news?region=${selectedRegion}`);
      const data = await res.json();
      if (data.news) {
        const itemDate = data.lastUpdated ? new Date(data.lastUpdated) : new Date();
        newsCacheRef.current[selectedRegion] = {
          news: data.news,
          sourcesCount: data.sourcesCount || data.news.length,
          sources: data.sources || [],
          lastUpdated: itemDate,
          timestamp: Date.now(),
        };
        setNews(data.news);
        setSourcesCount(data.sourcesCount || data.news.length);
        setSources(data.sources || []);
        setLastUpdated(itemDate);
      }
    } catch (err) {
      console.error("Failed to load news:", err);
    } finally {
      setIsLoadingNews(false);
    }
  }, []);

  // Fetch Watchlist
  const fetchWatchlist = useCallback(async (symbols: string[]) => {
    setIsLoadingWatchlist(true);
    try {
      const res = await fetch(`/api/watchlist?symbols=${symbols.join(",")}`);
      const data = await res.json();
      if (data.quotes) {
        setWatchlist(data.quotes);
      }
    } catch (err) {
      console.error("Failed to load watchlist:", err);
    } finally {
      setIsLoadingWatchlist(false);
    }
  }, []);

  // Fetch Market Status & Sentiment
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      if (data.status) {
        setSentiment(data.status);
      }
    } catch (err) {
      console.error("Failed to load market status:", err);
    }
  }, []);

  // Initial Load & Region Change
  useEffect(() => {
    fetchAssets(region);
    fetchNews(region);
    fetchStatus();
  }, [region, fetchAssets, fetchNews, fetchStatus]);

  useEffect(() => {
    fetchWatchlist(watchlistSymbols);
  }, [watchlistSymbols, fetchWatchlist]);

  // Live polling every 30 seconds - automatically paused when browser tab is inactive/hidden
  useEffect(() => {
    const poll = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return; // Skip poll if user is not viewing the tab, saving compute & bandwidth
      }
      fetch(`/api/assets?region=${region}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.assets) {
            assetsCacheRef.current[region] = { assets: d.assets, timestamp: Date.now() };
            setAssets(d.assets);
          }
        })
        .catch(() => null);

      fetchWatchlist(watchlistSymbols);
      fetchStatus();
    };

    const interval = setInterval(poll, 30000);

    // Refresh immediately when returning to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        poll();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [region, watchlistSymbols, fetchWatchlist, fetchStatus]);

  // Synchronize tab state with URL search param and browser Back/Forward history
  const handleTabChange = useCallback((tab: DashboardTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      if (tab === "Markets") {
        currentUrl.searchParams.delete("tab");
      } else {
        currentUrl.searchParams.set("tab", tab.toLowerCase());
      }
      window.history.pushState({ tab }, "", currentUrl.toString());
    }
  }, []);

  useEffect(() => {
    const syncTabFromUrl = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab")?.toLowerCase();

      const tabMap: Record<string, DashboardTab> = {
        markets: "Markets",
        crypto: "Crypto",
        predictions: "Predictions",
        watchlist: "Watchlist",
      };

      if (tabParam && tabMap[tabParam]) {
        setActiveTab(tabMap[tabParam]);
      } else {
        setActiveTab("Markets");
      }
    };

    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);
    return () => window.removeEventListener("popstate", syncTabFromUrl);
  }, []);

  const handleSelectSymbol = (symbol: string) => {
    if (!watchlistSymbols.includes(symbol)) {
      setWatchlistSymbols((prev) => [symbol, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col font-sans">
      {/* Full-width Top Header */}
      <Header onOpenSearch={() => setIsSearchOpen(true)} />

      {/* Full-width Sub Header */}
      <SubHeader
        region={region}
        onRegionChange={(newRegion) => {
          setRegion(newRegion);
          handleTabChange("Markets");
        }}
        sentiment={sentiment}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Centered Page Content Container */}
      <main className="flex-1 py-[var(--space-5)]">
        <PageContainer>
          {/* Tab 1: Markets Overview */}
          {activeTab === "Markets" && (
            <TwoColumnLayout
              main={
                <div className="flex flex-col gap-[var(--space-6)]">
                  <TopAssetsStrip
                    assets={assets}
                    region={region}
                    onRegionToggle={() => setRegion(region === "IN" ? "US" : "IN")}
                    isLoading={isLoadingAssets}
                    onRefresh={() => fetchAssets(region)}
                  />

                  <MarketSummary
                    news={news}
                    isLoading={isLoadingNews}
                    lastUpdated={lastUpdated}
                    sourcesCount={sourcesCount}
                    sources={sources}
                  />

                  <MarketHeatmap region={region} />
                </div>
              }
              sidebar={
                <div className="flex flex-col gap-[var(--space-6)]">
                  <WatchlistWidget
                    items={watchlist}
                    isLoading={isLoadingWatchlist}
                    onManageWatchlist={() => setIsSearchOpen(true)}
                  />

                  <PredictionWidget />

                  <MarketMoversWidget region={region} />
                </div>
              }
            />
          )}

          {/* Tab 2: Crypto View */}
          {activeTab === "Crypto" && (
            <CryptoView
              watchlist={watchlist}
              isLoadingWatchlist={isLoadingWatchlist}
              onOpenSearch={() => setIsSearchOpen(true)}
            />
          )}

          {/* Tab 3: Predictions View */}
          {activeTab === "Predictions" && (
            <PredictionsView
              region={region}
              watchlist={watchlist}
              isLoadingWatchlist={isLoadingWatchlist}
              onOpenSearch={() => setIsSearchOpen(true)}
            />
          )}

          {/* Tab 4: Watchlist View */}
          {activeTab === "Watchlist" && (
            <WatchlistView
              watchlist={watchlist}
              isLoadingWatchlist={isLoadingWatchlist}
              onOpenSearch={() => setIsSearchOpen(true)}
            />
          )}
        </PageContainer>
      </main>

      {/* Live Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSymbol={handleSelectSymbol}
      />
    </div>
  );
}
