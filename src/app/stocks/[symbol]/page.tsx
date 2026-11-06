"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import {
  Star,
  BellRing,
  TrendingUp,
  Share2,
  Menu,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Header } from "@/components/Header";
import { SearchModal } from "@/components/SearchModal";
import { InteractiveStockChart } from "@/components/stock/InteractiveStockChart";
import { KeyStatsGrid } from "@/components/stock/KeyStatsGrid";
import { CompanyProfileWidget } from "@/components/stock/CompanyProfileWidget";
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

  // Flag emoji based on country
  const getCountryFlag = (country?: string) => {
    if (!country) return "🌐";
    if (country.toLowerCase().includes("india")) return "🇮🇳";
    if (country.toLowerCase().includes("united states") || country.toLowerCase().includes("us")) return "🇺🇸";
    return "🌐";
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-neutral-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Header with Breadcrumb */}
      <header className="sticky top-0 z-40 w-full border-b border-[#1E2430] bg-[#0A0D14]/90 backdrop-blur-md px-4 lg:px-8 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Breadcrumb Logo */}
          <div className="flex items-center gap-2 cursor-pointer text-sm">
            <Link
              href="/"
              className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-white">Stockly Finance</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
            <span className="font-semibold text-emerald-400 font-mono">
              {symbol}
            </span>
          </div>

          {/* Search Trigger */}
          <div className="flex-1 max-w-lg mx-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-neutral-400 bg-[#121620] hover:bg-[#161B26] border border-[#222838] rounded-lg transition-all"
            >
              <span>Search for stocks, crypto, and more...</span>
              <kbd className="hidden sm:inline px-1 py-0.5 text-[10px] font-mono text-neutral-500 bg-[#1A202E] rounded">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#151A24] text-neutral-300 hover:text-white transition-colors text-xs border border-neutral-800">
              <Share2 className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button className="p-2 rounded-lg hover:bg-[#151A24] text-neutral-400 hover:text-white">
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Stock Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 lg:px-8 py-6">
        {isLoadingStock && !stock ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <span className="text-sm">Fetching real-time data for {symbol} from Yahoo Finance...</span>
          </div>
        ) : !stock ? (
          <div className="p-12 text-center text-neutral-400">
            <h2 className="text-lg font-semibold text-white mb-2">Symbol Not Found</h2>
            <p className="text-xs mb-4">Could not retrieve stock details for {symbol}.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
          </div>
        ) : (
          <div>
            {/* Stock Title Banner matching Screenshot */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3.5">
                {/* Brand Logo Box */}
                <div className="w-12 h-12 rounded-xl bg-[#131B2A] border border-[#222E46] flex items-center justify-center font-bold text-white text-base overflow-hidden shrink-0">
                  {symbol === "NVDA" ? (
                    <div className="w-full h-full bg-[#76B900] flex items-center justify-center font-black text-black text-xs">
                      nVIDIA
                    </div>
                  ) : symbol === "MSFT" ? (
                    <div className="grid grid-cols-2 gap-0.5 p-2 w-7 h-7">
                      <div className="bg-[#F25022]"></div>
                      <div className="bg-[#7FBA00]"></div>
                      <div className="bg-[#00A4EF]"></div>
                      <div className="bg-[#FFB900]"></div>
                    </div>
                  ) : (
                    <span className="font-mono text-emerald-400">
                      {symbol.slice(0, 3)}
                    </span>
                  )}
                </div>

                {/* Company Name & Ticker Subtitle */}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                    {stock.name}
                  </h1>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono mt-0.5">
                    <span>{stock.symbol}</span>
                    <span>•</span>
                    <span>{stock.exchange}</span>
                    <span>•</span>
                    <span>{getCountryFlag(stock.country)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Follow & Price Alert */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isFollowing
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : "bg-[#11151F] border-[#1E2536] text-neutral-300 hover:text-white hover:bg-[#161B26]"
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isFollowing ? "fill-emerald-400" : ""}`} />
                  <span>{isFollowing ? "Following" : "Follow"}</span>
                </button>

                <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#11151F] border border-[#1E2536] text-neutral-300 hover:text-white hover:bg-[#161B26] transition-all">
                  <BellRing className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Price Alert</span>
                </button>
              </div>
            </div>

            {/* Sub Tabs: Overview, Financials, Earnings, etc. */}
            <div className="flex items-center gap-2 border-b border-[#1A202C] mb-6 overflow-x-auto no-scrollbar">
              {STOCK_TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? "text-white border-b-2 border-white font-semibold"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Main Content Grid: 8 cols chart, 4 cols profile */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Interactive Chart + Key Stats */}
              <div className="lg:col-span-8 flex flex-col">
                <InteractiveStockChart
                  symbol={stock.symbol}
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

                {/* Key Statistics Grid */}
                <KeyStatsGrid stock={stock} />
              </div>

              {/* Right Column: Company Profile & Analyst Consensus */}
              <div className="lg:col-span-4 flex flex-col">
                <CompanyProfileWidget stock={stock} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSymbol={handleSelectSymbol}
      />
    </div>
  );
}
