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
  height = 44,
  width = 240,
}: SparklineChartProps) {
  const gradientId = useId();

  if (!data || data.length < 2) {
    return (
      <div className={`h-[${height}px] flex items-center justify-center opacity-30 text-xs text-neutral-500 ${className}`}>
        <span>No chart data</span>
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Vertical safe padding inside canvas
  const paddingTop = 4;
  const paddingBottom = 4;
  const usableHeight = height - paddingTop - paddingBottom;

  // Build edge-to-edge full-bleed points starting at x=0 and ending at x=width
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - paddingBottom - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  // Smooth Bezier curve path
  const pathD = points.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    const prev = arr[idx - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }, "");

  // Area fill: closed cleanly at the bottom
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const color = isPositive ? "#3ecf8e" : "#f2555a";

  return (
    <div className={`w-full h-full relative overflow-hidden select-none ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full block overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Increased luminous gradient lighting under the curve */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="45%" stopColor={color} stopOpacity={0.12} />
            <stop offset="85%" stopColor={color} stopOpacity={0.03} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Soft Ambient Area Fog */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Edge-to-Edge Single Solid Color Stroke */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
