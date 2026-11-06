"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, ChevronDown, RefreshCw } from "lucide-react";
import { AssetQuote } from "@/lib/types";
import { formatPrice, formatPercent, formatChange } from "@/lib/utils";
import { SparklineChart } from "./SparklineChart";

interface TopAssetsStripProps {
  assets: AssetQuote[];
  region: "IN" | "US";
  onRegionToggle: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function TopAssetsStrip({
  assets,
  region,
  onRegionToggle,
  isLoading,
  onRefresh,
}: TopAssetsStripProps) {
  return (
    <div className="w-full mb-7">
      {/* Header with region dropdown */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-[#EDEDEE] tracking-tight">Top Assets</h2>

        <div className="flex items-center gap-2">
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-[#6D717B] animate-spin" />
          )}
          <button
            onClick={onRegionToggle}
            className="flex items-center gap-1 text-[11px] font-medium text-[#8E929B] hover:text-[#EDEDEE] px-2 py-0.5 rounded bg-[#1B1C20] hover:bg-[#202227] border border-[#282A2F] transition-colors"
          >
            <span>{region}</span>
            <ChevronDown className="w-3 h-3 text-[#6D717B]" />
          </button>
        </div>
      </div>

      {/* Grid of Asset Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {assets.map((asset) => {
          const isPositive = asset.changePercent >= 0;
          return (
            <Link
              key={asset.symbol}
              href={`/stocks/${encodeURIComponent(asset.symbol)}`}
              className="group relative flex flex-col justify-between bg-[#1B1C20] hover:bg-[#202227] border border-[#26282E] hover:border-[#33363E] rounded-xl p-3.5 transition-all duration-150 shadow-sm cursor-pointer"
            >
              {/* Asset Title and Price */}
              <div>
                <div className="text-xs font-medium text-[#989BA3] truncate mb-1 group-hover:text-emerald-400 transition-colors">
                  {asset.name}
                </div>
                <div className="flex items-baseline justify-between gap-1.5">
                  <div className="text-base sm:text-[17px] font-semibold text-white tracking-tight tabular-nums">
                    {formatPrice(asset.price, asset.currency)}
                  </div>

                  {/* Change badge */}
                  <div
                    className={`flex items-center gap-0.5 text-xs font-medium tabular-nums ${
                      isPositive ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.2]" />
                    )}
                    <span>{formatPercent(asset.changePercent)}</span>
                    <span className="text-[10px] text-[#717580] ml-0.5">
                      {formatChange(asset.change, asset.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sparkline Canvas Area */}
              <div className="mt-2.5 w-full h-11">
                <SparklineChart
                  data={asset.sparkline}
                  isPositive={isPositive}
                  height={44}
                  width={220}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
