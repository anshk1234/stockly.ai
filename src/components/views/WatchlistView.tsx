"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SlidersHorizontal, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, ChevronDown } from "lucide-react";
import { AssetQuote, TimeRange, CandlePoint } from "@/lib/types";
import { formatPrice, formatPercent } from "@/lib/utils";
import { PredictionWidget } from "@/components/PredictionWidget";
import { InteractiveStockChart } from "@/components/stock/InteractiveStockChart";

interface WatchlistViewProps {
  watchlist: AssetQuote[];
  isLoadingWatchlist: boolean;
  onOpenSearch: () => void;
}

const RANGES: TimeRange[] = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"];

export function WatchlistView({
  watchlist,
  isLoadingWatchlist,
  onOpenSearch,
}: WatchlistViewProps) {
  const [selectedStock, setSelectedStock] = useState<AssetQuote | null>(null);
  const [currentRange, setCurrentRange] = useState<TimeRange>("1D");
  const [candles, setCandles] = useState<CandlePoint[]>([]);
  const [previousClose, setPreviousClose] = useState<number>(0);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  useEffect(() => {
    if (watchlist.length > 0 && !selectedStock) {
      setSelectedStock(watchlist[0]);
    }
  }, [watchlist, selectedStock]);

  const activeSymbol = selectedStock?.symbol || "MSFT";

  useEffect(() => {
    async function loadChart() {
      setIsLoadingChart(true);
      try {
        const res = await fetch(`/api/stock/${encodeURIComponent(activeSymbol)}/chart?range=${currentRange}`);
        const data = await res.json();
        if (data.candles) setCandles(data.candles);
        if (data.previousClose) setPreviousClose(data.previousClose);
      } catch (err) {
        console.error("Failed to load watchlist chart:", err);
      } finally {
        setIsLoadingChart(false);
      }
    }
    loadChart();
  }, [activeSymbol, currentRange]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Watchlist Table & Watchlist Movers Chart */}
      <section className="lg:col-span-8 flex flex-col gap-5">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[#EDEDEE] tracking-tight">My Watchlist</h2>
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 text-xs text-[#8E929B] hover:text-white transition-colors"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Manage Watchlist</span>
          </button>
        </div>

        {/* Watchlist Digest Card */}
        <div className="p-4 rounded-xl bg-[#1B1C20] border border-[#26282E]">
          {/* Narrative Paragraph */}
          <div className="text-xs text-[#989BA3] leading-relaxed mb-4">
            <p className="mb-2">
              <span className="text-white font-medium">Microsoft </span>
              <span className="text-rose-400 font-semibold">↘ 3.58% </span>
              is the primary holding in focus. It closed down 3.58% at $535.93, giving back part of the prior session&apos;s 6.7% surge. Shares traded between $532.70 and $557.62 on volume of about 41.6M, sitting just below the 52-week high with a market cap near $3.98T.
            </p>
            <p>
              The decline is part of an AI-led tech sector rotation. Fundamentals remain solid: Azure enterprise cloud revenue grew 48%, the commercial backlog is $677B, and analyst consensus remains firmly in overweight territory.
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#6D717B] pt-2 border-t border-[#23252A] mb-4">
            <span className="px-1.5 py-0.5 rounded bg-[#24262C] text-[#8E929B] text-[10px]">
              15 sources
            </span>
            <span>Updated just now</span>
          </div>

          {/* Multi-Period Performance Table */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#6D717B] text-[11px] border-b border-[#23252A]">
                  <th className="text-left pb-2 font-medium">Asset</th>
                  <th className="text-right pb-2 font-medium">Price</th>
                  <th className="text-right pb-2 font-medium">1D</th>
                  <th className="text-right pb-2 font-medium">5D</th>
                  <th className="text-right pb-2 font-medium">1M</th>
                  <th className="text-right pb-2 font-medium">6M</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23252A]">
                {watchlist.map((stock) => {
                  const isSelected = selectedStock?.symbol === stock.symbol;
                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#22242A]" : "hover:bg-[#1E2025]"
                      }`}
                    >
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-[#24262C] flex items-center justify-center font-bold text-[10px] text-white">
                            {stock.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-medium text-white">{stock.name}</div>
                            <div className="text-[10px] text-[#717580] font-mono">{stock.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-white font-medium">
                        {formatPrice(stock.price, stock.currency)}
                      </td>
                      <td className={`py-2.5 text-right font-mono tabular-nums ${
                        (stock.perf1D ?? stock.changePercent) >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {formatPercent(stock.perf1D ?? stock.changePercent)}
                      </td>
                      <td className={`py-2.5 text-right font-mono tabular-nums ${
                        (stock.perf5D ?? 2.03) >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {formatPercent(stock.perf5D ?? 2.03)}
                      </td>
                      <td className={`py-2.5 text-right font-mono tabular-nums ${
                        (stock.perf1M ?? 1.25) >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {formatPercent(stock.perf1M ?? 1.25)}
                      </td>
                      <td className={`py-2.5 text-right font-mono tabular-nums ${
                        (stock.perf6M ?? 29.46) >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {formatPercent(stock.perf6M ?? 29.46)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Watchlist Movers Interactive Chart */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-semibold text-[#EDEDEE] tracking-tight">Watchlist Movers</h2>
            <div className="text-[11px] text-[#8E929B] font-mono">
              Displaying: <span className="text-emerald-400 font-semibold">{activeSymbol}</span>
            </div>
          </div>

          {selectedStock && (
            <InteractiveStockChart
              symbol={selectedStock.symbol}
              currency={selectedStock.currency}
              initialPrice={selectedStock.price}
              initialChange={selectedStock.change}
              initialChangePercent={selectedStock.changePercent}
              previousClose={previousClose || selectedStock.price}
              candles={candles}
              currentRange={currentRange}
              onRangeChange={(r) => setCurrentRange(r)}
              isLoading={isLoadingChart}
            />
          )}
        </div>
      </section>

      {/* Right Column: Prediction Markets */}
      <aside className="lg:col-span-4 flex flex-col gap-6">
        <PredictionWidget />
      </aside>
    </div>
  );
}
