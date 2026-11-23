"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { DetailedStockQuote } from "@/lib/types";
import { SectionTitle } from "@/components/ui/layout";

interface AnalystConsensusCardProps {
  stock: DetailedStockQuote;
  onSeeAll?: () => void;
}

export function AnalystConsensusCard({ stock, onSeeAll }: AnalystConsensusCardProps) {
  const isCrypto = stock.assetClass === "CRYPTOCURRENCY" || stock.symbol.endsWith("-USD");
  const isIndex = stock.assetClass === "INDEX" || stock.symbol.startsWith("^");

  // Only display for equities that have analyst ratings/consensus
  if (isCrypto || isIndex) return null;

  const consensus = stock.analystConsensus;
  if (!consensus && !stock.analystRating) return null;

  const ratingText = consensus?.recommendationRating || stock.analystRating?.split("-")?.[1]?.trim() || "Hold";
  const ratingLower = ratingText.toLowerCase();

  const isBuy = ratingLower.includes("buy");
  const isSell = ratingLower.includes("sell") || ratingLower.includes("underperform");

  const badgeBg = isBuy
    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
    : isSell
    ? "bg-rose-500/10 text-rose-400 border border-rose-500/25"
    : "bg-zinc-800/80 text-zinc-200 border border-zinc-700/60";

  const formatPrice = (val?: number) => {
    if (val == null || isNaN(val)) return "—";
    const sym = stock.currency === "INR" ? "₹" : "$";
    const formatted = val >= 1000
      ? val.toLocaleString("en-US", { maximumFractionDigits: 2 })
      : Number(val.toFixed(2)).toString();
    return `${sym}${formatted}`;
  };

  const bearish = consensus?.bearishCount ?? 0;
  const neutral = consensus?.neutralCount ?? 0;
  const bullish = consensus?.bullishCount ?? 0;
  const totalOpinions = bearish + neutral + bullish;
  const hasConsensusCounts = totalOpinions > 0 || (consensus?.totalAnalysts != null && consensus.totalAnalysts > 0);
  const displayTotalAnalysts = consensus?.totalAnalysts || totalOpinions;

  // Segmented Bar Calculation (normalize to 25 ticks or match exact count up to 30)
  const TICK_COUNT = totalOpinions > 0 && totalOpinions <= 30 ? totalOpinions : 25;
  let redTicks = 0;
  let greenTicks = 0;
  let greyTicks = 0;

  if (totalOpinions > 0) {
    if (TICK_COUNT === totalOpinions) {
      redTicks = bearish;
      greyTicks = neutral;
      greenTicks = bullish;
    } else {
      // Joint allocation: reserve 1 tick for each non-empty group, then distribute remainder
      let remTicks = TICK_COUNT;
      if (bearish > 0) { redTicks = 1; remTicks--; }
      if (neutral > 0) { greyTicks = 1; remTicks--; }
      if (bullish > 0) { greenTicks = 1; remTicks--; }

      const addRed = Math.round((bearish / totalOpinions) * remTicks);
      const addGreen = Math.round((bullish / totalOpinions) * remTicks);
      const addGrey = Math.max(0, remTicks - addRed - addGreen);

      redTicks += addRed;
      greenTicks += addGreen;
      greyTicks += addGrey;
    }
  }

  // Price target slider calculations
  const rawTargetLow = consensus?.targetLow;
  const rawTargetHigh = consensus?.targetHigh;
  const rawTargetMean = consensus?.targetMean;
  const currentPrice = consensus?.currentPrice ?? stock.price;

  const hasTargets = rawTargetLow != null && rawTargetHigh != null && rawTargetHigh > rawTargetLow;

  // Calculate bounding minimum & maximum (accounting for when current price is outside target range)
  const minVal = hasTargets ? Math.min(rawTargetLow, currentPrice ?? rawTargetLow) : 0;
  const maxVal = hasTargets ? Math.max(rawTargetHigh, currentPrice ?? rawTargetHigh) : 100;
  const range = maxVal > minVal ? maxVal - minVal : 1;

  // Sort the 4 price targets in ascending numeric order (Low, Current, Mean, High)
  const sortedItems = hasTargets && rawTargetMean != null && currentPrice != null
    ? [
        { type: "low" as const, label: "Low", val: rawTargetLow },
        { type: "current" as const, label: "Current", val: currentPrice },
        { type: "mean" as const, label: "Average", val: rawTargetMean },
        { type: "high" as const, label: "High", val: rawTargetHigh },
      ].sort((a, b) => a.val - b.val)
    : [];

  const currPct = hasTargets && currentPrice != null
    ? Math.max(3, Math.min(97, ((currentPrice - minVal) / range) * 100))
    : 35;

  const meanPct = hasTargets && rawTargetMean != null
    ? Math.max(3, Math.min(97, ((rawTargetMean - minVal) / range) * 100))
    : 65;

  const lowPct = hasTargets && rawTargetLow != null
    ? Math.max(3, Math.min(97, ((rawTargetLow - minVal) / range) * 100))
    : 0;

  const minSpan = Math.min(currPct, meanPct);
  const spanWidth = Math.max(2, Math.abs(meanPct - currPct));
  const isUpside = rawTargetMean != null && currentPrice != null ? rawTargetMean >= currentPrice : meanPct >= currPct;

  return (
    <div className="w-full">
      <SectionTitle
        action={
          <button
            type="button"
            onClick={onSeeAll}
            className="flex items-center text-[var(--text-xs)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-[var(--weight-regular)] cursor-pointer"
          >
            <span>See all</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </button>
        }
      >
        Analyst Consensus
      </SectionTitle>

      {/* Premium SaaS Dark Card with Hairline Border (no bright white outlines) */}
      <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm transition-all">
        {/* Top Header: Badge & Analyst Count */}
        <div className="flex items-center justify-between">
          <span className={`px-2.5 py-0.5 rounded-[6px] text-[12px] font-semibold tracking-wide ${badgeBg}`}>
            {ratingText}
          </span>
          {hasConsensusCounts && (
            <span className="text-[12px] text-zinc-400 font-medium">
              {displayTotalAnalysts} analysts
            </span>
          )}
        </div>

        {/* Sentiment breakdown labels & tick bar (only rendered when consensus counts exist) */}
        {hasConsensusCounts && (
          <>
            <div className="flex items-center justify-between text-[11.5px] font-medium mt-3.5">
              <span className="text-rose-400">{bearish} Bearish</span>
              <span className="text-zinc-400">{neutral} Neutral</span>
              <span className="text-emerald-400">{bullish} Bullish</span>
            </div>

            <div className="flex items-center gap-[3px] w-full mt-2">
              {Array.from({ length: redTicks }).map((_, i) => (
                <div key={`red-${i}`} className="h-[5px] flex-1 rounded-full bg-rose-500" />
              ))}
              {Array.from({ length: greyTicks }).map((_, i) => (
                <div key={`grey-${i}`} className="h-[5px] flex-1 rounded-full bg-zinc-700/75" />
              ))}
              {Array.from({ length: greenTicks }).map((_, i) => (
                <div key={`green-${i}`} className="h-[5px] flex-1 rounded-full bg-emerald-500" />
              ))}
            </div>
          </>
        )}

        {/* Price Target Breakdown */}
        {hasTargets && sortedItems.length === 4 && (
          <div className="mt-5 pt-1">
            <div className="grid grid-cols-4 gap-1 text-[13px]">
              {sortedItems.map((item, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === 3;
                const alignClass = isFirst ? "text-left" : isLast ? "text-right" : "text-left pl-0.5";

                return (
                  <div key={item.type} className={alignClass}>
                    <div className="font-semibold text-zinc-100 font-mono tracking-tight">
                      {formatPrice(item.val)}
                    </div>
                    <div
                      className={`flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5 ${
                        isLast ? "justify-end" : "justify-start"
                      }`}
                    >
                      {item.type === "low" && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span>Low</span>
                        </>
                      )}
                      {item.type === "current" && (
                        <>
                          <span className="w-2 h-2 rounded-full border border-white shrink-0 inline-flex items-center justify-center">
                            <span className="w-0.5 h-0.5 rounded-full bg-white" />
                          </span>
                          <span>Current</span>
                        </>
                      )}
                      {item.type === "mean" && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-flex items-center justify-center">
                            <span className="w-0.5 h-0.5 rounded-full bg-black/70" />
                          </span>
                          <span>Average</span>
                        </>
                      )}
                      {item.type === "high" && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>High</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visual Slider Track */}
            <div className="relative w-full h-6 flex items-center mt-3">
              {/* Background track line */}
              <div className="absolute left-0 right-0 h-[2px] bg-zinc-800 rounded-full" />

              {/* Dynamic target range highlight span */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 h-[3px] rounded-full ${
                  isUpside
                    ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                }`}
                style={{ left: `${minSpan}%`, width: `${spanWidth}%` }}
              />

              {/* Left endpoint dot */}
              <div
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${
                  sortedItems[0]?.type === "current"
                    ? "bg-white"
                    : sortedItems[0]?.type === "low"
                    ? "bg-rose-500"
                    : "bg-emerald-500"
                }`}
              />

              {/* Right endpoint dot (High) */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />

              {/* If Current is below Low, render Low node marker along track */}
              {currentPrice != null && rawTargetLow != null && currentPrice < rawTargetLow && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-2.5 h-2.5 rounded-full bg-emerald-500/80 border border-zinc-900 shadow-sm"
                  style={{ left: `${lowPct}%` }}
                  title={`Low Target: ${formatPrice(rawTargetLow)}`}
                />
              )}

              {/* Current Price Marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-3.5 h-3.5 rounded-full border-2 border-white bg-[#0e1117] flex items-center justify-center shadow-md cursor-default"
                style={{ left: `${currPct}%` }}
                title={`Current: ${formatPrice(currentPrice)}`}
              >
                <div className="w-1 h-1 rounded-full bg-white" />
              </div>

              {/* Average Target Marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0e1117] ring-2 ring-emerald-500/40 flex items-center justify-center shadow-md cursor-default"
                style={{ left: `${meanPct}%` }}
                title={`Average Target: ${formatPrice(rawTargetMean)}`}
              >
                <div className="w-1 h-1 rounded-full bg-black/60" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
