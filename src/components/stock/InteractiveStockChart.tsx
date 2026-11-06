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
  RotateCcw,
  ZoomIn,
} from "lucide-react";
import { CandlePoint, TimeRange } from "@/lib/types";
import { formatPrice, formatPercent, formatChange, formatCompactNumber } from "@/lib/utils";
import { Card } from "@/components/ui/layout";

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

  // Zoom and Pan States
  const [viewWindow, setViewWindow] = useState<{ start: number; end: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; window: { start: number; end: number } } | null>(null);

  // Reset zoom on range or dataset changes
  useEffect(() => {
    setViewWindow(null);
    setHoverIndex(null);
  }, [candles, currentRange]);

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

  // Compute sliced candles based on zoom window
  const visibleCandles = useMemo(() => {
    if (!candles || candles.length === 0) return [];
    if (!viewWindow) return candles;
    const start = Math.max(0, Math.min(viewWindow.start, candles.length - 2));
    const end = Math.min(candles.length - 1, Math.max(viewWindow.end, start + 2));
    return candles.slice(start, end + 1);
  }, [candles, viewWindow]);

  const latestCandle = visibleCandles[visibleCandles.length - 1];
  const activeCandle = hoverIndex !== null && visibleCandles[hoverIndex] ? visibleCandles[hoverIndex] : latestCandle;

  const activePrice = activeCandle ? activeCandle.close : initialPrice;
  const isHovering = hoverIndex !== null;

  const effectiveChange = activeCandle
    ? isHovering
      ? activeCandle.close - previousClose
      : initialChange
    : initialChange;
  const effectiveChangePercent =
    previousClose > 0 ? (effectiveChange / previousClose) * 100 : initialChangePercent;
  const isPositive = effectiveChange >= 0;

  const height = 340;
  const padding = { top: 20, right: 54, bottom: 44, left: 12 };
  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = Math.max(300, containerWidth - padding.left - padding.right);

  // Mouse Wheel Zoom anchored at pointer location
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (!candles || candles.length < 6) return;
      // Prevent entire browser page scrolling while scrolling on graph
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - padding.left;
      const ratio = Math.max(0, Math.min(1, mouseX / chartWidth));

      const total = candles.length;
      const curStart = viewWindow ? viewWindow.start : 0;
      const curEnd = viewWindow ? viewWindow.end : total - 1;
      const curSpan = curEnd - curStart;

      // Wheel up: zoom in. Wheel down: zoom out.
      const zoomIn = e.deltaY < 0;
      const factor = zoomIn ? 0.8 : 1.25;

      const minSpan = Math.min(6, total);
      const maxSpan = total - 1;

      let newSpan = Math.round(curSpan * factor);
      newSpan = Math.max(minSpan, Math.min(maxSpan, newSpan));

      if (newSpan >= maxSpan) {
        setViewWindow(null); // Reset to full 100% view
        return;
      }

      const anchor = curStart + ratio * curSpan;
      let newStart = Math.round(anchor - ratio * newSpan);
      let newEnd = newStart + newSpan;

      if (newStart < 0) {
        newStart = 0;
        newEnd = newSpan;
      }
      if (newEnd > total - 1) {
        newEnd = total - 1;
        newStart = Math.max(0, newEnd - newSpan);
      }

      setViewWindow({ start: newStart, end: newEnd });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [candles, chartWidth, padding.left, viewWindow]);

  const { minPrice, maxPrice, priceRange, maxVolume } = useMemo(() => {
    if (!visibleCandles || visibleCandles.length === 0) {
      return { minPrice: 0, maxPrice: 100, priceRange: 100, maxVolume: 1000 };
    }
    const closes = visibleCandles.map((c) => c.close);
    const highs = visibleCandles.map((c) => c.high);
    const lows = visibleCandles.map((c) => c.low);
    const volumes = visibleCandles.map((c) => c.volume);

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
  }, [visibleCandles, previousClose]);

  const points = useMemo(() => {
    if (!visibleCandles || visibleCandles.length === 0) return [];
    return visibleCandles.map((c, i) => {
      const x = padding.left + (i / Math.max(visibleCandles.length - 1, 1)) * chartWidth;
      const y = padding.top + chartHeight - ((c.close - minPrice) / priceRange) * chartHeight;
      const yOpen = padding.top + chartHeight - ((c.open - minPrice) / priceRange) * chartHeight;
      const yHigh = padding.top + chartHeight - ((c.high - minPrice) / priceRange) * chartHeight;
      const yLow = padding.top + chartHeight - ((c.low - minPrice) / priceRange) * chartHeight;
      const volHeight = (c.volume / maxVolume) * 40;
      const volY = padding.top + chartHeight - volHeight;
      return { x, y, yOpen, yHigh, yLow, volY, volHeight, candle: c, index: i };
    });
  }, [visibleCandles, chartWidth, chartHeight, minPrice, priceRange, maxVolume, padding]);

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

  const areaPathD = useMemo(() => {
    if (points.length < 2 || !linePathD) return "";
    const last = points[points.length - 1];
    const first = points[0];
    const bottomY = padding.top + chartHeight;
    return `${linePathD} L ${last.x.toFixed(1)},${bottomY} L ${first.x.toFixed(1)},${bottomY} Z`;
  }, [linePathD, points, padding, chartHeight]);

  const prevCloseY = useMemo(() => {
    if (previousClose <= 0) return null;
    return padding.top + chartHeight - ((previousClose - minPrice) / priceRange) * chartHeight;
  }, [previousClose, minPrice, priceRange, padding, chartHeight]);

  // Generate 5 evenly spaced Horizontal Price Grid Lines
  const priceGridTicks = useMemo(() => {
    const steps = [0, 0.25, 0.5, 0.75, 1];
    return steps.map((pct) => {
      const y = padding.top + pct * chartHeight;
      const priceVal = maxPrice - pct * (maxPrice - minPrice);
      return { y, priceVal };
    });
  }, [minPrice, maxPrice, padding.top, chartHeight]);

  // Generate 5-6 evenly spaced Vertical Time Grid Lines across visible candles
  const timeGridTicks = useMemo(() => {
    if (!visibleCandles || visibleCandles.length < 2) return [];
    const count = Math.min(6, Math.max(2, Math.floor(chartWidth / 110)));
    const ticks = [];
    const step = (visibleCandles.length - 1) / (count - 1);

    for (let i = 0; i < count; i++) {
      const idx = Math.min(Math.round(i * step), visibleCandles.length - 1);
      const candle = visibleCandles[idx];
      if (!candle) continue;

      const x = padding.left + (idx / Math.max(visibleCandles.length - 1, 1)) * chartWidth;
      const date = new Date(candle.date || candle.timestamp);

      let label = "";
      if (currentRange === "1D") {
        label = date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      } else if (currentRange === "5D" || currentRange === "1M") {
        label = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      } else {
        label = date.toLocaleDateString("en-US", {
          month: "short",
          year: currentRange === "5Y" || currentRange === "MAX" ? "2-digit" : undefined,
        });
      }

      ticks.push({ x, label });
    }

    return ticks;
  }, [visibleCandles, chartWidth, padding.left, currentRange]);

  // Drag Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (viewWindow) {
      setIsPanning(true);
      panStartRef.current = {
        clientX: e.clientX,
        window: { ...viewWindow },
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning && panStartRef.current && candles) {
      const dx = e.clientX - panStartRef.current.clientX;
      const span = panStartRef.current.window.end - panStartRef.current.window.start;
      const indexShift = -Math.round((dx / chartWidth) * span);

      const total = candles.length;
      let newStart = panStartRef.current.window.start + indexShift;
      let newEnd = panStartRef.current.window.end + indexShift;

      if (newStart < 0) {
        newStart = 0;
        newEnd = span;
      }
      if (newEnd > total - 1) {
        newEnd = total - 1;
        newStart = Math.max(0, newEnd - span);
      }

      setViewWindow({ start: newStart, end: newEnd });
      return;
    }

    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - padding.left;
    const boundedX = Math.max(0, Math.min(chartWidth, mouseX));
    const ratio = boundedX / chartWidth;
    const index = Math.round(ratio * (points.length - 1));
    setHoverIndex(index);
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    panStartRef.current = null;
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
    panStartRef.current = null;
    setHoverIndex(null);
  };

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
    <Card className="p-[16px] relative flex flex-col">
      {/* Chart Top Metrics Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-4)] mb-[var(--space-3)]">
        <div>
          <div className="flex items-baseline gap-2.5">
            {/* Page-level big number: --text-lg, weight 500 (never 700 bold), tabular-nums, no monospace */}
            <span className="text-[var(--text-lg)] font-[var(--weight-medium)] tracking-tight text-[var(--text-primary)] tabular-nums">
              {formatPrice(activePrice, currency)}
            </span>

            <div
              className={`flex items-center text-[var(--text-sm)] font-[var(--weight-medium)] tabular-nums ${
                isPositive ? "text-[var(--positive)]" : "text-[var(--negative)]"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 stroke-[2]" />
              )}
              <span>{formatChange(effectiveChange, currency)}</span>
              <span className="ml-1 text-[var(--text-xs)]">
                ({formatPercent(effectiveChangePercent)})
              </span>
            </div>
          </div>

          <div className="text-[var(--text-xs)] text-[var(--text-muted)] mt-0.5">
            {dateRangeLabel}
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--text-muted)] bg-[var(--bg-card-hover)] px-2.5 py-1 rounded-full border border-[var(--border)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--positive)]" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Chart Toolbar: Time Ranges + Chart Mode Options */}
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)] py-[var(--space-2)] border-y border-[var(--border)] text-[var(--text-xs)]">
        {/* Time Range Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {RANGES.map((r) => {
            const isActive = currentRange === r;
            return (
              <button
                key={r}
                onClick={() => onRangeChange(r)}
                className={`px-2 py-0.5 rounded-md font-[var(--weight-medium)] transition-colors ${
                  isActive
                    ? "bg-[var(--bg-card-hover)] text-[var(--text-primary)] border border-[var(--border)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                }`}
              >
                {r}
              </button>
            );
          })}
          <button className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]">
            <Calendar className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
          {/* Zoom Status & Reset Pill */}
          {viewWindow !== null && (
            <button
              onClick={() => setViewWindow(null)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--positive)]/10 text-[var(--positive)] border border-[var(--positive)]/25 hover:bg-[var(--positive)]/20 transition-colors text-[11px] font-[var(--weight-medium)]"
              title="Click or double-click to reset zoom"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Zoom</span>
            </button>
          )}

          <div className="flex items-center bg-[var(--bg-card-hover)] rounded-lg p-0.5 border border-[var(--border)]">
            <button
              onClick={() => setChartType("area")}
              className={`p-1 rounded ${
                chartType === "area" ? "bg-[var(--border)] text-[var(--text-primary)]" : "hover:text-[var(--text-primary)]"
              }`}
              title="Area Line Chart"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType("candle")}
              className={`p-1 rounded ${
                chartType === "candle" ? "bg-[var(--border)] text-[var(--text-primary)]" : "hover:text-[var(--text-primary)]"
              }`}
              title="Candlestick Chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--bg-card-hover)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-colors font-[var(--weight-medium)]">
            <span>Compare</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          <button className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors" title="Snapshot">
            <Camera className="w-3.5 h-3.5" />
          </button>

          <button className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors" title="Full screen">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Chart Canvas & SVG Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onDoubleClick={() => setViewWindow(null)}
        className={`relative w-full h-[340px] select-none mt-2 ${
          viewWindow
            ? isPanning
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-crosshair"
        }`}
        title="Scroll wheel to zoom in/out at pointer · Drag to pan · Double-click to reset"
      >
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
                stopColor={isPositive ? "var(--positive)" : "var(--negative)"}
                stopOpacity={0.2}
              />
              <stop
                offset="100%"
                stopColor={isPositive ? "var(--positive)" : "var(--negative)"}
                stopOpacity={0.0}
              />
            </linearGradient>

            {/* Subtle background coordinate grid */}
            <pattern id="lightGridPattern" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Background Grid Canvas */}
          <rect
            x={padding.left}
            y={padding.top}
            width={chartWidth}
            height={chartHeight}
            fill="url(#lightGridPattern)"
          />

          {/* Subtle Vertical Time Grid Lines */}
          {timeGridTicks.map((tick, idx) => (
            <g key={`v-grid-${idx}`}>
              <line
                x1={tick.x}
                y1={padding.top}
                x2={tick.x}
                y2={padding.top + chartHeight}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth={1}
              />
              <text
                x={tick.x}
                y={padding.top + chartHeight + 18}
                fill="var(--text-muted)"
                fontSize={10}
                textAnchor="middle"
                className="tabular-nums select-none"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Subtle Horizontal Price Grid Lines & Price Labels */}
          {priceGridTicks.map((tick, idx) => (
            <g key={`h-grid-${idx}`}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={padding.left + chartWidth}
                y2={tick.y}
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth={1}
              />
              <text
                x={padding.left + chartWidth + 6}
                y={tick.y + 3}
                fill="var(--text-muted)"
                fontSize={10}
                className="tabular-nums select-none"
              >
                {tick.priceVal.toLocaleString("en-US", {
                  minimumFractionDigits: tick.priceVal < 10 ? 2 : 0,
                  maximumFractionDigits: 2,
                })}
              </text>
            </g>
          ))}

          {/* Watermark Label in Top Right */}
          <text
            x={padding.left + chartWidth - 10}
            y={padding.top + 22}
            textAnchor="end"
            fill="rgba(255, 255, 255, 0.16)"
            fontSize={12.5}
            fontWeight="500"
            letterSpacing="-0.02em"
            className="select-none pointer-events-none"
          >
            perplexity
          </text>

          {/* Previous Close Reference Line */}
          {prevCloseY !== null && (
            <g>
              <line
                x1={padding.left}
                y1={prevCloseY}
                x2={padding.left + chartWidth}
                y2={prevCloseY}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={padding.left + chartWidth + 6}
                y={prevCloseY + 3}
                fill="var(--text-muted)"
                fontSize={10}
                className="tabular-nums select-none"
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
                fill={candleIsUp ? "var(--positive)" : "var(--negative)"}
                opacity={0.35}
              />
            );
          })}

          {chartType === "area" ? (
            <g>
              {areaPathD && <path d={areaPathD} fill="url(#stockAreaGradient)" />}
              {linePathD && (
                <path
                  d={linePathD}
                  fill="none"
                  stroke={isPositive ? "var(--positive)" : "var(--negative)"}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </g>
          ) : (
            <g>
              {points.map((pt) => {
                const isGreen = pt.candle.close >= pt.candle.open;
                const candleColor = isGreen ? "var(--positive)" : "var(--negative)";
                const bodyTop = Math.min(pt.yOpen, pt.y);
                const bodyHeight = Math.max(Math.abs(pt.y - pt.yOpen), 1.5);

                return (
                  <g key={`candle-${pt.index}`}>
                    <line
                      x1={pt.x}
                      y1={pt.yHigh}
                      x2={pt.x}
                      y2={pt.yLow}
                      stroke={candleColor}
                      strokeWidth={1}
                    />
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

          {/* Active Hover / Pointer Crosshairs */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={padding.top + chartHeight}
                stroke="var(--text-muted)"
                strokeWidth={1}
                strokeDasharray="2 2"
                opacity={0.7}
              />
              <line
                x1={padding.left}
                y1={activePoint.y}
                x2={padding.left + chartWidth}
                y2={activePoint.y}
                stroke="var(--text-muted)"
                strokeWidth={1}
                strokeDasharray="2 2"
                opacity={0.7}
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={4}
                fill="#ffffff"
                stroke={isPositive ? "var(--positive)" : "var(--negative)"}
                strokeWidth={2}
              />
              <rect
                x={padding.left + chartWidth + 2}
                y={activePoint.y - 9}
                width={50}
                height={18}
                rx={3}
                fill="var(--bg-card-hover)"
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={padding.left + chartWidth + 6}
                y={activePoint.y + 3}
                fill="var(--text-primary)"
                fontSize={10}
                fontWeight="500"
                className="tabular-nums"
              >
                {activePoint.candle.close.toFixed(2)}
              </text>
            </g>
          )}
        </svg>

        {activePoint && (() => {
          const tooltipWidth = 205;
          const isRightSide = activePoint.x + tooltipWidth + 24 > containerWidth;
          const tooltipX = isRightSide
            ? Math.max(10, activePoint.x - tooltipWidth - 14)
            : Math.min(containerWidth - tooltipWidth - 10, activePoint.x + 14);
          const tooltipY = Math.max(padding.top + 6, Math.min(activePoint.y - 30, chartHeight - 125));

          const candleDate = new Date(activePoint.candle.date || activePoint.candle.timestamp);
          const dateStr =
            currentRange === "1D"
              ? `${candleDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${candleDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
              : `${candleDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${candleDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

          return (
            <div
              className="absolute pointer-events-none z-30 rounded-[var(--radius-card)] bg-[#121316]/80 border border-white/10 px-3 py-2.5 shadow-2xl backdrop-blur-md text-[var(--text-xs)] w-[205px]"
              style={{
                left: tooltipX,
                top: tooltipY,
              }}
            >
              {/* Header Timestamp & Market Session */}
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pb-1.5 mb-1.5 border-b border-white/10">
                <span className="font-[var(--weight-medium)] text-[var(--text-primary)] truncate max-w-[130px]" title={dateStr}>
                  {dateStr}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] px-1 py-0.5 rounded bg-white/5 shrink-0 ml-1">
                  Regular
                </span>
              </div>

              {/* OHLCV Metric Rows */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11.5px]">
                <span className="text-[var(--text-muted)]">Close</span>
                <span className="text-[var(--text-primary)] font-[var(--weight-medium)] text-right tabular-nums">
                  {formatPrice(activePoint.candle.close, currency, symbol)}
                </span>

                <span className="text-[var(--text-muted)]">Open</span>
                <span className="text-[var(--text-muted)] text-right tabular-nums">
                  {formatPrice(activePoint.candle.open, currency, symbol)}
                </span>

                <span className="text-[var(--text-muted)]">High</span>
                <span className="text-[var(--text-muted)] text-right tabular-nums">
                  {formatPrice(activePoint.candle.high, currency, symbol)}
                </span>

                <span className="text-[var(--text-muted)]">Low</span>
                <span className="text-[var(--text-muted)] text-right tabular-nums">
                  {formatPrice(activePoint.candle.low, currency, symbol)}
                </span>

                <span className="text-[var(--text-muted)]">Volume</span>
                <span className="text-[var(--text-muted)] text-right tabular-nums">
                  {formatCompactNumber(activePoint.candle.volume)}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </Card>
  );
}
