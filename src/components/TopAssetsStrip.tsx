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
    <div className="w-full mb-8">
      {/* Header with region dropdown */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-sm font-semibold text-neutral-200">Top Assets</h2>
        
        <div className="flex items-center gap-2">
          {isLoading && (
            <RefreshCw className="w-3.5 h-3.5 text-neutral-500 animate-spin" />
          )}
          <button
            onClick={onRegionToggle}
            className="flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-white px-2 py-1 rounded bg-[#131722] hover:bg-[#1A202F] border border-[#222838] transition-colors"
          >
            <span>{region}</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>
        </div>
      </div>

      {/* Grid of Asset Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {assets.map((asset) => {
          const isPositive = asset.changePercent >= 0;
          return (
            <Link
              key={asset.symbol}
              href={`/stocks/${encodeURIComponent(asset.symbol)}`}
              className="group relative flex flex-col justify-between bg-[#11151F] hover:bg-[#151A26] border border-[#1C2230] hover:border-neutral-700/60 rounded-xl p-3.5 transition-all duration-200 shadow-sm cursor-pointer"
            >
              {/* Asset Title and Price */}
              <div>
                <div className="text-xs font-medium text-neutral-300 truncate mb-1 group-hover:text-emerald-400 transition-colors">
                  {asset.name}
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {formatPrice(asset.price, asset.currency)}
                  </div>

                  {/* Change badge */}
                  <div
                    className={`flex items-center gap-0.5 text-xs font-semibold ${
                      isPositive ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                    <span>{formatPercent(asset.changePercent)}</span>
                    <span className="text-[10px] opacity-75 font-normal ml-0.5">
                      {formatChange(asset.change, asset.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sparkline Canvas Area */}
              <div className="mt-3 w-full h-11">
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
