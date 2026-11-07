"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { SubHeader } from "@/components/SubHeader";
import { TopAssetsStrip } from "@/components/TopAssetsStrip";
import { MarketSummary, SourceItem } from "@/components/MarketSummary";
import { WatchlistWidget } from "@/components/WatchlistWidget";
import { PredictionWidget } from "@/components/PredictionWidget";
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

  // Fetch Top Assets
  const fetchAssets = useCallback(async (selectedRegion: "IN" | "US") => {
    setIsLoadingAssets(true);
    try {
      const res = await fetch(`/api/assets?region=${selectedRegion}`);
      const data = await res.json();
      if (data.assets) {
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
    setIsLoadingNews(true);
    try {
      const res = await fetch(`/api/news?region=${selectedRegion}`);
      const data = await res.json();
      if (data.news) {
        setNews(data.news);
        setSourcesCount(data.sourcesCount || data.news.length);
        setSources(data.sources || []);
        setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated) : new Date());
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

  // Live polling every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAssets(region);
      fetchWatchlist(watchlistSymbols);
      fetchStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [region, watchlistSymbols, fetchAssets, fetchWatchlist, fetchStatus]);

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
          setActiveTab("Markets");
        }}
        sentiment={sentiment}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
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
