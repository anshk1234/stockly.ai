"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Maximize2, Minimize2, ExternalLink, X } from "lucide-react";
import { Card } from "@/components/ui/layout";
import { TickerLogo } from "@/components/ui/TickerLogo";
import {
  HeatmapStockItem,
  INDIA_HEATMAP_CONSTITUENTS,
  US_HEATMAP_CONSTITUENTS,
} from "@/lib/heatmap-data";
import {
  computeHierarchicalTreemap,
  SectorLayout,
  StockLayout,
} from "@/lib/treemap";

interface MarketHeatmapProps {
  region?: "IN" | "US";
}

// Client-side cache: 15-minute freshness (900,000 ms) to minimize Vercel server requests
const clientHeatmapCache: Record<string, { stocks: HeatmapStockItem[]; timestamp: number }> = {};
const CACHE_DURATION_MS = 15 * 60 * 1000;

export function MarketHeatmap({ region = "IN" }: MarketHeatmapProps) {
  const [stocks, setStocks] = useState<HeatmapStockItem[]>(() => {
    return (
      clientHeatmapCache[region]?.stocks ||
      (region === "US" ? US_HEATMAP_CONSTITUENTS : INDIA_HEATMAP_CONSTITUENTS)
    );
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredStock, setHoveredStock] = useState<StockLayout | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const inlineContainerRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key to exit full screen & lock body scrolling
  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExpanded(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  // Fetch live enriched quotes (cached for 15 minutes)
  useEffect(() => {
    let isCurrent = true;

    async function loadHeatmap() {
      const cached = clientHeatmapCache[region];
      const now = Date.now();
      if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
        setStocks(cached.stocks);
        return;
      }

      try {
        const res = await fetch(`/api/heatmap?region=${region}`);
        const data = await res.json();
        if (isCurrent && data.stocks) {
          clientHeatmapCache[region] = { stocks: data.stocks, timestamp: Date.now() };
          setStocks(data.stocks);
        }
      } catch (err) {
        console.warn("Failed to load heatmap data:", err);
      }
    }

    loadHeatmap();
    return () => {
      isCurrent = false;
    };
  }, [region]);

  // Normal Canvas layout (860 x 430)
  const inlineWidth = 860;
  const inlineHeight = 430;
  const inlineSectorLayouts: SectorLayout[] = useMemo(() => {
    return computeHierarchicalTreemap(stocks, inlineWidth, inlineHeight);
  }, [stocks]);

  // Expanded Full-Screen Canvas layout (1360 x 720)
  const expandedWidth = 1360;
  const expandedHeight = 720;
  const expandedSectorLayouts: SectorLayout[] = useMemo(() => {
    return computeHierarchicalTreemap(stocks, expandedWidth, expandedHeight);
  }, [stocks]);

  const handleMouseEnter = (
    e: React.MouseEvent<SVGRectElement>,
    stock: StockLayout,
    isModal: boolean
  ) => {
    const container = isModal ? modalContainerRef.current : inlineContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const popoverWidth = 320;
    const popoverHeight = 220;
    const padding = 12;

    let posX = mouseX + 16;
    let posY = mouseY - 20;

    if (posX + popoverWidth > rect.width - padding) {
      posX = mouseX - popoverWidth - 16;
    }
    if (posY + popoverHeight > rect.height - padding) {
      posY = rect.height - popoverHeight - padding;
    }
    if (posY < padding) {
      posY = padding;
    }

    setPopoverPos({ x: posX, y: posY });
    setHoveredStock(stock);
  };

  const handleMouseLeave = () => {
    setHoveredStock(null);
  };

  const currencySymbol = region === "IN" ? "₹" : "$";
  const nowFormatted = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: region === "IN" ? "Asia/Kolkata" : "America/New_York",
  }).format(new Date());
  const timezoneCode = region === "IN" ? "IST" : "EST";

  // Reusable Treemap SVG Renderer
  const renderTreemapSVG = (
    layouts: SectorLayout[],
    width: number,
    height: number,
    isModal: boolean
  ) => (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto block select-none rounded-[6px] overflow-hidden"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {layouts.map((sectorLayout) => (
        <g key={sectorLayout.sector}>
          {/* Sector Header Label */}
          <text
            x={sectorLayout.x + 3}
            y={sectorLayout.y + 12}
            fill="#8a8f98"
            fontSize={isModal ? 12 : 10.5}
            fontWeight={500}
            className="pointer-events-none select-none tracking-tight"
          >
            {sectorLayout.sector}
          </text>

          {/* Sector Stock Tiles */}
          {sectorLayout.stocks.map((stock) => {
            const isHovered = hoveredStock?.cleanSymbol === stock.cleanSymbol;
            const change = stock.changePercent ?? 0;
            const sign = change >= 0 ? "+" : "";
            const changeStr = `${sign}${change.toFixed(2)}%`;
            const displaySymbol = stock.cleanSymbol.replace(".NS", "");

            const showFullText = stock.width >= 56 && stock.height >= 32;
            const showSymbolOnly = !showFullText && stock.width >= 32 && stock.height >= 18;

            return (
              <g key={stock.cleanSymbol}>
                <rect
                  x={stock.x}
                  y={stock.y}
                  width={Math.max(0, stock.width - 1.5)}
                  height={Math.max(0, stock.height - 1.5)}
                  fill={stock.color}
                  stroke={isHovered ? "#ffffff" : "#141517"}
                  strokeWidth={isHovered ? 2 : 1}
                  rx={2}
                  className="transition-all duration-150 cursor-pointer hover:opacity-95"
                  onMouseEnter={(e) => handleMouseEnter(e, stock, isModal)}
                  onMouseMove={(e) => handleMouseEnter(e, stock, isModal)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => {
                    window.location.href = `/stocks/${encodeURIComponent(stock.cleanSymbol)}`;
                  }}
                />

                {showFullText && (
                  <g className="pointer-events-none select-none">
                    <text
                      x={stock.x + stock.width / 2}
                      y={stock.y + stock.height / 2 - 3}
                      fill="#ffffff"
                      fontSize={Math.min(isModal ? 14 : 12, Math.max(9.5, stock.width * 0.16))}
                      fontWeight={600}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="tracking-tight"
                    >
                      {displaySymbol}
                    </text>
                    <text
                      x={stock.x + stock.width / 2}
                      y={stock.y + stock.height / 2 + 10}
                      fill="rgba(255, 255, 255, 0.9)"
                      fontSize={Math.min(isModal ? 12 : 10.5, Math.max(8.5, stock.width * 0.14))}
                      fontWeight={500}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {changeStr}
                    </text>
                  </g>
                )}

                {showSymbolOnly && (
                  <text
                    x={stock.x + stock.width / 2}
                    y={stock.y + stock.height / 2}
                    fill="#ffffff"
                    fontSize={Math.min(isModal ? 11 : 10, Math.max(8, stock.width * 0.2))}
                    fontWeight={600}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="pointer-events-none select-none tracking-tight"
                  >
                    {displaySymbol}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );

  // Floating Popover Card
  const renderPopover = () => {
    if (!hoveredStock) return null;
    return (
      <div
        className="absolute z-50 pointer-events-none transition-all duration-75"
        style={{
          left: `${popoverPos.x}px`,
          top: `${popoverPos.y}px`,
          width: "320px",
        }}
      >
        <div className="bg-[#1b1c20] border border-[var(--border)] rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
          {/* Sector & Industry breadcrumb */}
          <div className="text-[11px] font-[var(--weight-medium)] text-[var(--text-muted)] truncate mb-1">
            {hoveredStock.sector} · {hoveredStock.industry}
          </div>

          {/* Logo + Ticker + Name */}
          <div className="flex items-center gap-2 mb-1.5">
            <TickerLogo
              symbol={hoveredStock.cleanSymbol}
              name={hoveredStock.name}
              size={24}
            />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                {hoveredStock.cleanSymbol} {hoveredStock.name}
              </div>
            </div>
          </div>

          {/* Price & Change */}
          <div className="flex items-center gap-2 text-[12.5px] font-[var(--weight-medium)] tabular-nums mb-2">
            <span className="text-[var(--text-primary)]">
              {currencySymbol}
              {(hoveredStock.price ?? 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span
              style={{
                color: (hoveredStock.changePercent ?? 0) >= 0 ? "#3ecf8e" : "#f2555a",
              }}
            >
              {(hoveredStock.changePercent ?? 0) >= 0 ? "↗" : "↘"}{" "}
              {(hoveredStock.changePercent ?? 0) >= 0 ? "+" : ""}
              {(hoveredStock.changePercent ?? 0).toFixed(2)}%
            </span>
          </div>

          {/* News / Catalyst Narrative */}
          {hoveredStock.catalyst && (
            <div className="text-[11.5px] text-[var(--text-primary)]/80 leading-relaxed line-clamp-3 bg-[#131416] p-2 rounded-lg border border-white/5 mb-2">
              {hoveredStock.catalyst.headline}
            </div>
          )}

          {/* Footer Timestamp & Sources */}
          <div className="flex items-center justify-between text-[10.5px] text-[var(--text-muted)] pt-1.5 border-t border-[var(--border)]">
            <span>
              {hoveredStock.catalyst?.time || "Live Market Wire"} · {timezoneCode}
            </span>
            <div className="flex items-center gap-1 text-[var(--text-primary)] font-[var(--weight-medium)]">
              <span>{hoveredStock.catalyst?.publisher || "Sources"}</span>
              <ExternalLink size={10} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Bottom Legend
  const renderLegend = () => (
    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)]">
      <div className="flex items-center gap-1.5">
        <span className="font-[var(--weight-medium)] text-[#e53e3e]">-3%</span>
        <div className="flex items-center gap-0.5">
          <span className="w-3.5 h-2.5 rounded-[1px] bg-[#e53e3e]" />
          <span className="w-3.5 h-2.5 rounded-[1px] bg-[#ad2c38]" />
          <span className="w-3.5 h-2.5 rounded-[1px] bg-[#75222b]" />
          <span className="w-3.5 h-2.5 rounded-[1px] bg-[#202227]" />
          <span className="w-3.5 h-2.5 rounded-[1px] bg-[#1b6e4e]" />
          <span className="w-3.5 h-2.5 rounded-[1px] bg-[#239a6a]" />
          <span className="w-3.5 h-2.5 rounded-[1px] bg-[#2ebd85]" />
        </div>
        <span className="font-[var(--weight-medium)] text-[#2ebd85]">+3%</span>
      </div>

      <div className="flex items-center gap-3">
        <span>
          {nowFormatted} {timezoneCode}
        </span>
        <span className="font-[var(--weight-medium)] text-[var(--text-primary)]">
          stockly.ai
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Inline Heatmap Card on Page */}
      <div className="w-full">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-[var(--weight-medium)] text-[var(--text-primary)]">
              Top 500 Heatmap
            </h3>
            <span className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-card-hover)] px-2 py-0.5 rounded">
              {region === "IN" ? "Nifty 500 Constituents" : "S&P 500 Mega Caps"}
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-1.5 text-[11px] font-[var(--weight-medium)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-card-hover)] cursor-pointer"
          >
            <Maximize2 size={12} />
            <span>Expand ⤢</span>
          </button>
        </div>

        {/* Card Body */}
        <div ref={inlineContainerRef} className="relative w-full">
          <Card className="relative overflow-hidden p-3 bg-[#16171a] border border-[var(--border)] transition-transform duration-200">
            {renderTreemapSVG(inlineSectorLayouts, inlineWidth, inlineHeight, false)}
            {!isExpanded && renderPopover()}
            {renderLegend()}
          </Card>
        </div>
      </div>

      {/* 2. Full-Screen Animated Modal via Portal */}
      {isExpanded && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-8 animate-in fade-in duration-200 ease-out"
          onClick={() => setIsExpanded(false)}
        >
          <div
            ref={modalContainerRef}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[1400px] bg-[#141518] border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200 ease-out"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <h3 className="text-[16px] font-semibold text-white tracking-tight">
                  Top 500 Heatmap
                </h3>
                <span className="text-[11.5px] text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full font-medium">
                  {region === "IN" ? "Nifty 500 Constituents · NSE/BSE" : "S&P 500 Mega Caps · US Markets"}
                </span>
              </div>

              {/* Collapse Button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer"
              >
                <Minimize2 size={13} />
                <span>Collapse (Esc)</span>
              </button>
            </div>

            {/* Modal Canvas */}
            <div className="relative flex-1 overflow-hidden rounded-lg bg-[#16171a] p-3 border border-white/5">
              {renderTreemapSVG(expandedSectorLayouts, expandedWidth, expandedHeight, true)}
              {isExpanded && renderPopover()}
            </div>

            {/* Modal Legend Footer */}
            {renderLegend()}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
