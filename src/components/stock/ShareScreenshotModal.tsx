"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  X,
  LineChart as LineChartIcon,
  BarChart2,
  Sun,
  Moon,
  Copy,
  Download,
  Check,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { CandlePoint, TimeRange } from "@/lib/types";
import { formatPrice, formatPercent, formatChange } from "@/lib/utils";
import { TickerLogo } from "@/components/ui/TickerLogo";

interface ShareScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  name: string;
  exchange?: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  candles: CandlePoint[];
  currentRange: TimeRange;
}

type AspectRatio = "1:1" | "3:4" | "16:9";
type ThemeMode = "dark" | "light";

export function ShareScreenshotModal({
  isOpen,
  onClose,
  symbol,
  name,
  exchange = "NSE",
  currency,
  price,
  change,
  changePercent,
  previousClose,
  candles,
  currentRange,
}: ShareScreenshotModalProps) {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [chartType, setChartType] = useState<"area" | "candle">("area");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [showPrevClose, setShowPrevClose] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const isPositive = change >= 0;

  // Compute dimensions based on aspect ratio (base width 560px)
  const dimensions = useMemo(() => {
    switch (aspectRatio) {
      case "1:1":
        return { width: 520, height: 520, chartH: 260 };
      case "3:4":
        return { width: 440, height: 586, chartH: 330 };
      case "16:9":
        return { width: 620, height: 350, chartH: 175 };
    }
  }, [aspectRatio]);

  // Compute SVG chart path for snapshot
  const { minPrice, maxPrice, priceRange, points, prevCloseY } = useMemo(() => {
    if (!candles || candles.length === 0) {
      return { minPrice: 0, maxPrice: 100, priceRange: 100, points: [], prevCloseY: 0 };
    }

    const chartW = dimensions.width - 64;
    const chartH = dimensions.chartH;

    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    let min = Math.min(...lows, showPrevClose && previousClose > 0 ? previousClose : Infinity);
    let max = Math.max(...highs, showPrevClose && previousClose > 0 ? previousClose : -Infinity);

    if (min === max) {
      min *= 0.96;
      max *= 1.04;
    }
    const margin = (max - min) * 0.1;
    const minP = min - margin;
    const maxP = max + margin;
    const pRange = maxP - minP || 1;

    const pts = candles.map((c, i) => {
      const x = (i / Math.max(candles.length - 1, 1)) * chartW;
      const y = chartH - ((c.close - minP) / pRange) * chartH;
      const yOpen = chartH - ((c.open - minP) / pRange) * chartH;
      const yHigh = chartH - ((c.high - minP) / pRange) * chartH;
      const yLow = chartH - ((c.low - minP) / pRange) * chartH;
      return { x, y, yOpen, yHigh, yLow, c };
    });

    const pcY = chartH - ((previousClose - minP) / pRange) * chartH;

    return {
      minPrice: minP,
      maxPrice: maxP,
      priceRange: pRange,
      points: pts,
      prevCloseY: pcY,
    };
  }, [candles, dimensions, showPrevClose, previousClose]);

  const pathD = useMemo(() => {
    if (points.length < 2) return "";
    return points.reduce((acc, pt, idx, arr) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      const prev = arr[idx - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
    }, "");
  }, [points]);

  const areaD = useMemo(() => {
    if (!pathD || points.length < 2) return "";
    const last = points[points.length - 1];
    const first = points[0];
    return `${pathD} L ${last.x} ${dimensions.chartH} L ${first.x} ${dimensions.chartH} Z`;
  }, [pathD, points, dimensions.chartH]);

  // Export card as high-res PNG using Canvas
  const generateCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!cardRef.current) return null;

    const scale = 2; // High-resolution retina scale
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width * scale;
    canvas.height = dimensions.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.scale(scale, scale);

    const isDark = theme === "dark";
    const bgColor = isDark ? "#0f1012" : "#ffffff";
    const textColor = isDark ? "#ffffff" : "#09090b";
    const textMuted = isDark ? "#8a8f98" : "#71717a";
    const strokeColor = isPositive ? "#3ecf8e" : "#f2555a";
    const borderColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";

    // 1. Draw Card Background
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(0, 0, dimensions.width, dimensions.height, 20);
    ctx.fill();

    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. Header Text (Left)
    ctx.fillStyle = textColor;
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(name.slice(0, 24), 32, 54);

    ctx.fillStyle = textMuted;
    ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`${symbol} • ${exchange}`, 32, 74);

    // 3. Price & Change
    ctx.fillStyle = textColor;
    ctx.font = "600 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(formatPrice(price, currency), 32, 114);

    ctx.fillStyle = strokeColor;
    ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const changeStr = `${formatChange(change, currency)} (${formatPercent(changePercent)})`;
    ctx.fillText(changeStr, 32, 134);

    // 4. Watermark (Top Right)
    ctx.fillStyle = textMuted;
    ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Stockly Finance", dimensions.width - 32, 54);
    ctx.textAlign = "left";

    // 5. Render Chart Path
    const chartOffsetX = 32;
    const chartOffsetY = dimensions.height - dimensions.chartH - 40;

    // Gradient fill
    const grad = ctx.createLinearGradient(0, chartOffsetY, 0, chartOffsetY + dimensions.chartH);
    grad.addColorStop(0, isPositive ? "rgba(62, 207, 142, 0.25)" : "rgba(242, 85, 90, 0.25)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");

    if (points.length > 1) {
      if (chartType === "area") {
        // Draw Area Fill
        ctx.save();
        ctx.beginPath();
        points.forEach((pt, idx) => {
          const x = chartOffsetX + pt.x;
          const y = chartOffsetY + pt.y;
          if (idx === 0) ctx.moveTo(x, y);
          else {
            const prev = points[idx - 1];
            const cx = chartOffsetX + (prev.x + pt.x) / 2;
            ctx.bezierCurveTo(cx, chartOffsetY + prev.y, cx, y, x, y);
          }
        });
        const last = points[points.length - 1];
        const first = points[0];
        ctx.lineTo(chartOffsetX + last.x, chartOffsetY + dimensions.chartH);
        ctx.lineTo(chartOffsetX + first.x, chartOffsetY + dimensions.chartH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        // Draw Line Stroke
        ctx.save();
        ctx.beginPath();
        points.forEach((pt, idx) => {
          const x = chartOffsetX + pt.x;
          const y = chartOffsetY + pt.y;
          if (idx === 0) ctx.moveTo(x, y);
          else {
            const prev = points[idx - 1];
            const cx = chartOffsetX + (prev.x + pt.x) / 2;
            ctx.bezierCurveTo(cx, chartOffsetY + prev.y, cx, y, x, y);
          }
        });
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
      } else {
        // Draw Candlesticks
        const candleW = Math.max(2, (dimensions.width - 64) / points.length - 1.5);
        points.forEach((pt) => {
          const isUp = pt.c.close >= pt.c.open;
          const color = isUp ? "#3ecf8e" : "#f2555a";
          const x = chartOffsetX + pt.x;
          // Wick
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, chartOffsetY + pt.yHigh);
          ctx.lineTo(x, chartOffsetY + pt.yLow);
          ctx.stroke();
          // Body
          ctx.fillStyle = color;
          const top = chartOffsetY + Math.min(pt.y, pt.yOpen);
          const bHeight = Math.max(2, Math.abs(pt.y - pt.yOpen));
          ctx.fillRect(x - candleW / 2, top, candleW, bHeight);
        });
      }

      // Draw dashed previous close line if enabled
      if (showPrevClose && previousClose > 0 && prevCloseY >= 0 && prevCloseY <= dimensions.chartH) {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)";
        ctx.beginPath();
        ctx.moveTo(chartOffsetX, chartOffsetY + prevCloseY);
        ctx.lineTo(chartOffsetX + (dimensions.width - 64), chartOffsetY + prevCloseY);
        ctx.stroke();

        // Previous close tag
        ctx.setLineDash([]);
        ctx.fillStyle = isDark ? "#27272a" : "#e4e4e7";
        ctx.beginPath();
        const tagW = 100;
        const tagH = 18;
        const tagX = dimensions.width - 32 - tagW;
        const tagY = chartOffsetY + prevCloseY - 9;
        ctx.roundRect(tagX, tagY, tagW, tagH, 4);
        ctx.fill();

        ctx.fillStyle = textMuted;
        ctx.font = "10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(`Prev: ${formatPrice(previousClose, currency)}`, tagX + 6, tagY + 13);
        ctx.restore();
      }
    }

    return canvas;
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) return;

      const link = document.createElement("a");
      link.download = `stockly-${symbol.toLowerCase()}-${currentRange.toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Failed to download image:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    setIsExporting(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        } catch {
          // Fallback if ClipboardItem write not supported
          const item = document.createElement("a");
          item.href = canvas.toDataURL("image/png");
          item.download = `stockly-${symbol}.png`;
          item.click();
        }
      });
    } catch (err) {
      console.error("Failed to copy image:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[680px] bg-[#121316] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-white max-h-[90vh] overflow-y-auto">
        {/* Header toolbar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-[16px] text-white tracking-tight">Share screenshot</h3>

            {/* Aspect ratio selector */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 text-[12px] font-medium text-neutral-400">
              {(["1:1", "3:4", "16:9"] as AspectRatio[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    aspectRatio === r ? "bg-white/15 text-white font-semibold" : "hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Chart type toggle */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 text-[12px] text-neutral-400">
              <button
                onClick={() => setChartType("area")}
                className={`p-1.5 rounded-md ${
                  chartType === "area" ? "bg-white/15 text-white" : "hover:text-white"
                }`}
                title="Area line"
              >
                <LineChartIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setChartType("candle")}
                className={`p-1.5 rounded-md ${
                  chartType === "candle" ? "bg-white/15 text-white" : "hover:text-white"
                }`}
                title="Candlestick"
              >
                <BarChart2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Theme toggle */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 text-[12px] text-neutral-400">
              <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-md ${theme === "dark" ? "bg-white/15 text-white" : "hover:text-white"}`}
                title="Dark theme"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-md ${theme === "light" ? "bg-white/15 text-white" : "hover:text-white"}`}
                title="Light theme"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview Card Container */}
        <div className="flex justify-center items-center py-2 overflow-hidden">
          <div
            ref={cardRef}
            style={{
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              backgroundColor: theme === "dark" ? "#0f1012" : "#ffffff",
              color: theme === "dark" ? "#ffffff" : "#09090b",
              borderColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
            }}
            className="rounded-2xl border p-8 flex flex-col justify-between shadow-2xl relative select-none transition-all"
          >
            {/* Header info */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <TickerLogo symbol={symbol} name={name} size={36} />
                <div>
                  <h4 className="font-bold text-[18px] leading-tight tracking-tight">
                    {name.slice(0, 24)}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11.5px] opacity-60 mt-0.5 font-medium">
                    <span>{symbol}</span>
                    <span>•</span>
                    <span>{exchange}</span>
                  </div>
                </div>
              </div>

              {/* Watermark brand */}
              <div className="flex items-center gap-1.5 text-[12px] font-semibold tracking-tight opacity-50">
                <span className="font-semibold">Stockly Finance</span>
              </div>
            </div>

            {/* Price badge */}
            <div className="mt-2">
              <div className="text-[26px] font-bold tracking-tight leading-tight">
                {formatPrice(price, currency)}
              </div>
              <div
                className={`flex items-center gap-1 text-[13px] font-semibold mt-0.5 ${
                  isPositive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span>{formatChange(change, currency)}</span>
                <span>({formatPercent(changePercent)})</span>
              </div>
            </div>

            {/* Interactive rendered SVG chart */}
            <div className="w-full flex-1 relative mt-4 flex items-center">
              <svg
                width={dimensions.width - 64}
                height={dimensions.chartH}
                className="overflow-visible"
              >
                <defs>
                  <linearGradient id="snapshotGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={isPositive ? "#3ecf8e" : "#f2555a"}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor={isPositive ? "#3ecf8e" : "#f2555a"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                {/* Previous close line */}
                {showPrevClose && previousClose > 0 && prevCloseY >= 0 && prevCloseY <= dimensions.chartH && (
                  <g>
                    <line
                      x1={0}
                      y1={prevCloseY}
                      x2={dimensions.width - 64}
                      y2={prevCloseY}
                      stroke={theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    <rect
                      x={dimensions.width - 64 - 100}
                      y={prevCloseY - 9}
                      width={100}
                      height={18}
                      rx={4}
                      fill={theme === "dark" ? "#27272a" : "#e4e4e7"}
                    />
                    <text
                      x={dimensions.width - 64 - 50}
                      y={prevCloseY + 3.5}
                      textAnchor="middle"
                      fill={theme === "dark" ? "#a1a1aa" : "#71717a"}
                      fontSize={10}
                      fontWeight={500}
                    >
                      Prev: {formatPrice(previousClose, currency)}
                    </text>
                  </g>
                )}

                {/* Area line or candlestick */}
                {chartType === "area" ? (
                  <g>
                    {areaD && <path d={areaD} fill="url(#snapshotGrad)" />}
                    {pathD && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke={isPositive ? "#3ecf8e" : "#f2555a"}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </g>
                ) : (
                  <g>
                    {points.map((pt, i) => {
                      const isUp = pt.c.close >= pt.c.open;
                      const color = isUp ? "#3ecf8e" : "#f2555a";
                      const candleW = Math.max(2, (dimensions.width - 64) / points.length - 1.5);
                      return (
                        <g key={i}>
                          <line
                            x1={pt.x}
                            y1={pt.yHigh}
                            x2={pt.x}
                            y2={pt.yLow}
                            stroke={color}
                            strokeWidth={1}
                          />
                          <rect
                            x={pt.x - candleW / 2}
                            y={Math.min(pt.y, pt.yOpen)}
                            width={candleW}
                            height={Math.max(2, Math.abs(pt.y - pt.yOpen))}
                            fill={color}
                          />
                        </g>
                      );
                    })}
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Footer controls: Show prev close switch + Copy & Download Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-4">
          <label className="flex items-center gap-2 cursor-pointer text-[13px] text-neutral-400 select-none">
            <input
              type="checkbox"
              checked={showPrevClose}
              onChange={(e) => setShowPrevClose(e.target.checked)}
              className="w-4 h-4 rounded bg-white/10 border-white/20 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-emerald-500"
            />
            <span>Show prev. close</span>
          </label>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              disabled={isExporting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-[13px] transition-all border border-white/10"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Image</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-semibold text-[13px] hover:bg-neutral-200 transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
