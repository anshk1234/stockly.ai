"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, ChevronDown, RefreshCw } from "lucide-react";
import { AssetQuote } from "@/lib/types";
import { formatPrice, formatPercent, formatChange } from "@/lib/utils";
import { SparklineChart } from "./SparklineChart";
import { SectionTitle } from "@/components/ui/layout";

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
}: TopAssetsStripProps) {
  return (
    <div className="w-full">
      {/* Section Title above cards */}
      <SectionTitle
        action={
          <div className="flex items-center gap-[var(--space-2)]">
            {isLoading && (
              <RefreshCw className="w-3 h-3 text-[var(--text-muted)] animate-spin" />
            )}
            <button
              onClick={onRegionToggle}
              className="flex items-center gap-1 text-[var(--text-xs)] font-[var(--weight-medium)] text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-0.5 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] transition-colors"
            >
              <span>{region}</span>
              <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
            </button>
          </div>
        }
      >
        Top Assets
      </SectionTitle>

      {/* Grid of Asset Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--space-3)]">
        {assets.map((asset) => {
          const isPositive = asset.changePercent >= 0;
          return (
            <Link
              key={asset.symbol}
              href={`/stocks/${encodeURIComponent(asset.symbol)}`}
              className="group relative flex flex-col justify-between bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded-[var(--radius-card)] px-3.5 py-3 transition-colors shadow-sm cursor-pointer"
            >
              <div>
                {/* Asset Title */}
                <div className="text-[11px] font-[var(--weight-medium)] text-[var(--text-muted)] truncate mb-1 group-hover:text-[var(--text-primary)] transition-colors">
                  {asset.name}
                </div>

                {/* Price (Left) and Stacked Return (Right) */}
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[14px] font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums whitespace-nowrap">
                    {formatPrice(asset.price, asset.currency, asset.symbol)}
                  </div>

                  <div className="flex flex-col items-end shrink-0 tabular-nums">
                    <div
                      className={`flex items-center gap-0.5 text-[11px] font-[var(--weight-medium)] leading-tight ${
                        isPositive ? "text-[var(--positive)]" : "text-[var(--negative)]"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-3 h-3 stroke-[2.2]" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 stroke-[2.2]" />
                      )}
                      <span>{formatPercent(asset.changePercent, false)}</span>
                    </div>

                    <div className="text-[10.5px] text-[var(--text-muted)] leading-tight mt-0.5">
                      {formatChange(asset.change, asset.currency, asset.symbol)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sparkline Canvas Area */}
              <div className="mt-2 w-full h-9">
                <SparklineChart
                  data={asset.sparkline}
                  isPositive={isPositive}
                  height={36}
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
