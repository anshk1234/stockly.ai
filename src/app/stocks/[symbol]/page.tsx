"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import {
  Star,
  BellRing,
  Sparkles,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { SearchModal } from "@/components/SearchModal";
import { SearchDropdown } from "@/components/SearchDropdown";
import { TickerLogo } from "@/components/ui/TickerLogo";
import { InteractiveStockChart } from "@/components/stock/InteractiveStockChart";
import { KeyStatsGrid } from "@/components/stock/KeyStatsGrid";
import { CompanyProfileWidget } from "@/components/stock/CompanyProfileWidget";
import { PageContainer, TwoColumnLayout, Card, SectionTitle } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/Skeleton";
import { DetailedStockQuote, CandlePoint, TimeRange } from "@/lib/types";

const STOCK_TABS = [
  "Overview",
  "Financials",
  "Earnings",
  "Holders",
  "Predictions",
  "Historical Data",
  "Analysis",
];

export default function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const resolvedParams = use(params);
  const symbol = decodeURIComponent(resolvedParams.symbol).toUpperCase();

  const [stock, setStock] = useState<DetailedStockQuote | null>(null);
  const [candles, setCandles] = useState<CandlePoint[]>([]);
  const [previousClose, setPreviousClose] = useState<number>(0);
  const [currentRange, setCurrentRange] = useState<TimeRange>("1D");
  const [activeTab, setActiveTab] = useState("Overview");
  const [isFollowing, setIsFollowing] = useState(false);

  const [isLoadingStock, setIsLoadingStock] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Fetch Stock Details
  const fetchStock = useCallback(async () => {
    setIsLoadingStock(true);
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}`);
      const data = await res.json();
      if (data.stock) {
        setStock(data.stock);
      }
    } catch (err) {
      console.error("Error fetching stock:", err);
    } finally {
      setIsLoadingStock(false);
    }
  }, [symbol]);

  // Fetch Chart Data for Range
  const fetchChart = useCallback(async (range: TimeRange) => {
    setIsLoadingChart(true);
    try {
      const res = await fetch(
        `/api/stock/${encodeURIComponent(symbol)}/chart?range=${range}`
      );
      const data = await res.json();
      if (data.candles) {
        setCandles(data.candles);
        if (data.previousClose) {
          setPreviousClose(data.previousClose);
        }
      }
    } catch (err) {
      console.error("Error fetching chart data:", err);
    } finally {
      setIsLoadingChart(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchStock();
    fetchChart(currentRange);
  }, [fetchStock, fetchChart, currentRange]);

  const handleRangeChange = (newRange: TimeRange) => {
    setCurrentRange(newRange);
  };

  const handleSelectSymbol = (selectedSymbol: string) => {
    window.location.href = `/stocks/${encodeURIComponent(selectedSymbol)}`;
  };

  const getCountryFlag = (country?: string) => {
    if (!country) return "🌐";
    if (country === "India" || country === "IN") return "🇮🇳";
    if (country === "United States" || country === "US") return "🇺🇸";
    return "🌐";
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col font-sans">
      {/* Top Header */}
      <header className="w-full border-b border-[var(--border)] bg-[var(--bg-page)]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="w-full px-6 lg:px-8 py-2.5 grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex items-center justify-start shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-[7px] overflow-hidden flex items-center justify-center shrink-0 border border-white/10 shadow-sm"><img src="/icon.svg" alt="Stockly" className="w-full h-full object-cover" /></div>
              <span className="font-[var(--weight-medium)] text-[14px] text-[var(--text-primary)] tracking-tight whitespace-nowrap">
                Stockly <span className="text-[var(--text-muted)] font-[var(--weight-regular)]">Finance</span>
              </span>
            </Link>
          </div>

          <div className="w-full max-w-[460px] mx-auto">
            <SearchDropdown onSelectSymbol={handleSelectSymbol} />
          </div>

          <div className="flex items-center justify-end gap-2.5 shrink-0">
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`p-1.5 rounded-full border transition-colors ${
                isFollowing
                  ? "bg-[var(--positive)]/15 border-[var(--positive)]/30 text-[var(--positive)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
              }`}
              title={isFollowing ? "Following" : "Follow ticker"}
            >
              <Star className={`w-4 h-4 ${isFollowing ? "fill-[var(--positive)]" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Stock Workspace inside PageContainer */}
      <main className="flex-1 py-[var(--space-5)]">
        <PageContainer>
          {isLoadingStock && !stock ? (
            /* Full Page Shimmer Skeleton Loading State */
            <div className="w-full">
              {/* Header Banner Skeleton */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[var(--space-3)] mb-[var(--space-4)]">
                <div className="flex items-center gap-[var(--space-3)]">
                  <Skeleton className="w-[42px] h-[42px] rounded-lg shrink-0" />
                  <div>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                </div>
                <div className="flex items-center gap-[var(--space-2)]">
                  <Skeleton className="h-8 w-24 rounded-[var(--radius-card)]" />
                  <Skeleton className="h-8 w-28 rounded-[var(--radius-card)]" />
                </div>
              </div>

              {/* Sub Tabs Skeleton */}
              <div className="flex items-center gap-3 border-b border-[var(--border)] mb-[var(--space-5)] pb-2 overflow-x-hidden">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-20 rounded" />
                ))}
              </div>

              {/* Two Column Workspace Skeleton */}
              <TwoColumnLayout
                main={
                  <div className="flex flex-col gap-[var(--space-4)]">
                    {/* Chart Card Skeleton */}
                    <Card className="p-[16px] flex flex-col gap-4">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <Skeleton className="h-7 w-36 mb-2" />
                          <Skeleton className="h-3.5 w-24" />
                        </div>
                        <div className="flex gap-1.5">
                          {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-6 w-9 rounded-md" />
                          ))}
                        </div>
                      </div>
                      <Skeleton className="w-full h-[320px] rounded-lg" />
                    </Card>

                    {/* Key Stats Card Skeleton */}
                    <div>
                      <Skeleton className="h-4 w-28 mb-2.5" />
                      <Card className="p-[18px]">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-5">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex flex-col gap-1.5">
                              <Skeleton className="h-3 w-16" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </div>
                }
                sidebar={
                  <div className="flex flex-col gap-[var(--space-6)] w-full">
                    <div>
                      <Skeleton className="h-4 w-16 mb-2.5" />
                      <Card className="divide-y divide-[var(--border)]">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="flex items-center justify-between px-[16px] py-[12px]">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-28" />
                          </div>
                        ))}
                        <div className="p-[16px] space-y-2">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-4/5" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </Card>
                    </div>
                  </div>
                }
              />
            </div>
          ) : !stock ? (
            <div className="p-10 text-center text-[var(--text-muted)]">
              <h2 className="text-[var(--text-md)] font-[var(--weight-medium)] text-[var(--text-primary)] mb-1.5">
                Symbol Not Found
              </h2>
              <p className="text-[var(--text-xs)] mb-3">Could not retrieve stock details for {symbol}.</p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius-card)] bg-[var(--positive)] text-black font-[var(--weight-medium)] text-[var(--text-xs)]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Home
              </Link>
            </div>
          ) : (
            <div>
              {/* Stock Title Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[var(--space-3)] mb-[var(--space-4)]">
                <div className="flex items-center gap-[var(--space-3)]">
                  {/* Dynamic Brand Logo from Domain / Favicon CDN */}
                  <TickerLogo symbol={symbol} domain={stock.website} name={stock.name} size={42} />

                  {/* Company Name & Ticker Subtitle */}
                  <div>
                    <h1 className="text-[var(--text-lg)] font-[var(--weight-medium)] text-[var(--text-primary)] tracking-tight leading-tight">
                      {stock.name}
                    </h1>
                    <div className="flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--text-muted)] mt-0.5">
                      <span>{stock.symbol}</span>
                      <span>•</span>
                      <span>{stock.exchange}</span>
                      <span>•</span>
                      <span>{getCountryFlag(stock.country)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-[var(--space-2)]">
                  <button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-card)] text-[var(--text-xs)] font-[var(--weight-medium)] border transition-all ${
                      isFollowing
                        ? "bg-[var(--positive)]/10 border-[var(--positive)]/30 text-[var(--positive)]"
                        : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isFollowing ? "fill-[var(--positive)]" : ""}`} />
                    <span>{isFollowing ? "Following" : "Follow"}</span>
                  </button>

                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-card)] text-[var(--text-xs)] font-[var(--weight-medium)] bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all">
                    <BellRing className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>Price Alert</span>
                  </button>
                </div>
              </div>

              {/* Sub Tabs */}
              <div className="flex items-center gap-2 border-b border-[var(--border)] mb-[var(--space-5)] overflow-x-auto no-scrollbar">
                {STOCK_TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 text-[var(--text-sm)] font-[var(--weight-medium)] transition-colors whitespace-nowrap ${
                        isActive
                          ? "text-[var(--text-primary)] border-b-2 border-[var(--text-primary)] pb-1 -mb-[1px]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* TwoColumnLayout for Stock Detail View */}
              <TwoColumnLayout
                main={
                  <div className="flex flex-col gap-[var(--space-4)]">
                    <InteractiveStockChart
                      symbol={stock.symbol}
                      name={stock.name}
                      exchange={stock.exchange}
                      currency={stock.currency}
                      initialPrice={stock.price}
                      initialChange={stock.change}
                      initialChangePercent={stock.changePercent}
                      previousClose={previousClose || stock.previousClose}
                      candles={candles}
                      currentRange={currentRange}
                      onRangeChange={handleRangeChange}
                      isLoading={isLoadingChart}
                    />

                    <KeyStatsGrid stock={stock} />
                  </div>
                }
                sidebar={<CompanyProfileWidget stock={stock} />}
              />
            </div>
          )}
        </PageContainer>
      </main>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSymbol={handleSelectSymbol}
      />
    </div>
  );
}

