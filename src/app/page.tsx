"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { SubHeader } from "@/components/SubHeader";
import { TopAssetsStrip } from "@/components/TopAssetsStrip";
import { MarketSummary } from "@/components/MarketSummary";
import { WatchlistWidget } from "@/components/WatchlistWidget";
import { PredictionWidget } from "@/components/PredictionWidget";
import { SearchModal } from "@/components/SearchModal";
import { AssetQuote, NewsItem, MarketSentiment } from "@/lib/types";

export default function Home() {
  const [region, setRegion] = useState<"IN" | "US">("IN");
  const [activeTab, setActiveTab] = useState("India Markets");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Dynamic Data States
  const [assets, setAssets] = useState<AssetQuote[]>([]);
  const [watchlist, setWatchlist] = useState<AssetQuote[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
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

  // Fetch Market News
  const fetchNews = useCallback(async (selectedRegion: "IN" | "US") => {
    setIsLoadingNews(true);
    try {
      const res = await fetch(`/api/news?region=${selectedRegion}`);
      const data = await res.json();
      if (data.news) {
        setNews(data.news);
        setLastUpdated(new Date());
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
    <div className="min-h-screen bg-[#141517] text-[#EDEDEE] flex flex-col">
      {/* Top Header */}
      <Header onOpenSearch={() => setIsSearchOpen(true)} />

      {/* Sub Header Navigation & Market Sentiment */}
      <SubHeader
        region={region}
        onRegionChange={(newRegion) => setRegion(newRegion)}
        sentiment={sentiment}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Main Content Grid */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left / Center Main Content (8 cols on lg) */}
          <section className="lg:col-span-8 flex flex-col">
            {/* Top Assets Horizontal Sparkline Strip */}
            <TopAssetsStrip
              assets={assets}
              region={region}
              onRegionToggle={() => setRegion(region === "IN" ? "US" : "IN")}
              isLoading={isLoadingAssets}
              onRefresh={() => fetchAssets(region)}
            />

            {/* Market Summary Accordion */}
            <MarketSummary
              news={news}
              isLoading={isLoadingNews}
              lastUpdated={lastUpdated}
            />
          </section>

          {/* Right Sidebar (4 cols on lg) */}
          <aside className="lg:col-span-4 flex flex-col">
            {/* Watchlist Section */}
            <WatchlistWidget
              items={watchlist}
              isLoading={isLoadingWatchlist}
              onManageWatchlist={() => setIsSearchOpen(true)}
            />

            {/* Prediction Markets Section */}
            <PredictionWidget />
          </aside>
        </div>
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
