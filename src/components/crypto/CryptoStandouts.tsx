"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { TickerLogo } from "@/components/ui/TickerLogo";
import { CryptoStandoutItem, CryptoStandoutChartPoint } from "@/app/api/crypto/standouts/route";

function formatCryptoPrice(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (price >= 1) {
    return `$${price.toFixed(2)}`;
  }
  if (price >= 0.01) {
    return `$${price.toFixed(4)}`;
  }
  return `$${price.toFixed(6)}`;
}

interface StandoutChartProps {
  item: CryptoStandoutItem;
  onHoverPoint: (point: CryptoStandoutChartPoint | null) => void;
}

function StandoutChart({ item, onHoverPoint }: StandoutChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { points, min, max, baselineYPercent, timeLabels } = item.chart;
  const isPositive = item.changePercent >= 0;
  // User instruction: ONE solid color for the entire graph based on profit/loss
  const lineColor = isPositive ? "#3ecf8e" : "#f2555a";

  if (!points || points.length < 2) {
    return (
      <div className="h-[140px] flex items-center justify-center text-[11px] text-[var(--text-muted)]">
        Chart data unavailable
      </div>
    );
  }

  const width = 500;
  const height = 130;
  const paddingX = 6;
  const paddingY = 8;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;
  const range = max - min || 1;

  // Build SVG path with single uniform color
  const pathD = points
    .map((p, idx) => {
      const x = paddingX + (idx / (points.length - 1)) * usableWidth;
      const y = paddingY + ((max - p.value) / range) * usableHeight;
      return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  // Baseline Y in SVG coordinates
  const baselineY = paddingY + ((max - item.baselinePrice) / range) * usableHeight;

  // Handle Mouse/Touch Move Scrubbing
  const handlePointerMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, relativeX / rect.width));
    const pointIdx = Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1))));

    setHoverIndex(pointIdx);
    onHoverPoint(points[pointIdx]);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
    onHoverPoint(null);
  };

  // Hover point coordinates
  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;
  const activeX =
    hoverIndex !== null
      ? paddingX + (hoverIndex / (points.length - 1)) * usableWidth
      : null;
  const activeY =
    activePoint !== null
      ? paddingY + ((max - activePoint.value) / range) * usableHeight
      : null;

  // Formatted date string for tooltip
  let activeDateStr = "";
  if (activePoint) {
    const d = new Date(activePoint.time);
    const dateFormatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const timeFormatted = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    activeDateStr = `${dateFormatted}, ${timeFormatted}`;
  }

  // Generate 3 Y-axis tick values
  const tickHigh = max;
  const tickMid = (max + min) / 2;
  const tickLow = min;

  const formatTick = (val: number) => {
    if (val >= 100) return val.toFixed(1);
    if (val >= 1) return val.toFixed(2);
    if (val >= 0.01) return val.toFixed(4);
    return val.toFixed(6);
  };

  return (
    <div className="relative w-full select-none">
      <div className="flex">
        {/* Left Y-axis ticks */}
        <div className="flex flex-col justify-between py-2 pr-2 text-[9.5px] text-[var(--text-muted)] font-mono pointer-events-none tabular-nums text-right w-14 shrink-0">
          <span>{formatTick(tickHigh)}</span>
          <span>{formatTick(tickMid)}</span>
          <span>{formatTick(tickLow)}</span>
        </div>

        {/* SVG Drawing Canvas with Interactive Scrubbing */}
        <div
          ref={containerRef}
          className="relative flex-1 h-[130px] cursor-crosshair touch-none"
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onMouseLeave={handlePointerLeave}
          onTouchMove={(e) => {
            if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
          }}
          onTouchEnd={handlePointerLeave}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Baseline horizontal dashed line */}
            <line
              x1={paddingX}
              y1={baselineY}
              x2={width - paddingX}
              y2={baselineY}
              stroke="rgba(255, 255, 255, 0.16)"
              strokeDasharray="4 4"
              strokeWidth="1.2"
            />

            {/* Price Line (Single Solid Color: Green if profit, Red if loss) */}
            <path
              d={pathD}
              fill="none"
              stroke={lineColor}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Vertical Cursor Crosshair */}
            {activeX !== null && (
              <line
                x1={activeX}
                y1={paddingY}
                x2={activeX}
                y2={height - paddingY}
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            )}

            {/* Active Hover Dot on Curve */}
            {activeX !== null && activeY !== null && (
              <g>
                <circle cx={activeX} cy={activeY} r="5.5" fill="rgba(255, 255, 255, 0.25)" />
                <circle cx={activeX} cy={activeY} r="3" fill="#ffffff" />
              </g>
            )}
          </svg>

          {/* Floating Baseline Badge "24H ago: $..." (hidden during active hover to avoid clutter) */}
          {hoverIndex === null && (
            <div
              className="absolute right-2 -translate-y-1/2 pointer-events-none z-10"
              style={{ top: `${baselineYPercent}%` }}
            >
              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#18191d]/90 text-neutral-300 border border-white/10 shadow-sm backdrop-blur-sm tabular-nums whitespace-nowrap">
                24H ago: {item.formattedBaseline}
              </span>
            </div>
          )}

          {/* Floating Hover Tooltip (Matching Perplexity Finance) */}
          {activePoint !== null && activeX !== null && (
            <div
              className="absolute pointer-events-none z-30 transition-all duration-75"
              style={{
                left: `${(activeX / width) * 100}%`,
                bottom: "8px",
                transform: "translateX(-50%)",
              }}
            >
              <div className="bg-[#111215]/95 border border-white/15 rounded-lg px-2.5 py-1.5 shadow-2xl backdrop-blur-md whitespace-nowrap text-center">
                <div className="text-[12.5px] font-semibold text-white tabular-nums tracking-tight">
                  {formatCryptoPrice(activePoint.value)}
                </div>
                <div className="text-[9.5px] text-neutral-400 font-mono mt-0.5">
                  {activeDateStr}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* X-axis Time Labels */}
      <div className="flex justify-between pl-14 pr-2 pt-1.5 text-[10px] text-[var(--text-muted)] font-medium">
        {timeLabels.map((t, idx) => (
          <span key={idx}>{t.label}</span>
        ))}
      </div>
    </div>
  );
}

