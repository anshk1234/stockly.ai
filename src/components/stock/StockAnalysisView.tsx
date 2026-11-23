"use client";

import React, { useState, useEffect } from "react";
import { Info, ChevronDown, ChevronUp, Loader2, RefreshCw } from "lucide-react";
import { DetailedStockQuote, StockAnalysisData, AnalystRecommendationRow } from "@/lib/types";
import { TwoColumnLayout } from "@/components/ui/layout";

interface StockAnalysisViewProps {
  stock: DetailedStockQuote;
  onSwitchTab?: (tab: string) => void;
}

export function StockAnalysisView({ stock }: StockAnalysisViewProps) {
  const [data, setData] = useState<StockAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [showAllRows, setShowAllRows] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    setError(null);

    async function loadAnalysis() {
      try {
        const res = await fetch(`/api/stock/${encodeURIComponent(stock.symbol)}/analysis`);
        if (!res.ok) {
          if (res.status === 404) {
            // Explicitly confirmed no coverage
            if (isCurrent) {
              setData(null);
              setError(null);
            }
            return;
          }
          throw new Error(`Failed to load analysis: ${res.status}`);
        }
        const json = await res.json();
        if (isCurrent) {
          setData(json.analysis || null);
          setError(null);
        }
      } catch (err) {
        console.error("Error loading analysis tab:", err);
        if (isCurrent) {
          setError("Unable to load analyst consensus & research at this time.");
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadAnalysis();
    return () => {
      isCurrent = false;
    };
  }, [stock.symbol, retryKey]);

  const currencySymbol = stock.currency === "INR" ? "₹" : "$";

  const formatPrice = (val?: number) => {
    if (val == null || isNaN(val)) return "—";
    const formatted = val >= 1000
      ? val.toLocaleString("en-US", { maximumFractionDigits: 2 })
      : Number(val.toFixed(2)).toString();
    return `${currencySymbol}${formatted}`;
  };

  const getRatingBadgeStyle = (grade: string) => {
    const g = grade.toLowerCase();
    if (g.includes("buy") || g.includes("overweight") || g.includes("outperform")) {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
    }
    if (g.includes("sell") || g.includes("underweight") || g.includes("reduce") || g.includes("underperform")) {
      return "bg-rose-500/10 text-rose-400 border border-rose-500/25";
    }
    return "bg-zinc-800/80 text-zinc-300 border border-zinc-700/60";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-3 text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <span className="text-xs">Loading Wall Street analyst consensus & research...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-3 p-8 text-center bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
        <p className="text-xs text-rose-400">{error}</p>
        <button
          type="button"
          onClick={() => setRetryKey((k) => k + 1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-[var(--border)] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
        <p className="text-sm text-zinc-400">No Wall Street analyst coverage data available for this asset.</p>
      </div>
    );
  }

  // Price target slider calculations
  const rawTargetLow = data.targets.low;
  const rawTargetHigh = data.targets.high;
  const rawTargetMean = data.targets.mean;
  const currentPrice = data.targets.currentPrice ?? stock.price;

  const hasTargets = rawTargetLow != null && rawTargetHigh != null && rawTargetHigh > rawTargetLow;
  const minVal = hasTargets ? Math.min(rawTargetLow, currentPrice ?? rawTargetLow) : 0;
  const maxVal = hasTargets ? Math.max(rawTargetHigh, currentPrice ?? rawTargetHigh) : 100;
  const range = maxVal > minVal ? maxVal - minVal : 1;

  const sortedTargets = hasTargets && rawTargetMean != null && currentPrice != null
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
  // Compare raw targets before clamping for track highlight color
  const isUpside = (rawTargetMean ?? 0) >= (currentPrice ?? 0);

  const visibleHistory: AnalystRecommendationRow[] = showAllRows ? data.history : data.history.slice(0, 10);
  const remainingCount = Math.max(0, data.history.length - 10);

  return (
    <TwoColumnLayout
      main={
        <div className="flex flex-col gap-4">
          {/* Top Combined Card: Analyst Consensus + 52W Price Targets */}
          <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:divide-x divide-[var(--border)]">
              {/* Left Panel: Analyst Consensus */}
              <div className="flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 mb-4">
                  <span>Analyst Consensus</span>
                  <Info className="w-3.5 h-3.5 text-zinc-500 cursor-help" />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {/* Consensus Rating */}
                  <div>
                    <div className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Consensus
                    </div>
                    <div className="text-base font-semibold text-emerald-400 mt-1">
                      {data.consensus.recommendationRating}
                    </div>
                  </div>

                  {/* Bullish */}
                  <div>
                    <div className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Bullish
                    </div>
                    <div className="text-base font-semibold text-zinc-100 mt-1">
                      {data.consensus.bullishCount}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {data.consensus.bullishPct.toFixed(1)}%
                    </div>
                  </div>

                  {/* Neutral */}
                  <div>
                    <div className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Neutral
                    </div>
                    <div className="text-base font-semibold text-zinc-100 mt-1">
                      {data.consensus.neutralCount}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {data.consensus.neutralPct.toFixed(1)}%
                    </div>
                  </div>

                  {/* Bearish */}
                  <div>
                    <div className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Bearish
                    </div>
                    <div className="text-base font-semibold text-zinc-100 mt-1">
                      {data.consensus.bearishCount}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {data.consensus.bearishPct.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Analyst 52W Price Targets */}
              <div className="flex flex-col justify-between lg:pl-6 pt-4 lg:pt-0">
                <div className="text-sm font-medium text-zinc-300 mb-4">
                  Analyst 52W Price Targets
                </div>

                {hasTargets && sortedTargets.length === 4 ? (
                  <div>
                    {/* 4 Price columns */}
                    <div className="grid grid-cols-4 gap-1 text-[13px]">
                      {sortedTargets.map((item, idx) => {
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
                      <div className="absolute left-0 right-0 h-[2px] bg-zinc-800 rounded-full" />

                      {/* Dynamic highlight range bar */}
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
                          sortedTargets[0]?.type === "current"
                            ? "bg-white"
                            : sortedTargets[0]?.type === "low"
                            ? "bg-rose-500"
                            : "bg-emerald-500"
                        }`}
                      />

                      {/* Right endpoint dot */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />

                      {/* Low target marker if current is lower than low */}
                      {currentPrice != null && rawTargetLow != null && currentPrice < rawTargetLow && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-2.5 h-2.5 rounded-full bg-emerald-500/80 border border-zinc-900 shadow-sm"
                          style={{ left: `${lowPct}%` }}
                          title={`Low Target: ${formatPrice(rawTargetLow)}`}
                        />
                      )}

                      {/* Current Price Marker */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-3.5 h-3.5 rounded-full border-2 border-white bg-[#0e1117] flex items-center justify-center shadow-md"
                        style={{ left: `${currPct}%` }}
                        title={`Current: ${formatPrice(currentPrice)}`}
                      >
                        <div className="w-1 h-1 rounded-full bg-white" />
                      </div>

                      {/* Average Target Marker */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0e1117] ring-2 ring-emerald-500/40 flex items-center justify-center shadow-md"
                        style={{ left: `${meanPct}%` }}
                        title={`Average Target: ${formatPrice(rawTargetMean)}`}
                      >
                        <div className="w-1 h-1 rounded-full bg-black/60" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 py-4">Price target range not available for this equity.</div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Card: Recommendations Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-zinc-900/40 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Firm</th>
                    <th className="py-3 px-4">Analyst</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">52W Price Target</th>
                    <th className="py-3 px-4">Upside</th>
                    <th className="py-3 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-sm">
                  {visibleHistory.length > 0 ? (
                    visibleHistory.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-[var(--bg-card-hover)] transition-colors text-[13px]"
                      >
                        {/* Firm */}
                        <td className="py-3 px-4 font-medium text-zinc-100 whitespace-nowrap">
                          {row.firm}
                        </td>

                        {/* Analyst */}
                        <td className="py-3 px-4 text-zinc-400 whitespace-nowrap text-xs">
                          {row.analyst || "—"}
                        </td>

                        {/* Rating */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-[5px] text-[11.5px] font-medium tracking-wide ${getRatingBadgeStyle(row.toGrade)}`}>
                            {row.toGrade}
                          </span>
                        </td>

                        {/* 52W Price Target */}
                        <td className="py-3 px-4 font-mono whitespace-nowrap text-zinc-200">
                          <span>{formatPrice(row.currentPriceTarget)}</span>
                          {row.priorPriceTarget != null && row.priorPriceTarget !== row.currentPriceTarget && (
                            <span className="text-zinc-500 text-[11.5px] font-normal ml-1.5">
                              from {formatPrice(row.priorPriceTarget)}
                            </span>
                          )}
                        </td>

                        {/* Upside */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-xs">
                          {row.upside != null ? (
                            <span className={row.upside >= 0 ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
                              {row.upside >= 0 ? `+${row.upside}%` : `${row.upside}%`}
                            </span>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-zinc-400 text-right whitespace-nowrap text-xs font-mono">
                          {row.date}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 px-4 text-center text-xs text-zinc-400">
                        No individual brokerage recommendation revisions recorded yet for this equity.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Expand / Collapse Footer */}
            {remainingCount > 0 && (
              <div className="p-3 border-t border-[var(--border)] text-center bg-zinc-900/20">
                <button
                  type="button"
                  onClick={() => setShowAllRows(!showAllRows)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer py-1 px-3 rounded-lg hover:bg-zinc-800/60"
                >
                  <span>{showAllRows ? "Show fewer" : `See ${remainingCount} more`}</span>
                  {showAllRows ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      }
      sidebar={
        <div className="flex flex-col gap-4">
          {/* Analyst Ratings Synthesis Card */}
          <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-100 mb-4 tracking-tight">
              Analyst Ratings Synthesis
            </h3>

            <div className="space-y-4 text-[13px] leading-relaxed text-zinc-300">
              <p>{data.synthesis.overview}</p>
              <p>{data.synthesis.rangeAnalysis}</p>
              <p>{data.synthesis.recentChanges}</p>
              <p className="text-zinc-400">{data.synthesis.sentimentContext}</p>
            </div>
          </div>
        </div>
      }
    />
  );
}
