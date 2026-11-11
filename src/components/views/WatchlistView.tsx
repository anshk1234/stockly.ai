"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SlidersHorizontal, Star } from "lucide-react";
import { AssetQuote, TimeRange, CandlePoint } from "@/lib/types";
import { formatPrice, formatPercent } from "@/lib/utils";
import { PredictionWidget } from "@/components/PredictionWidget";
import { FinancialDisclaimer } from "@/components/FinancialDisclaimer";
import { InteractiveStockChart } from "@/components/stock/InteractiveStockChart";
import { TwoColumnLayout, Card, SectionTitle } from "@/components/ui/layout";
import { TickerLogo } from "@/components/ui/TickerLogo";
import { useApp } from "@/context/AppContext";

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

interface WatchlistViewProps {
  watchlist: AssetQuote[];
  isLoadingWatchlist: boolean;
  onOpenSearch: () => void;
}

export function WatchlistView({
  watchlist,
  isLoadingWatchlist: _isLoadingWatchlist,
  onOpenSearch: _onOpenSearch,
}: WatchlistViewProps) {
  const { isGuest, openAuthModal, isWatchlistSaved, toggleWatchlist, openManageWatchlist } = useApp();

  const [selectedStock, setSelectedStock] = useState<AssetQuote | null>(null);
  const [currentRange, setCurrentRange] = useState<TimeRange>("1D");
  const [candles, setCandles] = useState<CandlePoint[]>([]);
  const [previousClose, setPreviousClose] = useState<number>(0);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  useEffect(() => {
    if (watchlist.length > 0) {
      if (!selectedStock || !watchlist.some((s) => s.symbol === selectedStock.symbol)) {
        setSelectedStock(watchlist[0]);
      }
    } else {
      setSelectedStock(null);
    }
  }, [watchlist, selectedStock]);

  // Symbols from the current watchlist to display in comparison mode
  const otherWatchlistSymbols = React.useMemo(() => {
    if (!selectedStock || watchlist.length <= 1) return [];
    return watchlist
      .filter((item) => item.symbol.toUpperCase() !== selectedStock.symbol.toUpperCase())
      .map((item) => item.symbol);
  }, [watchlist, selectedStock]);

  const activeSymbol = selectedStock?.symbol || "MSFT";

  // In-memory client cache for watchlist charts (60-second freshness window)
  const chartCacheRef = useRef<Record<string, { candles: CandlePoint[]; previousClose?: number; timestamp: number }>>({});

  useEffect(() => {
    if (isGuest) return;

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
  }, [activeSymbol, currentRange, isGuest]);

  // Guest View: When user has not signed in yet
  if (isGuest) {
    const guestContent = (
      <div className="flex flex-col gap-[var(--space-6)]">
        {/* Guest Onboarding Banner */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-amber-400 stroke-[1.8]" />
          </div>
          <h2 className="text-[17px] font-semibold text-white tracking-tight">Create your watchlist</h2>
          <p className="text-[13px] text-neutral-400 max-w-md mt-1.5 mb-6 leading-relaxed">
            Sign in to create your personalized watchlist, monitor real-time movements, get AI summaries, and set price alerts across all your devices.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal("watchlist")}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-medium text-[13px] shadow-md transition-all active:scale-[0.98]"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Recommended Assets to Add */}
        <div>
          <SectionTitle>Recommended Assets to Track</SectionTitle>
          <Card>
            <div className="divide-y divide-[var(--border)]">
              {watchlist.map((stock) => {
                const isPositive = stock.changePercent >= 0;
                return (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-card-hover)] transition-colors"
                  >
                    <Link
                      href={`/stocks/${encodeURIComponent(stock.symbol)}`}
                      className="flex items-center gap-3 min-w-0 pr-3 group flex-1"
                    >
                      <TickerLogo symbol={stock.symbol} name={stock.name} size={28} />
                      <div className="min-w-0">
                        <div className="text-[13px] font-[var(--weight-medium)] text-[var(--text-primary)] group-hover:text-[var(--positive)] transition-colors leading-tight truncate">
                          {stock.name}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] uppercase mt-0.5 truncate">
                          {stock.symbol} · {(stock.exchange || "NASDAQ").replace("NASDAQGS", "NASDAQ")}
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[13px] font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums">
                          {formatPrice(stock.price, stock.currency, stock.symbol)}
                        </div>
                        <div
                          className={`text-[11.5px] font-[var(--weight-medium)] tabular-nums mt-0.5 ${
                            isPositive ? "text-positive" : "text-negative"
                          }`}
                          style={{ color: isPositive ? "#3ecf8e" : "#f2555a" }}
                        >
                          {formatPercent(stock.changePercent)}
                        </div>
                      </div>

                      {(() => {
                        const isSaved = isWatchlistSaved(stock.symbol);
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              if (isGuest) {
                                openAuthModal("watchlist");
                              } else {
                                toggleWatchlist(stock.symbol, stock.name);
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSaved
                                ? "text-amber-400 hover:text-amber-300"
                                : "text-neutral-400 hover:text-amber-400 hover:bg-white/5"
                            }`}
                            title={
                              isGuest
                                ? "Sign in to add to watchlist"
                                : isSaved
                                ? "Remove from watchlist"
                                : "Add to watchlist"
                            }
                          >
                            <Star className={`w-4 h-4 stroke-[1.5] ${isSaved ? "fill-amber-400" : ""}`} />
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    );

    const guestSidebar = (
      <div className="flex flex-col gap-[var(--space-6)]">
        <PredictionWidget />
        <FinancialDisclaimer />
      </div>
    );

    return <TwoColumnLayout main={guestContent} sidebar={guestSidebar} />;
  }

  // Authenticated View: When user is logged in
  const mainContent = (
    <div className="flex flex-col gap-[var(--space-6)]">
      {/* Top Section */}
      <div>
        <SectionTitle
          action={
            <button
              onClick={openManageWatchlist}
              className="flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-[var(--weight-regular)]"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Manage Watchlist</span>
            </button>
          }
        >
          My Watchlist
        </SectionTitle>

        {/* Multi-Period Performance Table */}
        <Card>
          {watchlist.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Star className="w-8 h-8 text-neutral-500 mx-auto mb-3 stroke-[1.5]" />
              <div className="text-[14px] font-medium text-white mb-1">Your watchlist is empty</div>
              <p className="text-[12px] text-neutral-400 mb-4 max-w-sm mx-auto">
                Search for any stock, crypto, or index and click Follow (⭐) to track it here.
              </p>
              <button
                type="button"
                onClick={openManageWatchlist}
                className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 text-[12px] font-medium transition-colors"
              >
                Search Assets
              </button>
            </div>
          ) : (
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
                          <TickerLogo symbol={stock.symbol} name={stock.name} size={24} />
                          <div>
                            <div className="font-[var(--weight-medium)] text-[var(--text-primary)]">{stock.name}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">{stock.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-[16px] py-[12px] text-right font-[var(--weight-medium)] tabular-nums text-[var(--text-primary)]">
                        {formatPrice(stock.price, stock.currency, stock.symbol)}
                      </td>
                      <td
                        className={`px-[16px] py-[12px] text-right font-[var(--weight-medium)] tabular-nums ${
                          (stock.perf1D ?? stock.changePercent) >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        {formatPercent(stock.perf1D ?? stock.changePercent)}
                      </td>
                      <td
                        className={`px-[16px] py-[12px] text-right font-[var(--weight-medium)] tabular-nums ${
                          (stock.perf5D ?? stock.changePercent) >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        {formatPercent(stock.perf5D ?? stock.changePercent)}
                      </td>
                      <td
                        className={`px-[16px] py-[12px] text-right font-[var(--weight-medium)] tabular-nums ${
                          (stock.perf1M ?? stock.changePercent) >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        {formatPercent(stock.perf1M ?? stock.changePercent)}
                      </td>
                      <td
                        className={`px-[16px] py-[12px] text-right font-[var(--weight-medium)] tabular-nums ${
                          (stock.perf6M ?? stock.changePercent) >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        {formatPercent(stock.perf6M ?? stock.changePercent)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </Card>
      </div>

      {/* Watchlist Movers Chart Section */}
      <div>
        <SectionTitle
          action={
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-xs)] text-[var(--text-muted)]">
                Displaying: <span className="font-[var(--weight-medium)] text-[var(--text-primary)]">{activeSymbol}</span>
              </span>
            </div>
          }
        >
          Watchlist Movers
        </SectionTitle>

        {selectedStock && (
          <InteractiveStockChart
            symbol={selectedStock.symbol}
            name={selectedStock.name}
            exchange={selectedStock.exchange}
            currency={selectedStock.currency}
            initialPrice={selectedStock.price}
            initialChange={selectedStock.change}
            initialChangePercent={selectedStock.changePercent}
            previousClose={previousClose || selectedStock.price}
            candles={candles}
            currentRange={currentRange}
            onRangeChange={(r) => setCurrentRange(r)}
            isLoading={isLoadingChart}
            defaultCompareSymbols={otherWatchlistSymbols}
          />
        )}
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col gap-[var(--space-6)]">
      <PredictionWidget />
      <FinancialDisclaimer />
    </div>
  );

  return <TwoColumnLayout main={mainContent} sidebar={sidebarContent} />;
}
