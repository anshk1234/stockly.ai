"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, ChevronDown, RefreshCw, Check } from "lucide-react";
import { AssetQuote, AssetCategory } from "@/lib/types";
import { formatPrice, formatPercent, formatChange } from "@/lib/utils";
import { SparklineChart } from "./SparklineChart";
import { SectionTitle } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/Skeleton";

interface TopAssetsStripProps {
  assets: AssetQuote[];
  region: "IN" | "US";
  activeCategory?: AssetCategory;
  onCategoryChange?: (category: AssetCategory) => void;
  isLoading: boolean;
  onRefresh?: () => void;
}

export function TopAssetsStrip({
  assets,
  region,
  activeCategory = region,
  onCategoryChange,
  isLoading,
}: TopAssetsStripProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const categories: { key: AssetCategory; label: string }[] = [
    { key: region, label: region },
    { key: "EUROPE", label: "Europe" },
    { key: "ASIA", label: "Asia" },
    { key: "CURRENCIES", label: "Currencies" },
    { key: "CRYPTO", label: "Crypto" },
    { key: "FUTURES", label: "Futures" },
  ];

  const currentLabel =
    categories.find((c) => c.key === activeCategory)?.label ||
    (activeCategory === "IN" || activeCategory === "US" ? region : activeCategory);

  const handleSelect = (cat: AssetCategory) => {
    onCategoryChange?.(cat);
    setDropdownOpen(false);
  };

  return (
    <div className="w-full">
      {/* Section Title with 1:1 Perplexity Category Dropdown */}
      <SectionTitle
        action={
          <div className="flex items-center gap-2">
            {isLoading && (
              <RefreshCw className="w-3 h-3 text-[var(--text-muted)] animate-spin" />
            )}

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 text-[11.5px] font-[var(--weight-medium)] text-[var(--text-muted)] hover:text-white px-2.5 py-1 rounded-lg bg-[#18191d] hover:bg-[#23252b] border border-white/10 transition-colors shadow-sm"
              >
                <span>{currentLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-[#18191d] border border-white/10 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {categories.map((cat) => {
                    const isSelected = activeCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => handleSelect(cat.key)}
                        className={`w-full text-left px-3 py-1.5 text-[12px] rounded-lg flex items-center justify-between hover:bg-white/5 transition-colors ${
                          isSelected
                            ? "text-white font-[var(--weight-medium)] bg-white/[0.04]"
                            : "text-[var(--text-muted)] hover:text-white"
                        }`}
                      >
                        <span>{cat.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-neutral-300" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        }
      >
        Top Assets
      </SectionTitle>

      {/* Grid of Asset Cards or Skeletons */}
      {isLoading && assets.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--space-3)]">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-card)] overflow-hidden flex flex-col justify-between shadow-sm animate-pulse"
            >
              <div className="px-3.5 pt-3 pb-1">
                <Skeleton className="h-3 w-24 mb-2.5" />
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-5 w-24" />
                  <div className="flex flex-col items-end gap-1.5">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-2.5 w-10" />
                  </div>
                </div>
              </div>
              <div className="w-full h-11 mt-1">
                <Skeleton className="w-full h-full rounded-none" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--space-3)]">
          {assets.map((asset) => {
            const isPositive = asset.changePercent >= 0;

            return (
              <Link
                key={asset.symbol}
                href={`/stocks/${encodeURIComponent(asset.symbol)}`}
                className="group relative flex flex-col justify-between bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded-[var(--radius-card)] overflow-hidden transition-colors shadow-sm cursor-pointer"
              >
                <div className="px-3.5 pt-3 pb-1">
                  {/* Asset Title */}
                  <div className="text-[11.5px] font-[var(--weight-medium)] text-[var(--text-muted)] truncate mb-1 group-hover:text-[var(--text-primary)] transition-colors">
                    {asset.name}
                  </div>

                  {/* Price (Left) and Stacked Return (Right) */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[14px] font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums whitespace-nowrap">
                      {formatPrice(asset.price, asset.currency, asset.symbol)}
                    </div>

                    <div className="flex flex-col items-end shrink-0 tabular-nums">
                      <div
                        className={`flex items-center gap-0.5 text-[11px] font-[var(--weight-medium)] leading-tight`}
                        style={{ color: isPositive ? "#3ecf8e" : "#f2555a" }}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-3 h-3 shrink-0" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 shrink-0" />
                        )}
                        <span>{formatPercent(asset.changePercent)}</span>
                      </div>

                      <div className="text-[10px] text-[var(--text-muted)] font-[var(--weight-regular)] leading-tight mt-0.5">
                        {formatChange(asset.change, asset.currency, asset.symbol)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Minimalist Sparkline Chart with Smooth Bottom Bleed */}
                <div className="w-full h-11 mt-1">
                  <SparklineChart
                    data={asset.sparkline || []}
                    isPositive={isPositive}
                    width={220}
                    height={44}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
