"use client";

import React from "react";
import Link from "next/link";
import { SlidersHorizontal, ChevronRight } from "lucide-react";
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
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onManageWatchlist}
          className="flex items-center gap-1 text-xs font-semibold text-[#EDEDEE] hover:text-white group transition-colors tracking-tight"
        >
          <span>Watchlist</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#6D717B] group-hover:text-white transition-colors" />
        </button>

        <button
          onClick={onManageWatchlist}
          className="p-1 rounded text-[#6D717B] hover:text-[#EDEDEE] hover:bg-[#202227] transition-colors"
          title="Filter / Configure Watchlist"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stock Cards */}
      <div className="flex flex-col gap-2">
        {isLoading && items.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#717580] bg-[#1B1C20] rounded-xl border border-[#26282E]">
            Loading watchlist...
          </div>
        ) : (
          items.map((stock) => {
            const isPositive = stock.changePercent >= 0;

            return (
              <Link
                key={stock.symbol}
                href={`/stocks/${encodeURIComponent(stock.symbol)}`}
                className="flex items-center justify-between p-3 rounded-xl bg-[#1B1C20] hover:bg-[#202227] border border-[#26282E] hover:border-[#33363E] transition-all cursor-pointer group"
              >
                {/* Brand / Logo + Ticker Info */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#24262C] border border-[#2E3138] flex items-center justify-center font-bold text-xs text-[#EDEDEE] shrink-0">
                    {stock.symbol === "MSFT" ? (
                      <div className="grid grid-cols-2 gap-0.5 p-1 w-4 h-4">
                        <div className="bg-[#F25022] rounded-[1px]"></div>
                        <div className="bg-[#7FBA00] rounded-[1px]"></div>
                        <div className="bg-[#00A4EF] rounded-[1px]"></div>
                        <div className="bg-[#FFB900] rounded-[1px]"></div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#A1A4AC] font-mono">
                        {stock.symbol.slice(0, 3)}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-emerald-400 transition-colors leading-tight">
                      {stock.name}
                    </div>
                    <div className="text-[10px] text-[#717580] font-mono uppercase mt-0.5">
                      {stock.symbol} · {stock.exchange || "NASDAQ"}
                    </div>
                  </div>
                </div>

                {/* Price & Change Pill */}
                <div className="text-right">
                  <div className="text-xs font-semibold text-white font-mono tabular-nums">
                    {formatPrice(stock.price, stock.currency)}
                  </div>
                  <div
                    className={`text-[11px] font-medium font-mono tabular-nums mt-0.5 ${
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
