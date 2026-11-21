"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import { ArrowUpRight, ArrowDownRight, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { DetailedPredictionOption, PredictionHistoricalPoint } from "@/lib/polymarket";

interface PredictionMultiLineChartProps {
  options: DetailedPredictionOption[];
  polymarketUrl?: string;
  activeRange?: string;
  onRangeChange?: (range: string) => void;
  className?: string;
}

const RANGES = ["1H", "6H", "1D", "1W", "1M", "MAX"];

export function PredictionMultiLineChart({
  options,
  polymarketUrl = "https://polymarket.com",
  activeRange = "MAX",
  onRangeChange,
  className = "",
}: PredictionMultiLineChartProps) {
  const [range, setRange] = useState<string>(activeRange);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hoverXPos, setHoverXPos] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleRangeSelect = (r: string) => {
    setRange(r);
    setHoveredIdx(null);
    if (onRangeChange) onRangeChange(r);
  };

  // Top 5 options plotted on the chart
  const activeSeries = useMemo(() => {
    return options.slice(0, 5).map((s) => ({
      ...s,
      points: s.history[range] || s.history["MAX"] || [],
    }));
  }, [options, range]);

  const pointCount = activeSeries[0]?.points?.length || 0;

  // Chart dimensions & coordinate math
  const width = 850;
  const height = 330;
  const padding = { top: 24, right: 48, bottom: 28, left: 16 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Fixed Y-axis ticks 0% to 100%
  const yTicks = [100, 80, 60, 40, 20, 0];

  const getX = useCallback(
    (idx: number) => {
      if (pointCount <= 1) return padding.left;
      return padding.left + (idx / (pointCount - 1)) * chartW;
    },
    [pointCount, chartW, padding.left]
  );

  const getY = useCallback(
    (prob: number) => {
      const clamped = Math.max(0, Math.min(100, prob));
      return padding.top + (1 - clamped / 100) * chartH;
    },
    [chartH, padding.top]
  );

  // Generate crisp stepped-linear path for authentic orderbook history
  const generatePath = useCallback(
    (points: PredictionHistoricalPoint[]) => {
      if (!points || points.length === 0) return "";
      let d = `M ${getX(0)} ${getY(points[0].p)}`;
      for (let i = 1; i < points.length; i++) {
        const x = getX(i);
        const y = getY(points[i].p);
        d += ` L ${x} ${y}`;
      }
      return d;
    },
    [getX, getY]
  );

  // Crosshair interactions
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || pointCount <= 1) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const normX = (clientX / rect.width) * width;
    const relX = Math.max(0, Math.min(chartW, normX - padding.left));
    const rawIdx = Math.round((relX / chartW) * (pointCount - 1));
    const idx = Math.max(0, Math.min(pointCount - 1, rawIdx));

    setHoveredIdx(idx);
    setHoverXPos((clientX / rect.width) * 100);
  };

  const handlePointerLeave = () => {
    setHoveredIdx(null);
  };

  const samplePoints = activeSeries[0]?.points || [];
  const hoveredTimestamp = hoveredIdx !== null && samplePoints[hoveredIdx] ? samplePoints[hoveredIdx].t : null;

  const formatTickDate = (t: number) => {
    const d = new Date(t * 1000);
    if (range === "1H" || range === "6H" || range === "1D") {
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    if (range === "1W" || range === "1M") {
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + ", 12 AM";
  };

  const formatTooltipTime = (t: number) => {
    const d = new Date(t * 1000);
    return d.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const visibleOptions = isExpanded ? options : options.slice(0, 5);
  const hiddenCount = Math.max(0, options.length - 5);

  return (
    <div
      ref={containerRef}
      className={`w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-card)] p-4 sm:p-5 flex flex-col gap-4 ${className}`}
    >
      {/* Top Header Row: Timeframe capsules + watermark */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-[#141517] p-1 rounded-lg border border-[var(--border)]">
          {RANGES.map((r) => {
            const isActive = range === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => handleRangeSelect(r)}
                className={`px-2.5 py-1 text-xs font-[var(--weight-medium)] rounded transition-colors ${
                  isActive
                    ? "bg-[#25272B] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Multi-Line Chart Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair block"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {/* Subtle horizontal grid lines & Y-axis labels */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={width - padding.right + 10}
                  y={y + 3.5}
                  fill="rgba(255,255,255,0.4)"
                  fontSize="11"
                  fontFamily="monospace"
                  textAnchor="start"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Date ticks along bottom */}
          {pointCount > 0 &&
            [0, Math.floor(pointCount * 0.2), Math.floor(pointCount * 0.4), Math.floor(pointCount * 0.6), Math.floor(pointCount * 0.8), pointCount - 1].map(
              (idx) => {
                const pt = samplePoints[idx];
                if (!pt) return null;
                const x = getX(idx);
                return (
                  <text
                    key={idx}
                    x={x}
                    y={height - 6}
                    fill="rgba(255,255,255,0.4)"
                    fontSize="11"
                    textAnchor={idx === 0 ? "start" : idx === pointCount - 1 ? "end" : "middle"}
                  >
                    {formatTickDate(pt.t)}
                  </text>
                );
              }
            )}

          {/* Clean Stepped Multi-Line Curves */}
          {activeSeries.map((s) => {
            const pathD = generatePath(s.points);
            const lastPt = s.points[s.points.length - 1];
            return (
              <g key={s.label}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {lastPt && (
                  <circle
                    cx={getX(s.points.length - 1)}
                    cy={getY(lastPt.p)}
                    r="3.5"
                    fill={s.color}
                  />
                )}
              </g>
            );
          })}

          {/* Crosshair indicator & Coordinates */}
          {hoveredIdx !== null && (
            <g>
              <line
                x1={getX(hoveredIdx)}
                y1={padding.top}
                x2={getX(hoveredIdx)}
                y2={height - padding.bottom}
                stroke="rgba(255,255,255,0.3)"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
              {activeSeries.map((s) => {
                const pt = s.points[hoveredIdx];
                if (!pt) return null;
                const cx = getX(hoveredIdx);
                const cy = getY(pt.p);
                return (
                  <g key={s.label}>
                    <circle cx={cx} cy={cy} r="4.5" fill={s.color} />
                    <circle cx={cx} cy={cy} r="2.5" fill="#141517" />
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* Floating Crosshair Tooltip attached dynamically to cursor X */}
        {hoveredIdx !== null && hoveredTimestamp && (
          <div
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none bg-[#1c1d21]/95 backdrop-blur-md border border-[var(--border)] rounded-lg p-2.5 shadow-2xl flex flex-col gap-1.5 z-30 min-w-[150px]"
            style={{
              left: hoverXPos > 65 ? undefined : `${hoverXPos + 2}%`,
              right: hoverXPos > 65 ? `${102 - hoverXPos}%` : undefined,
            }}
          >
            <div className="text-[11px] font-[var(--weight-medium)] text-[var(--text-muted)] border-b border-[var(--border)] pb-1">
              {formatTooltipTime(hoveredTimestamp)}
            </div>
            <div className="flex flex-col gap-1">
              {activeSeries.map((s) => {
                const pt = s.points[hoveredIdx];
                if (!pt) return null;
                return (
                  <div key={s.label} className="flex items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-[var(--text-primary)]">{s.label}:</span>
                    </div>
                    <span className="text-[var(--text-primary)] font-semibold">{pt.p.toFixed(2)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Clean Outcomes Breakdown List directly below chart */}
      <div className="flex flex-col pt-3 border-t border-[var(--border)]">
        {visibleOptions.map((opt, i) => {
          const isPositive = opt.change >= 0;
          return (
            <div
              key={i}
              className="py-2.5 flex items-center justify-between text-xs border-b border-[var(--border)]/50 last:border-b-0"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: opt.color }}
                />
                <span className="font-[var(--weight-medium)] text-[var(--text-primary)] text-sm">
                  {opt.label}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0 font-mono">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {opt.percentage.toFixed(1)}%
                </span>
                <div
                  className="flex items-center gap-0.5 text-xs font-semibold w-14 justify-end"
                  style={{ color: isPositive ? "#3ecf8e" : "#f2555a" }}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-3 h-3 stroke-[2]" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 stroke-[2]" />
                  )}
                  <span>{Math.abs(opt.change).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* See more toggle + bottom status links */}
        <div className="flex flex-col gap-3 pt-3">
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors self-start"
            >
              <span>{isExpanded ? "See less" : `See ${hiddenCount} more`}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
            <span>Updated 1 min. ago</span>
            <a
              href={polymarketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--text-primary)] transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span>View on Polymarket</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
