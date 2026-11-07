"use client";

import React from "react";
import Link from "next/link";
import { SlidersHorizontal, ChevronRight } from "lucide-react";
import { AssetQuote } from "@/lib/types";
import { formatPrice, formatPercent } from "@/lib/utils";
import { Card, SectionTitle } from "@/components/ui/layout";
import { TickerLogo } from "@/components/ui/TickerLogo";

interface WatchlistWidgetProps {
  items: AssetQuote[];
  isLoading: boolean;
  onManageWatchlist?: () => void;
}

export function WatchlistWidget({
  items,
  isLoading,
  onManageWatchlist,
}: WatchlistWidgetProps) {
  return (
    <div className="w-full">
      {/* Section Title */}
      <SectionTitle
        action={
          <button
            onClick={onManageWatchlist}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
            title="Manage Watchlist"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        }
      >
        <button
          onClick={onManageWatchlist}
          className="flex items-center gap-1 hover:text-[var(--text-primary)] group transition-colors"
        >
          <span>Watchlist</span>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
        </button>
      </SectionTitle>

      {/* ONE single bordered card with compact rows and hairline dividers */}
      <Card>
        {isLoading && items.length === 0 ? (
          <div className="px-[16px] py-[14px] text-center text-[var(--text-xs)] text-[var(--text-muted)]">
            Loading watchlist...
          </div>
        ) : (
          items.map((stock) => {
            const isPositive = stock.changePercent >= 0;

            return (
              <Link
                key={stock.symbol}
                href={`/stocks/${encodeURIComponent(stock.symbol)}`}
                className="flex items-center justify-between px-[16px] py-[14px] border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer group"
              >
                {/* Brand Logo & Ticker */}
                <div className="flex items-center gap-[var(--space-3)]">
                  <TickerLogo symbol={stock.symbol} name={stock.name} size={28} />

                  <div>
                    <div className="text-[13px] font-[var(--weight-medium)] text-[var(--text-primary)] group-hover:text-[var(--positive)] transition-colors leading-tight">
                      {stock.name}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] uppercase mt-0.5">
                      {stock.symbol} · {(stock.exchange || "NASDAQ").replace("NASDAQGS", "NASDAQ").replace("NSI", "NSE")}
                    </div>
                  </div>
                </div>

                {/* Price & Change */}
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums">
                    {formatPrice(stock.price, stock.currency, stock.symbol)}
                  </div>
                  <div
                    className={`text-[11.5px] font-[var(--weight-medium)] tabular-nums mt-0.5 ${isPositive ? "text-positive" : "text-negative"}`} style={{ color: isPositive ? "#3ecf8e" : "#f2555a" }}
                  >
                    {formatPercent(stock.changePercent)}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </Card>
    </div>
  );
}