function StandoutCard({ item }: { item: CryptoStandoutItem }) {
  const [hoveredPoint, setHoveredPoint] = useState<CryptoStandoutChartPoint | null>(null);

  // Dynamic values that update seamlessly while scrubbing
  const displayPrice = hoveredPoint ? formatCryptoPrice(hoveredPoint.value) : item.formattedPrice;
  const currentDiff = hoveredPoint
    ? ((hoveredPoint.value - item.baselinePrice) / item.baselinePrice) * 100
    : item.changePercent;
  const isPositive = currentDiff >= 0;

  return (
    <div className="bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]/30 border border-[var(--border)] rounded-2xl p-5 transition-colors shadow-sm">
      {/* Top Row: Coin Identity & Price */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <Link href={`/stocks/${item.symbol}`} className="flex items-center gap-3 group">
          <TickerLogo symbol={item.symbol} name={item.name} size={36} className="rounded-xl" />
          <div>
            <div className="text-[14.5px] font-medium text-[var(--text-primary)] group-hover:text-white transition-colors">
              {item.name}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] tracking-wider uppercase font-mono mt-0.5">
              {item.displaySymbol} · CRYPTO
            </div>
          </div>
        </Link>

        <div className="text-right">
          <div className="text-[17px] font-semibold text-[var(--text-primary)] tracking-tight tabular-nums">
            {displayPrice}
          </div>
          <div
            className={`flex items-center justify-end gap-0.5 text-[12px] font-medium tabular-nums mt-0.5 ${
              isPositive ? "text-positive" : "text-negative"
            }`}
            style={{ color: isPositive ? "#3ecf8e" : "#f2555a" }}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.2]" />
            )}
            <span>{Math.abs(currentDiff).toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Middle: Interactive 24H Chart (Left) + Key Statistics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-4 items-center">
        <div className="lg:col-span-8">
          <StandoutChart item={item} onHoverPoint={setHoveredPoint} />
        </div>

        <div className="lg:col-span-4 flex flex-col justify-center space-y-3 lg:border-l border-white/5 lg:pl-5 pt-3 lg:pt-0">
          <div className="flex justify-between items-center text-[12px]">
            <span className="text-[var(--text-muted)]">Volume</span>
            <span className="font-medium text-neutral-200 tabular-nums">
              {item.formattedVolume}
            </span>
          </div>

          <div className="flex justify-between items-center text-[12px]">
            <span className="text-[var(--text-muted)]">Market Cap</span>
            <span className="font-medium text-neutral-200 tabular-nums">
              {item.formattedMarketCap}
            </span>
          </div>

          <div className="flex justify-between items-center text-[12px]">
            <span className="text-[var(--text-muted)]">P/E Ratio</span>
            <span className="font-medium text-neutral-400 tabular-nums">{item.peRatio}</span>
          </div>

          <div className="flex justify-between items-center text-[12px]">
            <span className="text-[var(--text-muted)]">Dividend Yield</span>
            <span className="font-medium text-neutral-400 tabular-nums">
              {item.dividendYield}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom: Dynamic Market Catalyst Note */}
      <div className="pt-3 border-t border-white/5">
        <p className="text-[12.5px] leading-relaxed text-neutral-300">
          {item.catalyst}
        </p>
      </div>
    </div>
  );
}

export function CryptoStandouts() {
  const [standouts, setStandouts] = useState<CryptoStandoutItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    fetch("/api/crypto/standouts")
      .then((r) => r.json())
      .then((data) => {
        if (isCurrent && data.standouts) {
          setStandouts(data.standouts);
        }
      })
      .catch((err) => console.error("Failed to load standouts:", err))
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <section className="w-full mt-2">
      {/* Header with Title and Coinbase 50 Index Subtitle */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
          Standouts
        </h2>
        <span className="text-[11.5px] text-[var(--text-muted)] font-normal">
          Constituent coins from the Coinbase 50 Index
        </span>
      </div>

      {/* Standout Cards List */}
      <div className="space-y-4">
        {isLoading && standouts.length === 0 ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 animate-pulse"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 bg-white/5 rounded" />
                      <div className="h-3 w-20 bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-24 bg-white/5 rounded" />
                </div>
                <div className="h-32 bg-white/5 rounded-xl mb-4" />
                <div className="h-10 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : (
          standouts.map((item) => <StandoutCard key={item.symbol} item={item} />)
        )}
      </div>
    </section>
  );
}
