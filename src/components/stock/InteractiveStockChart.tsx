"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Calendar,
  LineChart as LineChartIcon,
  BarChart2,
  Maximize2,
  Camera,
  MoreHorizontal,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { CandlePoint, TimeRange } from "@/lib/types";
import { formatPrice, formatPercent, formatChange, formatCompactNumber } from "@/lib/utils";

interface InteractiveStockChartProps {
  symbol: string;
  currency: string;
  initialPrice: number;
  initialChange: number;
  initialChangePercent: number;
  previousClose: number;
  candles: CandlePoint[];
  currentRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  isLoading: boolean;
}

const RANGES: TimeRange[] = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"];

export function InteractiveStockChart({
  symbol,
  currency,
  initialPrice,
  initialChange,
  initialChangePercent,
  previousClose,
  candles,
  currentRange,
  onRangeChange,
  isLoading,
}: InteractiveStockChartProps) {
  const [chartType, setChartType] = useState<"area" | "candle">("area");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Compute active point or fallback to latest point
  const latestCandle = candles[candles.length - 1];
  const activeCandle = hoverIndex !== null && candles[hoverIndex] ? candles[hoverIndex] : latestCandle;

  const activePrice = activeCandle ? activeCandle.close : initialPrice;
  const isHovering = hoverIndex !== null;

  // Active price change compared to previous close
  const effectiveChange = activeCandle
    ? isHovering
      ? activeCandle.close - previousClose
      : initialChange
    : initialChange;
  const effectiveChangePercent =
    previousClose > 0 ? (effectiveChange / previousClose) * 100 : initialChangePercent;
  const isPositive = effectiveChange >= 0;

  // Chart dimensions
  const height = 360;
  const padding = { top: 24, right: 48, bottom: 48, left: 12 };
  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = Math.max(300, containerWidth - padding.left - padding.right);

  // Min and Max prices for Y-axis
  const { minPrice, maxPrice, priceRange, maxVolume } = useMemo(() => {
    if (!candles || candles.length === 0) {
      return { minPrice: 0, maxPrice: 100, priceRange: 100, maxVolume: 1000 };
    }
    const closes = candles.map((c) => c.close);
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const volumes = candles.map((c) => c.volume);

    let min = Math.min(...lows, previousClose > 0 ? previousClose : Infinity);
    let max = Math.max(...highs, previousClose > 0 ? previousClose : -Infinity);
    const maxVol = Math.max(...volumes, 1);

    if (min === max) {
      min *= 0.95;
      max *= 1.05;
    }
    const margin = (max - min) * 0.08;
    return {
      minPrice: min - margin,
      maxPrice: max + margin,
      priceRange: max - min + margin * 2 || 1,
      maxVolume: maxVol,
    };
  }, [candles, previousClose]);

  // SVG Points
  const points = useMemo(() => {
    if (!candles || candles.length === 0) return [];
    return candles.map((c, i) => {
      const x = padding.left + (i / Math.max(candles.length - 1, 1)) * chartWidth;
      const y = padding.top + chartHeight - ((c.close - minPrice) / priceRange) * chartHeight;
      const yOpen = padding.top + chartHeight - ((c.open - minPrice) / priceRange) * chartHeight;
      const yHigh = padding.top + chartHeight - ((c.high - minPrice) / priceRange) * chartHeight;
      const yLow = padding.top + chartHeight - ((c.low - minPrice) / priceRange) * chartHeight;
      const volHeight = (c.volume / maxVolume) * 45; // max 45px volume bar
      const volY = padding.top + chartHeight - volHeight;
      return { x, y, yOpen, yHigh, yLow, volY, volHeight, candle: c, index: i };
    });
  }, [candles, chartWidth, chartHeight, minPrice, priceRange, maxVolume, padding]);

  // Smooth SVG Path
  const linePathD = useMemo(() => {
    if (points.length < 2) return "";
    return points.reduce((acc, pt, idx, arr) => {
      if (idx === 0) return `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      const prev = arr[idx - 1];
      const cp1x = prev.x + (pt.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (pt.x - prev.x) / 2;
      const cp2y = pt.y;
      return `${acc} C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }, "");
  }, [points]);

  // Area Path
  const areaPathD = useMemo(() => {
    if (points.length < 2 || !linePathD) return "";
    const last = points[points.length - 1];
    const first = points[0];
    const bottomY = padding.top + chartHeight;
    return `${linePathD} L ${last.x.toFixed(1)},${bottomY} L ${first.x.toFixed(1)},${bottomY} Z`;
  }, [linePathD, points, padding, chartHeight]);

  // Previous Close Y level
  const prevCloseY = useMemo(() => {
    if (previousClose <= 0) return null;
    return padding.top + chartHeight - ((previousClose - minPrice) / priceRange) * chartHeight;
  }, [previousClose, minPrice, priceRange, padding, chartHeight]);

  // Mouse Move over chart
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - padding.left;
    const boundedX = Math.max(0, Math.min(chartWidth, mouseX));
    const ratio = boundedX / chartWidth;
    const index = Math.round(ratio * (points.length - 1));
    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Date range label
  const dateRangeLabel = useMemo(() => {
    if (!candles || candles.length === 0) return "";
    const first = new Date(candles[0].date);
    const last = new Date(candles[candles.length - 1].date);
    const fMonth = first.toLocaleString("en-US", { month: "short" });
    const lMonth = last.toLocaleString("en-US", { month: "short" });
    const year = last.getFullYear();

    if (currentRange === "1D") {
      return last.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    if (fMonth === lMonth) {
      return `${fMonth} ${first.getDate()} – ${last.getDate()}, ${year}`;
    }
    return `${fMonth} ${first.getDate()} – ${lMonth} ${last.getDate()}, ${year}`;
  }, [candles, currentRange]);

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="w-full rounded-2xl bg-[#11151F] border border-[#1C2230] p-4 sm:p-5 relative flex flex-col shadow-sm">
      {/* Chart Top Metrics Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-4">
        <div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
              {formatPrice(activePrice, currency)}
            </span>

            <div
              className={`flex items-center text-sm sm:text-base font-semibold font-mono ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>{formatChange(effectiveChange, currency)}</span>
              <span className="ml-1 text-xs sm:text-sm">
                ({formatPercent(effectiveChangePercent)})
              </span>
            </div>
          </div>

          <div className="text-xs text-neutral-400 mt-1">
            {dateRangeLabel}
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-[#161B28] px-2.5 py-1 rounded-full border border-neutral-800">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Chart Toolbar: Time Ranges + Chart Mode Options */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 py-2.5 border-y border-[#181D2A] text-xs">
        {/* Time Range Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {RANGES.map((r) => {
            const isActive = currentRange === r;
            return (
              <button
                key={r}
                onClick={() => onRangeChange(r)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  isActive
                    ? "bg-[#1E2538] text-white shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-[#161A26]"
                }`}
              >
                {r}
              </button>
            );
          })}
          <button className="p-1 rounded text-neutral-400 hover:text-white hover:bg-[#161A26]">
            <Calendar className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Controls: Chart Type, Compare, Camera, Expand */}
        <div className="flex items-center gap-1.5 text-neutral-400">
          <div className="flex items-center bg-[#161A26] rounded-lg p-0.5 border border-[#1E2434]">
            <button
              onClick={() => setChartType("area")}
              className={`p-1 rounded ${
                chartType === "area" ? "bg-[#202738] text-white" : "hover:text-white"
              }`}
              title="Area Line Chart"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType("candle")}
              className={`p-1 rounded ${
                chartType === "candle" ? "bg-[#202738] text-white" : "hover:text-white"
              }`}
              title="Candlestick Chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#161A26] hover:bg-[#1E2538] text-neutral-300 border border-[#1E2434] transition-colors">
            <span>Compare</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          <button className="p-1.5 rounded-lg hover:bg-[#161A26] hover:text-white transition-colors" title="Snapshot">
            <Camera className="w-3.5 h-3.5" />
          </button>

          <button className="p-1.5 rounded-lg hover:bg-[#161A26] hover:text-white transition-colors" title="Full screen">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button className="p-1.5 rounded-lg hover:bg-[#161A26] hover:text-white transition-colors">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Chart Canvas & SVG Container */}
      <div
        ref={containerRef}
        className="relative w-full h-[360px] cursor-crosshair select-none mt-2"
      >
        {/* Subtle Watermark */}
        <div className="absolute top-4 right-14 pointer-events-none select-none text-[11px] font-mono tracking-wider font-semibold text-neutral-700/60 uppercase">
          stockly.ai
        </div>

        <svg
          viewBox={`0 0 ${containerWidth} ${height}`}
          className="w-full h-full overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="stockAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isPositive ? "#10b981" : "#ef4444"}
                stopOpacity={0.25}
              />
              <stop
                offset="100%"
                stopColor={isPositive ? "#10b981" : "#ef4444"}
                stopOpacity={0.0}
              />
            </linearGradient>

            {/* Grid Pattern */}
            <pattern id="gridDots" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.75" fill="#1F2636" />
            </pattern>
          </defs>

          {/* Grid Background */}
          <rect
            x={padding.left}
            y={padding.top}
            width={chartWidth}
            height={chartHeight}
            fill="url(#gridDots)"
          />

          {/* Previous Close Reference Line */}
          {prevCloseY !== null && (
            <g>
              <line
                x1={padding.left}
                y1={prevCloseY}
                x2={padding.left + chartWidth}
                y2={prevCloseY}
                stroke="#4B5563"
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.6}
              />
              <text
                x={padding.left + chartWidth + 6}
                y={prevCloseY + 3}
                fill="#6B7280"
                fontSize={9}
                fontFamily="monospace"
              >
                {previousClose.toFixed(2)}
              </text>
            </g>
          )}

          {/* Volume Histogram Bars */}
          {points.map((pt) => {
            const candleIsUp = pt.candle.close >= pt.candle.open;
            return (
              <rect
                key={`vol-${pt.index}`}
                x={pt.x - 1.5}
                y={pt.volY}
                width={3}
                height={pt.volHeight}
                fill={candleIsUp ? "#10b981" : "#ef4444"}
                opacity={0.35}
              />
            );
          })}

          {/* Line or Candlestick mode */}
          {chartType === "area" ? (
            <g>
              {/* Gradient Area */}
              {areaPathD && <path d={areaPathD} fill="url(#stockAreaGradient)" />}

              {/* Smooth Stroke Line */}
              {linePathD && (
                <path
                  d={linePathD}
                  fill="none"
                  stroke={isPositive ? "#22c55e" : "#ef4444"}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </g>
          ) : (
            /* Candlestick Rendering */
            <g>
              {points.map((pt) => {
                const isGreen = pt.candle.close >= pt.candle.open;
                const candleColor = isGreen ? "#22c55e" : "#ef4444";
                const bodyTop = Math.min(pt.yOpen, pt.y);
                const bodyHeight = Math.max(Math.abs(pt.y - pt.yOpen), 1.5);

                return (
                  <g key={`candle-${pt.index}`}>
                    {/* Wick */}
                    <line
                      x1={pt.x}
                      y1={pt.yHigh}
                      x2={pt.x}
                      y2={pt.yLow}
                      stroke={candleColor}
                      strokeWidth={1}
                    />
                    {/* Body */}
                    <rect
                      x={pt.x - 2.5}
                      y={bodyTop}
                      width={5}
                      height={bodyHeight}
                      fill={candleColor}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Crosshair & Tooltip Trigger */}
          {activePoint && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={padding.top + chartHeight}
                stroke="#6B7280"
                strokeWidth={1}
                strokeDasharray="2 2"
                opacity={0.8}
              />

              {/* Horizontal Crosshair Line */}
              <line
                x1={padding.left}
                y1={activePoint.y}
                x2={padding.left + chartWidth}
                y2={activePoint.y}
                stroke="#6B7280"
                strokeWidth={1}
                strokeDasharray="2 2"
                opacity={0.8}
              />

              {/* Highlight Circle on Line */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={4}
                fill="#ffffff"
                stroke={isPositive ? "#22c55e" : "#ef4444"}
                strokeWidth={2}
              />

              {/* Price Label on Right Y Axis */}
              <rect
                x={padding.left + chartWidth + 2}
                y={activePoint.y - 9}
                width={44}
                height={18}
                rx={3}
                fill="#1E2536"
                stroke="#2B354C"
                strokeWidth={1}
              />
              <text
                x={padding.left + chartWidth + 6}
                y={activePoint.y + 3}
                fill="#FFFFFF"
                fontSize={9}
                fontFamily="monospace"
                fontWeight="bold"
              >
                {activePoint.candle.close.toFixed(2)}
              </text>
            </g>
          )}

          {/* Static Y-Axis Price Labels */}
          {[maxPrice, (maxPrice + minPrice) / 2, minPrice].map((priceVal, idx) => {
            const yPos = padding.top + (idx / 2) * chartHeight;
            return (
              <text
                key={`ylabel-${idx}`}
                x={padding.left + chartWidth + 6}
                y={yPos + 3}
                fill="#6B7280"
                fontSize={9}
                fontFamily="monospace"
              >
                {priceVal.toFixed(0)}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip matching the Reference UI */}
        {activePoint && (
          <div
            className="absolute pointer-events-none z-30 rounded-xl bg-[#0F131D]/95 border border-[#232B3D] p-3 shadow-2xl backdrop-blur-md text-xs font-sans w-48 transition-all"
            style={{
              left: Math.min(
                Math.max(10, activePoint.x - 90),
                containerWidth - 210
              ),
              top: Math.min(activePoint.y - 10, chartHeight - 110),
            }}
          >
            {/* Header: Timestamp and Session */}
            <div className="flex items-center justify-between text-[11px] text-neutral-400 pb-1.5 mb-1.5 border-b border-[#1A2130]">
              <span className="font-medium text-white">
                {new Date(activePoint.candle.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-[10px] text-neutral-400 px-1 py-0.5 rounded bg-[#182030]">
                Regular
              </span>
            </div>

            {/* OHLCV metrics */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-mono">
              <span className="text-neutral-500">Close</span>
              <span className="text-white font-semibold text-right">
                ${activePoint.candle.close.toFixed(2)}
              </span>

              <span className="text-neutral-500">Open</span>
              <span className="text-neutral-300 text-right">
                ${activePoint.candle.open.toFixed(2)}
              </span>

              <span className="text-neutral-500">High</span>
              <span className="text-neutral-300 text-right">
                ${activePoint.candle.high.toFixed(2)}
              </span>

              <span className="text-neutral-500">Low</span>
              <span className="text-neutral-300 text-right">
                ${activePoint.candle.low.toFixed(2)}
              </span>

              <span className="text-neutral-500">Volume</span>
              <span className="text-neutral-300 text-right">
                {formatCompactNumber(activePoint.candle.volume)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
