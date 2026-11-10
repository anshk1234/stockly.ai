"use client";

import React from "react";
import Link from "next/link";
import { SlidersHorizontal, ChevronRight, Star } from "lucide-react";
import { AssetQuote } from "@/lib/types";
import { formatPrice, formatPercent } from "@/lib/utils";
import { Card, SectionTitle } from "@/components/ui/layout";
import { TickerLogo } from "@/components/ui/TickerLogo";
import { Skeleton } from "@/components/ui/Skeleton";
import { useApp } from "@/context/AppContext";

interface WatchlistWidgetProps {
  items: AssetQuote[];
  isLoading: boolean;
  onNavigateToWatchlist?: () => void;
  onManageWatchlist?: () => void;
}

export function WatchlistWidget({
  items,
  isLoading,
  onNavigateToWatchlist,
}: WatchlistWidgetProps) {
  const { isGuest, openAuthModal, isWatchlistSaved, toggleWatchlist, openManageWatchlist } = useApp();

  const handleHeaderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateToWatchlist) {
      onNavigateToWatchlist();
    } else if (typeof window !== "undefined") {
      window.location.href = "/?tab=watchlist";
    }
  };

  const handleManageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isGuest) {
      openAuthModal("watchlist");
    } else {
      openManageWatchlist();
    }
  };

  const handleStarClick = async (e: React.MouseEvent, symbol: string, name?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (isGuest) {
      openAuthModal("watchlist");
      return;
    }
    await toggleWatchlist(symbol, name);
  };

  return (
    <div className="w-full">
      {/* Section Title: "Watchlist >" links to Watchlist Tab; Three lines button opens Manage Modal */}
      <SectionTitle
        action={
          <button
            type="button"
            onClick={handleManageClick}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
            title="Manage Watchlist"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        }
      >
        <button
          type="button"
          onClick={handleHeaderClick}
          className="flex items-center gap-1 hover:text-[var(--text-primary)] group transition-colors"
        >
          <span>Watchlist</span>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
        </button>
      </SectionTitle>

      {/* ONE single bordered card with compact rows and hairline dividers */}
      <Card>
        {isLoading && items.length === 0 ? (
          <div className="flex flex-col divide-y divide-[var(--border)]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-[16px] py-[13px]">
                <div className="flex items-center gap-[var(--space-3)]">
                  <Skeleton className="w-7 h-7 rounded-md shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className={`h-3.5 ${i === 0 ? "w-28" : i === 1 ? "w-24" : "w-32"}`} />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex flex-col items-end gap-1.5">
                    <Skeleton className="h-3.5 w-16" />
                    <Skeleton className="h-2.5 w-10" />
                  </div>
                  <Skeleton className="w-4 h-4 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-7 px-4 text-center">
            <Star className="w-6 h-6 text-neutral-500 mx-auto mb-2 stroke-[1.5]" />
            <div className="text-[12.5px] font-medium text-[var(--text-primary)] mb-1">Your watchlist is empty</div>
            <p className="text-[11px] text-[var(--text-muted)] mb-3">Add your favorite stocks to track them here.</p>
            <button
              type="button"
              onClick={openManageWatchlist}
              className="px-3 py-1.5 rounded-lg bg-[var(--text-primary)] text-[var(--bg-page)] text-[11.5px] font-medium hover:opacity-90 transition-opacity"
            >
              + Add Tickers
            </button>
          </div>
        ) : (
          items.map((stock) => {
            const isPositive = stock.changePercent >= 0;

            return (
              <Link
                key={stock.symbol}
                href={`/stocks/${encodeURIComponent(stock.symbol)}`}
                className="flex items-center justify-between px-[16px] py-[13px] border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer group"
              >
                {/* Brand Logo & Ticker */}
                <div className="flex items-center gap-[var(--space-3)] min-w-0 pr-2">
                  <TickerLogo symbol={stock.symbol} name={stock.name} size={28} />

                  <div className="min-w-0">
                    <div className="text-[13px] font-[var(--weight-medium)] text-[var(--text-primary)] group-hover:text-[var(--positive)] transition-colors leading-tight truncate">
                      {stock.name}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] uppercase mt-0.5 truncate">
                      {stock.symbol} · {(stock.exchange || "NASDAQ").replace("NASDAQGS", "NASDAQ").replace("NSI", "NSE")}
                    </div>
                  </div>
                </div>

                {/* Price, Change, and Star Outline Button */}
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

                  {/* Star Button */}
                  {(() => {
                    const isSaved = isWatchlistSaved(stock.symbol);
                    return (
                      <button
                        type="button"
                        onClick={(e) => handleStarClick(e, stock.symbol, stock.name)}
                        className={`p-1 rounded transition-colors ${
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
                        <Star className={`w-4 h-4 stroke-[1.5] ${isSaved ? "fill-amber-400 text-amber-400" : ""}`} />
                      </button>
                    );
                  })()}
                </div>
              </Link>
            );
          })
        )}
      </Card>
    </div>
  );
}
