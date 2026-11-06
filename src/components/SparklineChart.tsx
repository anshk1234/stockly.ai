"use client";

import React, { useId } from "react";

interface SparklineChartProps {
  data?: number[];
  isPositive: boolean;
  className?: string;
  height?: number;
  width?: number;
}

export function SparklineChart({
  data = [],
  isPositive,
  className = "",
  height = 56,
  width = 160,
}: SparklineChartProps) {
  const gradientId = useId();

  if (!data || data.length < 2) {
    // Generate a subtle smooth default line if not enough points
    return (
      <div className={`h-[${height}px] flex items-center justify-center opacity-30 text-xs text-neutral-500 ${className}`}>
        <span>No chart data</span>
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Add padding to SVG so top and bottom lines don't get clipped
  const padding = 4;
  const usableHeight = height - padding * 2;
  const usableWidth = width;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * usableWidth;
    const y = height - padding - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  // Build SVG path
  const pathD = points.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    // Smooth Bezier curve control points
    const prev = arr[idx - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }, "");

  // Area path (closed at the bottom)
  const lastPoint = points[points.length - 1];
  const areaD = `${pathD} L ${lastPoint.x.toFixed(1)},${height} L 0,${height} Z`;

  const strokeColor = isPositive ? "#22c55e" : "#ef4444";
  const stopColor = isPositive ? "#10b981" : "#f43f5e";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stopColor} stopOpacity={0.25} />
            <stop offset="100%" stopColor={stopColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Gradient Area */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Line Stroke */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
