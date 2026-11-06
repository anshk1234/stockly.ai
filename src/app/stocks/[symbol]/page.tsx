"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import {
  Star,
  BellRing,
  Sparkles,
  Share2,
  Menu,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from "lucide-react";
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

  const getCountryFlag = (country?: string) => {
    if (!country) return "🌐";
    if (country.toLowerCase().includes("india")) return "🇮🇳";
    if (country.toLowerCase().includes("united states") || country.toLowerCase().includes("us")) return "🇺🇸";
    return "🌐";
  };

  return (
    <div className="min-h-screen bg-[#141517] text-[#EDEDEE] flex flex-col">
      {/* Top Header with Breadcrumb */}
      <header className="sticky top-0 z-40 w-full border-b border-[#23252A] bg-[#141517]/95 backdrop-blur-md px-4 lg:px-8 py-2.5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Breadcrumb Logo */}
          <div className="flex items-center gap-2 cursor-pointer text-xs">
            <Link
              href="/"
              className="text-[#8E929B] hover:text-white transition-colors flex items-center gap-1.5"
            >
              <div className="w-5 h-5 rounded flex items-center justify-center text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-medium text-[#EDEDEE]">Stockly Finance</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#545762]" />
            <span className="font-medium text-emerald-400 font-mono">
              {symbol}
            </span>
          </div>

          {/* Search Trigger */}
          <div className="flex-1 max-w-lg mx-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-[#8E929B] bg-[#1B1C20] hover:bg-[#202227] border border-[#282A2F] rounded-lg transition-all"
            >
              <span>Search for stocks, crypto, and more...</span>
              <kbd className="hidden sm:inline px-1 py-0.5 text-[10px] font-mono text-[#6D717B] bg-[#22242A] rounded">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 text-xs">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#1E1F24] text-[#A1A4AC] hover:text-white transition-colors">
              <Share2 className="w-3.5 h-3.5 text-[#7F838D]" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button className="p-1.5 rounded-lg hover:bg-[#1E1F24] text-[#7F838D] hover:text-white">
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Stock Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 lg:px-8 py-6">
        {isLoadingStock && !stock ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#8E929B]">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-400 mb-2.5" />
            <span className="text-xs">Fetching real-time data for {symbol} from Yahoo Finance...</span>
          </div>
        ) : !stock ? (
          <div className="p-10 text-center text-[#8E929B]">
            <h2 className="text-base font-semibold text-white mb-1.5">Symbol Not Found</h2>
            <p className="text-xs mb-3">Could not retrieve stock details for {symbol}.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
          </div>
        ) : (
          <div>
            {/* Stock Title Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                {/* Brand Logo Box */}
                <div className="w-10 h-10 rounded-xl bg-[#202227] border border-[#2B2D34] flex items-center justify-center font-bold text-white text-xs overflow-hidden shrink-0">
                  {symbol === "NVDA" ? (
                    <div className="w-full h-full bg-[#76B900] flex items-center justify-center font-black text-black text-[11px]">
                      nVIDIA
                    </div>
                  ) : symbol === "MSFT" ? (
                    <div className="grid grid-cols-2 gap-0.5 p-1.5 w-6 h-6">
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
                  <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight">
                    {stock.name}
                  </h1>
                  <div className="flex items-center gap-1.5 text-xs text-[#8E929B] font-mono mt-0.5">
                    <span>{stock.symbol}</span>
                    <span>•</span>
                    <span>{stock.exchange}</span>
                    <span>•</span>
                    <span>{getCountryFlag(stock.country)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isFollowing
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-[#1B1C20] border-[#26282E] text-[#EDEDEE] hover:bg-[#22242A]"
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isFollowing ? "fill-emerald-400" : ""}`} />
                  <span>{isFollowing ? "Following" : "Follow"}</span>
                </button>

                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1B1C20] border border-[#26282E] text-[#EDEDEE] hover:bg-[#22242A] transition-all">
                  <BellRing className="w-3.5 h-3.5 text-[#7F838D]" />
                  <span>Price Alert</span>
                </button>
              </div>
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center gap-2 border-b border-[#23252A] mb-5 overflow-x-auto no-scrollbar">
              {STOCK_TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? "text-white border-b border-white"
                        : "text-[#8E929B] hover:text-[#EDEDEE]"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Chart + Key Stats */}
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

                <KeyStatsGrid stock={stock} />
              </div>

              {/* Right: Profile */}
              <div className="lg:col-span-4 flex flex-col">
                <CompanyProfileWidget stock={stock} />
              </div>
            </div>
          </div>
        )}
      </main>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSymbol={handleSelectSymbol}
      />
    </div>
  );
}
