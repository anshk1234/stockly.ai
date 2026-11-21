"use client";

import React, { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/Skeleton";
import { MovementNode, NotablePriceMovementData } from "@/lib/types";

interface NotablePriceMovementsProps {
  symbol: string;
  className?: string;
}

export function NotablePriceMovements({ symbol, className = "" }: NotablePriceMovementsProps) {
  const [data, setData] = useState<NotablePriceMovementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);

    fetch(`/api/stock/${encodeURIComponent(symbol)}/movements`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((res: NotablePriceMovementData) => {
        if (isCurrent && res.movements) {
          setData(res);
        }
      })
      .catch((err) => {
        console.warn("Could not load price movements:", err);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [symbol]);

  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Card className="p-4 sm:p-5 flex flex-col gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-4 items-start">
              <Skeleton className="h-4 w-16 shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  if (!data || !data.movements || data.movements.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2 text-xs">
        <span className="font-[var(--weight-medium)] text-[13px] text-[var(--text-muted)] tracking-tight">
          Notable Price Movement
        </span>
        <span className="text-[var(--text-muted)] font-[var(--weight-regular)]">
          {data.marketStatusText}
        </span>
      </div>

      {/* Main Card with Scrollable Timeline */}
      <Card className="p-4 sm:p-5">
        <div className="max-h-[380px] overflow-y-auto pr-1 flex flex-col gap-5 select-text">
          {data.movements.map((item: MovementNode, idx: number) => {
            const isLast = idx === data.movements.length - 1;
            const currencySymbol = item.currency === "INR" ? "₹" : "$";

            if (item.isStatusNode) {
              return (
                <div key={idx} className="flex items-start gap-3.5 sm:gap-4 relative">
                  {/* Left Date / Timestamp */}
                  <div className="w-16 sm:w-20 shrink-0 text-right text-[11px] font-[var(--weight-medium)] text-[var(--text-muted)] pt-0.5 leading-tight">
                    {item.date}
                  </div>

                  {/* Vertical Timeline Track & Cyan Dot */}
                  <div className="relative flex flex-col items-center self-stretch shrink-0">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                    {!isLast && <div className="w-px bg-white/10 flex-1 my-1" />}
                  </div>

                  {/* Status text */}
                  <div className="flex-1 text-xs text-[var(--text-muted)] pt-0.5">
                    {item.statusText}
                  </div>
                </div>
              );
            }

            const isPositive = (item.changePercent || 0) >= 0;
            const hasAfterHours = typeof item.afterHoursPrice === "number";
            const isAhPositive = (item.afterHoursChangePercent || 0) >= 0;

            return (
              <div key={idx} className="flex items-start gap-3.5 sm:gap-4 relative group">
                {/* Left Date */}
                <div className="w-16 sm:w-20 shrink-0 text-right text-xs font-[var(--weight-medium)] text-[var(--text-muted)] pt-0.5">
                  {item.date}
                </div>

                {/* Vertical Timeline Track & Hollow Node */}
                <div className="relative flex flex-col items-center self-stretch shrink-0">
                  <div className="w-2 h-2 rounded-full border border-white/30 bg-[var(--bg-card)] mt-1 group-hover:border-white/60 transition-colors" />
                  {!isLast && <div className="w-px bg-white/10 flex-1 my-1" />}
                </div>

                {/* Content Block */}
                <div className="flex-1 flex flex-col gap-2 pb-2">
                  {/* Catalyst Price Header */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono">
                    <span className="font-bold text-sm text-[var(--text-primary)]">
                      {currencySymbol}{item.price?.toFixed(2)}
                    </span>

                    <span
                      className="inline-flex items-center gap-0.5 font-semibold text-xs"
                      style={{ color: isPositive ? "#3ecf8e" : "#f2555a" }}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 stroke-[2]" />
                      )}
                      <span>{Math.abs(item.changePercent || 0).toFixed(2)}% at Close</span>
                    </span>

                    {hasAfterHours && (
                      <>
                        <span className="text-[var(--text-muted)] opacity-40">•</span>
                        <span className="text-[var(--text-primary)] font-semibold">
                          {currencySymbol}{item.afterHoursPrice?.toFixed(2)}
                        </span>
                        <span
                          className="inline-flex items-center gap-0.5 font-semibold text-xs"
                          style={{ color: isAhPositive ? "#3ecf8e" : "#f2555a" }}
                        >
                          {isAhPositive ? (
                            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 stroke-[2]" />
                          )}
                          <span>{Math.abs(item.afterHoursChangePercent || 0).toFixed(2)}%</span>
                        </span>
                        <span className="text-[var(--text-muted)] text-[11px] font-sans">
                          After Hours
                        </span>
                      </>
                    )}
                  </div>

                  {/* Financial Catalyst Narrative */}
                  {item.narrative && (
                    <p className="text-[12.5px] leading-relaxed text-[#A1A4A9] font-normal tracking-tight">
                      {item.narrative}
                    </p>
                  )}

                  {/* Sources Pill Bar */}
                  {item.sourceCount > 0 && (
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-[var(--text-muted)]">
                      <div className="flex items-center -space-x-1">
                        <span className="w-3.5 h-3.5 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-[8px] text-blue-300 font-bold">
                          W
                        </span>
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-[8px] text-amber-300 font-bold">
                          R
                        </span>
                        <span className="w-3.5 h-3.5 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-[8px] text-purple-300 font-bold">
                          B
                        </span>
                      </div>
                      <span className="font-[var(--weight-medium)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                        {item.sourceCount} sources
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
