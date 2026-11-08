"use client";

import React, { useState, useEffect, useRef } from "react";
import { SlidersHorizontal } from "lucide-react";
import { AssetQuote, TimeRange, CandlePoint } from "@/lib/types";
import { formatPrice, formatPercent } from "@/lib/utils";
import { PredictionWidget } from "@/components/PredictionWidget";
import { InteractiveStockChart } from "@/components/stock/InteractiveStockChart";
import { TwoColumnLayout, Card, SectionTitle } from "@/components/ui/layout";

interface WatchlistViewProps {
  watchlist: AssetQuote[];
  isLoadingWatchlist: boolean;
  onOpenSearch: () => void;
}

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

  // In-memory client cache for watchlist charts (60-second freshness window)
  const chartCacheRef = useRef<Record<string, { candles: CandlePoint[]; previousClose?: number; timestamp: number }>>({});

  useEffect(() => {
    async function loadChart() {
      const cacheKey = `${activeSymbol}-${currentRange}`;
      const cached = chartCacheRef.current[cacheKey];
      const now = Date.now();
      if (cached && now - cached.timestamp < 60000) {
        setCandles(cached.candles);
        if (cached.previousClose) setPreviousClose(cached.previousClose);
        setIsLoadingChart(false);
        return;
      }

      setIsLoadingChart(true);
      try {
        const res = await fetch(`/api/stock/${encodeURIComponent(activeSymbol)}/chart?range=${currentRange}`);
        const data = await res.json();
        if (data.candles) {
          chartCacheRef.current[cacheKey] = {
            candles: data.candles,
            previousClose: data.previousClose,
            timestamp: Date.now(),
          };
          setCandles(data.candles);
        }
        if (data.previousClose) setPreviousClose(data.previousClose);
      } catch (err) {
        console.error("Failed to load watchlist chart:", err);
      } finally {
        setIsLoadingChart(false);
      }
    }
    loadChart();
  }, [activeSymbol, currentRange]);

  const mainContent = (
    <div className="flex flex-col gap-[var(--space-6)]">
      {/* Top Section */}
      <div>
        <SectionTitle
          action={
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-[var(--weight-regular)]"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Manage Watchlist</span>
            </button>
          }
        >
          My Watchlist
        </SectionTitle>

        {/* Watchlist Digest Card */}
        <Card>
          <div className="p-[16px] text-[var(--text-xs)] text-[var(--text-muted)] leading-relaxed border-b border-[var(--border)]">
            <p className="mb-2">
              <span className="text-[var(--text-primary)] font-[var(--weight-medium)]">Microsoft </span>
              <span className="text-[var(--negative)] font-[var(--weight-medium)]">↘ 3.58% </span>
              is the primary holding in focus. It closed down 3.58% at $535.93, giving back part of the prior session&apos;s 6.7% surge. Shares traded between $532.70 and $557.62 on volume of about 41.6M, sitting just below the 52-week high with a market cap near $3.98T.
            </p>
            <p>
              The decline is part of an AI-led tech sector rotation. Fundamentals remain solid: Azure enterprise cloud revenue grew 48%, the commercial backlog is $677B, and analyst consensus remains firmly in overweight territory.
            </p>

            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-3 mt-3 border-t border-[var(--border)]">
              <span className="px-1.5 py-0.5 rounded bg-[var(--bg-card-hover)] text-[var(--text-muted)] text-[10px]">
                15 sources
              </span>
              <span>Updated just now</span>
            </div>
          </div>

          {/* Multi-Period Performance Table inside the same card */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-[var(--text-xs)]">
              <thead>
                <tr className="text-[var(--text-muted)] text-[11px] border-b border-[var(--border)]">
                  <th className="text-left px-[16px] py-[10px] font-[var(--weight-medium)]">Asset</th>
                  <th className="text-right px-[16px] py-[10px] font-[var(--weight-medium)]">Price</th>
                  <th className="text-right px-[16px] py-[10px] font-[var(--weight-medium)]">1D</th>
                  <th className="text-right px-[16px] py-[10px] font-[var(--weight-medium)]">5D</th>
                  <th className="text-right px-[16px] py-[10px] font-[var(--weight-medium)]">1M</th>
                  <th className="text-right px-[16px] py-[10px] font-[var(--weight-medium)]">6M</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {watchlist.map((stock) => {
                  const isSelected = selectedStock?.symbol === stock.symbol;
                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[var(--bg-card-hover)]" : "hover:bg-[var(--bg-card-hover)]"
                      }`}
                    >
                      <td className="px-[16px] py-[12px]">
                        <div className="flex items-center gap-[var(--space-2)]">
                          <div className="w-6 h-6 rounded bg-[var(--bg-card-hover)] flex items-center justify-center font-[var(--weight-medium)] text-[10px] text-[var(--text-primary)]">
                            {stock.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-[var(--weight-medium)] text-[var(--text-primary)]">{stock.name}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">{stock.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-[16px] py-[12px] text-right font-[var(--weight-medium)] tabular-nums text-[var(--text-primary)]">
                        {formatPrice(stock.price, stock.currency)}
                      </td>
                      <td className={`px-[16px] py-[12px] text-right font-[var(--weight-medium)] tabular-nums ${
                        (stock.perf1D ?? stock.changePercent) >= 0 ? "text-positive" : "text-negative"
                      }`}>
                        {formatPercent(stock.perf1D ?? stock.changePercent)}
                      </td>
                      <td className={`px-[16px] py-[12px] text-right font-[var(--weight-medium)] tabular-nums ${
                        (stock.perf5D ?? 2.03) >= 0 ? "text-positive" : "text-negative"
                      }`}>
                        {formatPercent(stock.perf5D ?? 2.03)}
                      </td>
                      <td className={`px-[16px] py-[12px] text-right font-[var(--weight-medium)] tabular-nums ${
                        (stock.perf1M ?? 1.25) >= 0 ? "text-positive" : "text-negative"
                      }`}>
                        {formatPercent(stock.perf1M ?? 1.25)}
                      </td>
                      <td className={`px-[16px] py-[12px] text-right font-[var(--weight-medium)] tabular-nums ${
                        (stock.perf6M ?? 29.46) >= 0 ? "text-positive" : "text-negative"
                      }`}>
                        {formatPercent(stock.perf6M ?? 29.46)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Watchlist Movers Interactive Chart */}
      <div>
        <SectionTitle
          action={
            <div className="text-[var(--text-xs)] text-[var(--text-muted)] font-[var(--weight-regular)]">
              Displaying: <span className="text-[var(--positive)] font-[var(--weight-medium)]">{activeSymbol}</span>
            </div>
          }
        >
          Watchlist Movers
        </SectionTitle>

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
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col gap-[var(--space-6)]">
      <PredictionWidget />
    </div>
  );

  return <TwoColumnLayout main={mainContent} sidebar={sidebarContent} />;
}
