"use client";

import React from "react";
import Link from "next/link";
import { SlidersHorizontal, ChevronRight, TrendingUp } from "lucide-react";
import { AssetQuote } from "@/lib/types";
import { formatPrice, formatPercent } from "@/lib/utils";

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
    <div className="w-full mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <button
          onClick={onManageWatchlist}
          className="flex items-center gap-1 text-sm font-semibold text-neutral-200 hover:text-white group transition-colors"
        >
          <span>Watchlist</span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
        </button>

        <button
          onClick={onManageWatchlist}
          className="p-1 rounded text-neutral-500 hover:text-neutral-300 hover:bg-[#161B26] transition-colors"
          title="Filter / Configure Watchlist"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stock Cards */}
      <div className="flex flex-col gap-2.5">
        {isLoading && items.length === 0 ? (
          <div className="p-4 text-center text-xs text-neutral-500 bg-[#11151F] rounded-xl border border-[#1C2230]">
            Loading watchlist...
          </div>
        ) : (
          items.map((stock) => {
            const isPositive = stock.changePercent >= 0;

            return (
              <Link
                key={stock.symbol}
                href={`/stocks/${encodeURIComponent(stock.symbol)}`}
                className="flex items-center justify-between p-3 rounded-xl bg-[#11151F] hover:bg-[#151A26] border border-[#1C2230] hover:border-neutral-700/60 transition-all cursor-pointer group"
              >
                {/* Brand / Logo + Ticker Info */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#181E2B] border border-[#222A3C] flex items-center justify-center font-bold text-xs text-neutral-300 shrink-0">
                    {stock.symbol === "MSFT" ? (
                      <div className="grid grid-cols-2 gap-0.5 p-1 w-5 h-5">
                        <div className="bg-[#F25022] rounded-[1px]"></div>
                        <div className="bg-[#7FBA00] rounded-[1px]"></div>
                        <div className="bg-[#00A4EF] rounded-[1px]"></div>
                        <div className="bg-[#FFB900] rounded-[1px]"></div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {stock.symbol.slice(0, 3)}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors leading-tight">
                      {stock.name}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono uppercase mt-0.5">
                      {stock.symbol} · {stock.exchange || "NASDAQ"}
                    </div>
                  </div>
                </div>

                {/* Price & Change Pill */}
                <div className="text-right">
                  <div className="text-xs font-bold text-white font-mono">
                    {formatPrice(stock.price, stock.currency)}
                  </div>
                  <div
                    className={`text-[11px] font-semibold font-mono mt-0.5 ${
                      isPositive ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatPercent(stock.changePercent)}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
