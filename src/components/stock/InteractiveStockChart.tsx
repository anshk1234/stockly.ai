"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Calendar,
  LineChart as LineChartIcon,
  BarChart2,
  Maximize2,
  Minimize2,
  Camera,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RotateCcw,
  Search,
  X,
  Check,
  ChevronRight,
} from "lucide-react";
import { CandlePoint, TimeRange } from "@/lib/types";
import { formatPrice, formatPercent, formatChange, formatCompactNumber } from "@/lib/utils";
import { Card } from "@/components/ui/layout";
import { TickerLogo } from "@/components/ui/TickerLogo";
import { ShareScreenshotModal } from "./ShareScreenshotModal";

interface InteractiveStockChartProps {
  symbol: string;
  name?: string;
  exchange?: string;
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

interface CompareAsset {
  symbol: string;
  name: string;
  currency: string;
  exchange?: string;
  price: number;
  change: number;
  changePercent: number;
  candles: CandlePoint[];
  color: string;
}

const RANGES: TimeRange[] = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"];

const COMPARE_COLORS = [
  "#f97316", // Vibrant Orange (exact match with User comparison reference)
  "#a855f7", // Violet / Purple
  "#eab308", // Amber / Gold
  "#ec4899", // Pink / Rose
  "#38bdf8", // Sky Blue
  "#10b981", // Emerald
];

const BASE_COLOR = "#06b6d4"; // Cyan blue (Perplexity style comparison base)

const POPULAR_COMPARE_TICKERS = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", price: 232.50, change: -1.22, changePercent: -0.52 },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", price: 284.78, change: 2.21, changePercent: 0.78 },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", price: 186.64, change: 5.05, changePercent: 2.78 },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", price: 530.61, change: -5.30, changePercent: -0.99 },
  { symbol: "BTC-USD", name: "Bitcoin USD", exchange: "CRYPTO", price: 75678.65, change: 297.27, changePercent: 0.39 },
  { symbol: "^NSEI", name: "NIFTY 50", exchange: "NSE", price: 25030.35, change: 493.75, changePercent: 2.01 },
];

export function InteractiveStockChart({
  symbol,
  name,
  exchange = "NSE",
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
  const [windowHeight, setWindowHeight] = useState(800);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Screenshot Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Compare Popover & Multi-Ticker State
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareSearch, setCompareSearch] = useState("");
  const [compareSearchResults, setCompareSearchResults] = useState<any[]>([]);
  const [isSearchingCompare, setIsSearchingCompare] = useState(false);
  const [compareAssets, setCompareAssets] = useState<CompareAsset[]>([]);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
  const comparePopoverRef = useRef<HTMLDivElement>(null);

  // Zoom and Pan States
  const [viewWindow, setViewWindow] = useState<{ start: number; end: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; window: { start: number; end: number } } | null>(null);

  // Reset zoom on range or dataset changes
  useEffect(() => {
    setViewWindow(null);
    setHoverIndex(null);
  }, [candles, currentRange]);

  // Window resize listener
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
      setWindowHeight(window.innerHeight);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Escape key listener for fullscreen and compare popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isCompareOpen) setIsCompareOpen(false);
        else if (isFullscreen) setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, isCompareOpen]);

  // Outside click listener for Compare popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comparePopoverRef.current && !comparePopoverRef.current.contains(e.target as Node)) {
        setIsCompareOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for compare popover
  useEffect(() => {
    if (!compareSearch.trim()) {
      setCompareSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingCompare(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(compareSearch.trim())}`);
        const data = await res.json();
        setCompareSearchResults(data.results || []);
      } catch {
        setCompareSearchResults([]);
      } finally {
        setIsSearchingCompare(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [compareSearch]);

  // When timeframe range changes, sync-refresh compare assets' charts
  useEffect(() => {
    if (compareAssets.length === 0) return;
    compareAssets.forEach(async (asset) => {
      try {
        const res = await fetch(`/api/stock/${encodeURIComponent(asset.symbol)}/chart?range=${currentRange}`);
        const data = await res.json();
        if (data.candles && data.candles.length > 0) {
          setCompareAssets((prev) =>
            prev.map((a) => (a.symbol === asset.symbol ? { ...a, candles: data.candles } : a))
          );
        }
      } catch (err) {
        console.error("Failed to sync comparison candles:", err);
      }
    });
  }, [currentRange]);

  // Handle adding a comparison ticker
  const handleToggleComparison = async (
    targetSym: string,
    targetName?: string,
    targetExch?: string,
    targetPrice?: number,
    targetChange?: number,
    targetChangePct?: number
  ) => {
    const cleanSym = targetSym.toUpperCase();
    if (cleanSym === symbol.toUpperCase()) return;

    // If already added, remove it
    if (compareAssets.some((a) => a.symbol === cleanSym)) {
      setCompareAssets((prev) => prev.filter((a) => a.symbol !== cleanSym));
      return;
    }

    setAddingSymbol(cleanSym);
    try {
      const [chartRes, stockRes] = await Promise.all([
        fetch(`/api/stock/${encodeURIComponent(cleanSym)}/chart?range=${currentRange}`).then((r) => r.json()),
        fetch(`/api/stock/${encodeURIComponent(cleanSym)}`).then((r) => r.json()).catch(() => null),
      ]);

      const fetchedCandles: CandlePoint[] = chartRes.candles || [];
      const stock = stockRes?.stock;
      const assignedColor = COMPARE_COLORS[compareAssets.length % COMPARE_COLORS.length];

      const newAsset: CompareAsset = {
        symbol: cleanSym,
        name: stock?.name || targetName || cleanSym,
        currency: stock?.currency || "USD",
        exchange: stock?.exchange || targetExch || "US",
        price: stock?.price ?? targetPrice ?? (fetchedCandles.length > 0 ? fetchedCandles[fetchedCandles.length - 1].close : 0),
        change: stock?.change ?? targetChange ?? 0,
        changePercent: stock?.changePercent ?? targetChangePct ?? 0,
        candles: fetchedCandles,
        color: assignedColor,
      };

      setCompareAssets((prev) => [...prev, newAsset]);
      setIsCompareOpen(false);
      setCompareSearch("");
    } catch (err) {
      console.error("Failed to add comparison ticker:", err);
    } finally {
      setAddingSymbol(null);
    }
  };

  const handleRemoveComparison = (symToRemove: string) => {
    setCompareAssets((prev) => prev.filter((a) => a.symbol !== symToRemove));
  };

  const isComparing = compareAssets.length > 0;

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

  // Dynamic Chart Height based on fullscreen & comparison legend
  const height = isFullscreen
    ? Math.max(480, windowHeight - (isComparing ? 320 : 220))
    : 340;
  const padding = { top: 20, right: 60, bottom: 44, left: 16 };
  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = Math.max(300, containerWidth - padding.left - padding.right);

  // Mouse Wheel Zoom anchored at pointer location (for single asset mode)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isComparing) return;

    const handleWheel = (e: WheelEvent) => {
      if (!candles || candles.length < 6) return;
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - padding.left;
      const ratio = Math.max(0, Math.min(1, mouseX / chartWidth));

      const total = candles.length;
      const curStart = viewWindow ? viewWindow.start : 0;
      const curEnd = viewWindow ? viewWindow.end : total - 1;
      const curSpan = curEnd - curStart;

      const zoomIn = e.deltaY < 0;
      const factor = zoomIn ? 0.8 : 1.25;

      const minSpan = Math.min(6, total);
      const maxSpan = total - 1;

      let newSpan = Math.round(curSpan * factor);
      newSpan = Math.max(minSpan, Math.min(maxSpan, newSpan));

      if (newSpan >= maxSpan) {
        setViewWindow(null);
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
  }, [candles, chartWidth, padding.left, viewWindow, isComparing]);

  // SINGLE ASSET NORMAL PRICE METRICS
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

  // MULTI-TICKER COMPARISON NORMALIZED RETURN (%) METRICS
  const comparisonData = useMemo(() => {
    if (!isComparing || !visibleCandles || visibleCandles.length === 0) {
      return null;
    }

    const baseFirst = visibleCandles[0]?.close || 1;
    const basePoints = visibleCandles.map((c, i) => {
      const time = new Date(c.date || c.timestamp || 0).getTime();
      const pctReturn = ((c.close - baseFirst) / baseFirst) * 100;
      return { time, close: c.close, pctReturn, candle: c, index: i };
    });

    const compSeries = compareAssets.map((asset) => {
      const cFirst = asset.candles[0]?.close || 1;
      const pts = asset.candles.map((c, i) => {
        const time = new Date(c.date || c.timestamp || 0).getTime();
        const pctReturn = ((c.close - cFirst) / cFirst) * 100;
        return { time, close: c.close, pctReturn, candle: c, index: i };
      });
      return { asset, points: pts };
    });

    // Collect all returns to determine global % range
    const allReturns: number[] = [0];
    basePoints.forEach((p) => allReturns.push(p.pctReturn));
    compSeries.forEach((s) => s.points.forEach((p) => allReturns.push(p.pctReturn)));

    let minRet = Math.min(...allReturns);
    let maxRet = Math.max(...allReturns);

    if (minRet === maxRet) {
      minRet -= 1;
      maxRet += 1;
    }
    const margin = Math.max(0.5, (maxRet - minRet) * 0.12);
    const minPadded = minRet - margin;
    const maxPadded = maxRet + margin;
    const rangePadded = maxPadded - minPadded || 1;

    // Collect all timestamps to build unified time window
    const allTimes: number[] = [];
    basePoints.forEach((p) => p.time > 0 && allTimes.push(p.time));
    compSeries.forEach((s) => s.points.forEach((p) => p.time > 0 && allTimes.push(p.time)));

    const minTime = allTimes.length > 0 ? Math.min(...allTimes) : 0;
    const maxTime = allTimes.length > 0 ? Math.max(...allTimes) : 1;
    const timeSpan = maxTime - minTime || 1;

    // Helper to calculate (x, y) coordinates for any point
    const calcXY = (time: number, pct: number, fallbackRatio: number) => {
      const x =
        minTime > 0 && maxTime > minTime
          ? padding.left + ((time - minTime) / timeSpan) * chartWidth
          : padding.left + fallbackRatio * chartWidth;
      const y = padding.top + chartHeight - ((pct - minPadded) / rangePadded) * chartHeight;
      return { x, y };
    };

    // Build base SVG path
    const baseCoords = basePoints.map((p, i) => ({
      ...calcXY(p.time, p.pctReturn, i / Math.max(basePoints.length - 1, 1)),
      ...p,
    }));

    // Build comparison SVG paths
    const compCoords = compSeries.map((s) => ({
      asset: s.asset,
      coords: s.points.map((p, i) => ({
        ...calcXY(p.time, p.pctReturn, i / Math.max(s.points.length - 1, 1)),
        ...p,
      })),
    }));

    const zeroY = padding.top + chartHeight - ((0 - minPadded) / rangePadded) * chartHeight;

    const baseLinePath = makePathD(baseCoords);
    const compPaths = compCoords.map((c) => ({
      asset: c.asset,
      linePath: makePathD(c.coords),
      coords: c.coords,
    }));

    // Generate % grid ticks
    const steps = [0, 0.25, 0.5, 0.75, 1];
    const pctTicks = steps.map((pct) => {
      const y = padding.top + pct * chartHeight;
      const val = maxPadded - pct * rangePadded;
      return { y, val };
    });

    return {
      baseCoords,
      baseLinePath,
      compPaths,
      zeroY,
      pctTicks,
      minTime,
      maxTime,
      timeSpan,
    };
  }, [isComparing, visibleCandles, compareAssets, padding, chartWidth, chartHeight]);

  // Single asset points
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

  // Resample visible candles to N uniformly spaced Y coordinates for liquid curve morphing
  const SAMPLE_POINTS = 100;
  const targetYPoints = useMemo(() => {
    if (!visibleCandles || visibleCandles.length === 0) return [];
    const len = visibleCandles.length;
    const result: number[] = [];
    const pRange = priceRange || 1;

    for (let k = 0; k < SAMPLE_POINTS; k++) {
      const ratio = k / (SAMPLE_POINTS - 1);
      const floatIdx = ratio * (len - 1);
      const lowIdx = Math.floor(floatIdx);
      const highIdx = Math.min(len - 1, lowIdx + 1);
      const frac = floatIdx - lowIdx;

      const pLow = visibleCandles[lowIdx].close;
      const pHigh = visibleCandles[highIdx].close;
      const priceVal = pLow * (1 - frac) + pHigh * frac;

      const y = padding.top + chartHeight - ((priceVal - minPrice) / pRange) * chartHeight;
      result.push(y);
    }
    return result;
  }, [visibleCandles, minPrice, priceRange, chartHeight, padding.top]);

  // Timeframe animation tracking
  const [isTimeframeTransition, setIsTimeframeTransition] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPendingRangeChangeRef = useRef(false);
  const prevCandlesRef = useRef<CandlePoint[]>(candles);

  // Timeframe range button click handler
  const handleRangeClick = (r: TimeRange) => {
    if (r === currentRange) return;
    setIsTimeframeTransition(true);
    isPendingRangeChangeRef.current = true;
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTimeframeTransition(false);
      isPendingRangeChangeRef.current = false;
    }, 10000);
    onRangeChange(r);
  };

  // Trigger smooth transition strictly when the new timeframe candles arrive from network
  useEffect(() => {
    if (candles !== prevCandlesRef.current) {
      prevCandlesRef.current = candles;

      // Only animate if this candle update was caused by a timeframe switch (not wheel zoom / pan)
      if (isPendingRangeChangeRef.current && viewWindow === null && !isPanning) {
        isPendingRangeChangeRef.current = false;
        setIsTimeframeTransition(true);

        if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = setTimeout(() => {
          setIsTimeframeTransition(false);
        }, 500);
      }
    }
  }, [candles, viewWindow, isPanning]);

  // If user begins zooming or panning, immediately disable any timeframe transition
  useEffect(() => {
    if (viewWindow !== null || isPanning) {
      isPendingRangeChangeRef.current = false;
      setIsTimeframeTransition(false);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    }
  }, [viewWindow, isPanning]);

  // Construct smooth SVG paths:
  // - When full view (timeframe view): uses normalized 100 control points so SVG 'd' transitions natively across timeframes!
  // - When zoomed in (scroll wheel / pan): uses exact points for 100% precision with 0ms lag!
  const linePathD = useMemo(() => {
    if (viewWindow !== null) {
      // Zoomed in: exact points directly
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
    }

    // Full range: 100 uniformly spaced control points for seamless native curve morphing
    if (!targetYPoints || targetYPoints.length < 2) return "";
    const stepX = chartWidth / (targetYPoints.length - 1);
    return targetYPoints.reduce((acc, y, idx) => {
      const x = padding.left + idx * stepX;
      if (idx === 0) return `M ${x.toFixed(1)},${y.toFixed(1)}`;
      const prevX = padding.left + (idx - 1) * stepX;
      const prevY = targetYPoints[idx - 1];
      const cp1x = prevX + (x - prevX) / 2;
      const cp1y = prevY;
      const cp2x = prevX + (x - prevX) / 2;
      const cp2y = y;
      return `${acc} C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
    }, "");
  }, [viewWindow, points, targetYPoints, chartWidth, padding.left]);

  const areaPathD = useMemo(() => {
    if (!linePathD) return "";
    const rightX = padding.left + chartWidth;
    const bottomY = padding.top + chartHeight;
    const leftX = padding.left;
    return `${linePathD} L ${rightX.toFixed(1)},${bottomY.toFixed(1)} L ${leftX.toFixed(1)},${bottomY.toFixed(1)} Z`;
  }, [linePathD, chartWidth, chartHeight, padding.left, padding.top]);

  const prevCloseY = useMemo(() => {
    if (previousClose <= 0 || isComparing) return null;
    return padding.top + chartHeight - ((previousClose - minPrice) / priceRange) * chartHeight;
  }, [previousClose, minPrice, priceRange, padding, chartHeight, isComparing]);

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
    if (e.button !== 0 || isComparing) return;
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

  // Values for Comparison Hover Synchronization
  const activeCompHover = useMemo(() => {
    if (!isComparing || !comparisonData || hoverIndex === null) {
      return null;
    }
    const basePt = comparisonData.baseCoords[hoverIndex] || comparisonData.baseCoords[comparisonData.baseCoords.length - 1];
    if (!basePt) return null;

    const comps = comparisonData.compPaths.map((p) => {
      // Find nearest candle in time to base point
      const matched = p.coords.reduce((prev, curr) =>
        Math.abs(curr.time - basePt.time) < Math.abs(prev.time - basePt.time) ? curr : prev
      , p.coords[0]);
      return {
        asset: p.asset,
        matched,
      };
    });

    return {
      basePt,
      comps,
    };
  }, [isComparing, comparisonData, hoverIndex]);

  return (
    <>
      <Card
        className={
          isFullscreen
            ? "fixed inset-0 z-50 bg-[#090a0b]/98 backdrop-blur-2xl p-6 md:p-8 overflow-y-auto flex flex-col justify-between animate-in fade-in zoom-in-95"
            : "p-[16px] relative flex flex-col"
        }
      >
        {/* Chart Top Metrics Header */}
        <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-4)] mb-[var(--space-3)]">
          <div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-[var(--text-lg)] font-[var(--weight-medium)] tracking-tight text-[var(--text-primary)] tabular-nums">
                {formatPrice(activePrice, currency)}
              </span>

              <div
                className={`flex items-center text-[var(--text-sm)] font-[var(--weight-medium)] tabular-nums ${
                  isPositive ? "text-positive" : "text-negative"
                }`}
                style={{ color: isPositive ? "#3ecf8e" : "#f2555a" }}
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
        </div>

        {/* Chart Toolbar: Time Ranges + Chart Mode Options */}
        <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)] py-[var(--space-2)] border-y border-[var(--border)] text-[var(--text-xs)] relative">
          {/* Time Range Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {RANGES.map((r) => {
              const isActive = currentRange === r;
              return (
                <button
                  key={r}
                  onClick={() => handleRangeClick(r)}
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

          {/* Controls Right */}
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            {/* Zoom Status & Reset Pill */}
            {viewWindow !== null && !isComparing && (
              <button
                onClick={() => setViewWindow(null)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--positive)]/10 text-[var(--positive)] border border-[var(--positive)]/25 hover:bg-[var(--positive)]/20 transition-colors text-[11px] font-[var(--weight-medium)]"
                title="Click or double-click to reset zoom"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Zoom</span>
              </button>
            )}

            {/* Area / Candle Toggle (Only enabled when not comparing) */}
            {!isComparing && (
              <div className="flex items-center bg-[var(--bg-card-hover)] rounded-lg p-0.5 border border-[var(--border)]">
                <button
                  onClick={() => setChartType("area")}
                  className={`p-1 rounded ${
                    chartType === "area"
                      ? "bg-[var(--border)] text-[var(--text-primary)]"
                      : "hover:text-[var(--text-primary)]"
                  }`}
                  title="Area Line Chart"
                >
                  <LineChartIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setChartType("candle")}
                  className={`p-1 rounded ${
                    chartType === "candle"
                      ? "bg-[var(--border)] text-[var(--text-primary)]"
                      : "hover:text-[var(--text-primary)]"
                  }`}
                  title="Candlestick Chart"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Compare Dropdown Button & Popover */}
            <div className="relative" ref={comparePopoverRef}>
              <button
                onClick={() => setIsCompareOpen(!isCompareOpen)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors font-[var(--weight-medium)] ${
                  isComparing || isCompareOpen
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-[var(--bg-card-hover)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border)]"
                }`}
                title="Compare against other tickers"
              >
                <span>Compare</span>
                {compareAssets.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {compareAssets.length}
                  </span>
                )}
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isCompareOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Compare Popover Dropdown (Perplexity Style) */}
              {isCompareOpen && (
                <div className="absolute right-0 top-full mt-2 w-[320px] sm:w-[360px] bg-[#121316] border border-white/15 rounded-xl shadow-2xl z-50 p-2.5 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
                  {/* Search Input Box */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-[13px]">
                    <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      value={compareSearch}
                      onChange={(e) => setCompareSearch(e.target.value)}
                      placeholder="Search tickers..."
                      className="w-full bg-transparent outline-none placeholder:text-neutral-500 text-[13px]"
                    />
                    {compareSearch && (
                      <button
                        onClick={() => setCompareSearch("")}
                        className="text-neutral-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isSearchingCompare && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                    )}
                  </div>

                  {/* Tickers List */}
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-white/5 flex flex-col no-scrollbar">
                    {addingSymbol && (
                      <div className="p-3 text-center text-[12px] text-neutral-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                        <span>Adding {addingSymbol}...</span>
                      </div>
                    )}

                    {compareSearch.trim().length > 0 ? (
                      /* Live Search Results */
                      compareSearchResults.length > 0 ? (
                        compareSearchResults.map((item) => {
                          const sym = item.symbol;
                          const isAlreadyAdded = compareAssets.some(
                            (a) => a.symbol === sym.toUpperCase()
                          );
                          const isBase = sym.toUpperCase() === symbol.toUpperCase();

                          return (
                            <button
                              key={sym}
                              disabled={isBase}
                              onClick={() =>
                                handleToggleComparison(
                                  sym,
                                  item.longname || item.shortname || sym,
                                  item.exchDisp || item.exchange
                                )
                              }
                              className={`flex items-center justify-between p-2.5 rounded-lg text-left transition-colors w-full ${
                                isBase
                                  ? "opacity-40 cursor-not-allowed"
                                  : "hover:bg-white/5 cursor-pointer"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <TickerLogo symbol={sym} name={item.longname || item.shortname} size={28} />
                                <div className="truncate">
                                  <div className="font-semibold text-white text-[13px] truncate">
                                    {item.longname || item.shortname || sym}
                                  </div>
                                  <div className="text-[11px] text-neutral-400 truncate">
                                    {sym} • {item.exchDisp || item.exchange || "US"}
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0 ml-2">
                                {isAlreadyAdded ? (
                                  <span className="flex items-center gap-1 text-[11px] text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded">
                                    <Check className="w-3 h-3" />
                                    <span>Added</span>
                                  </span>
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                                )}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-[12px] text-neutral-400">
                          {isSearchingCompare ? "Searching..." : "No tickers found."}
                        </div>
                      )
                    ) : (
                      /* Default Popular Quick-Pick Suggestions */
                      POPULAR_COMPARE_TICKERS.map((item) => {
                        const isAlreadyAdded = compareAssets.some(
                          (a) => a.symbol === item.symbol
                        );
                        const isBase = item.symbol === symbol.toUpperCase();

                        return (
                          <button
                            key={item.symbol}
                            disabled={isBase}
                            onClick={() =>
                              handleToggleComparison(
                                item.symbol,
                                item.name,
                                item.exchange,
                                item.price,
                                item.change,
                                item.changePercent
                              )
                            }
                            className={`flex items-center justify-between p-2.5 rounded-lg text-left transition-colors w-full ${
                              isBase
                                ? "opacity-40 cursor-not-allowed"
                                : "hover:bg-white/5 cursor-pointer"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <TickerLogo symbol={item.symbol} name={item.name} size={28} />
                              <div className="truncate">
                                <div className="font-semibold text-white text-[13px] truncate">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-neutral-400 truncate">
                                  {item.symbol} • {item.exchange}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2 text-right">
                              <div>
                                <div className="text-[12px] font-semibold text-white tabular-nums">
                                  {formatPrice(item.price, "USD")}
                                </div>
                                <div
                                  className={`text-[10px] tabular-nums ${
                                    item.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                                  }`}
                                >
                                  {item.changePercent >= 0 ? "↗" : "↘"} {Math.abs(item.changePercent).toFixed(2)}%
                                </div>
                              </div>
                              {isAlreadyAdded ? (
                                <Check className="w-4 h-4 text-orange-400 ml-1" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-neutral-500" />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Camera Snapshot Share Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
              title="Share as image"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            {/* Full Screen Mode Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
              title={isFullscreen ? "Exit full screen (Esc)" : "Full screen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-[var(--positive)]" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Interactive Chart Canvas & SVG Container */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onDoubleClick={() => !isComparing && setViewWindow(null)}
          className={`relative w-full select-none mt-2 ${
            isComparing
              ? "cursor-crosshair"
              : viewWindow
              ? isPanning
                ? "cursor-grabbing"
                : "cursor-grab"
              : "cursor-crosshair"
          }`}
          style={{ height: `${height}px` }}
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
                  stopColor={isComparing ? BASE_COLOR : isPositive ? "var(--positive)" : "var(--negative)"}
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor={isComparing ? BASE_COLOR : isPositive ? "var(--positive)" : "var(--negative)"}
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

            {/* Grid Lines: Price (Single Mode) OR Normalized % (Comparison Mode) */}
            {isComparing && comparisonData ? (
              /* Comparison Mode Grid: 0% Baseline + Percentage Ticks */
              <g>
                {/* 0% Baseline */}
                {comparisonData.zeroY >= padding.top && comparisonData.zeroY <= padding.top + chartHeight && (
                  <g>
                    <line
                      x1={padding.left}
                      y1={comparisonData.zeroY}
                      x2={padding.left + chartWidth}
                      y2={comparisonData.zeroY}
                      stroke="rgba(255, 255, 255, 0.22)"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left + chartWidth + 6}
                      y={comparisonData.zeroY + 3}
                      fill="#ffffff"
                      fontSize={10}
                      fontWeight="600"
                      className="tabular-nums select-none"
                    >
                      0.0%
                    </text>
                  </g>
                )}

                {/* Percentage Grid Ticks */}
                {comparisonData.pctTicks.map((tick, idx) => (
                  <g key={`pct-tick-${idx}`}>
                    <line
                      x1={padding.left}
                      y1={tick.y}
                      x2={padding.left + chartWidth}
                      y2={tick.y}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth={1}
                    />
                    <text
                      x={padding.left + chartWidth + 6}
                      y={tick.y + 3}
                      fill="var(--text-muted)"
                      fontSize={10}
                      className="tabular-nums select-none"
                    >
                      {tick.val >= 0 ? "+" : ""}
                      {tick.val.toFixed(1)}%
                    </text>
                  </g>
                ))}
              </g>
            ) : (
              /* Single Asset Nominal Price Grid */
              priceGridTicks.map((tick, idx) => (
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
              ))
            )}

            {/* Previous Close Reference Line (Single Asset Mode) */}
            {!isComparing && prevCloseY !== null && (
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

            {/* Volume Histogram Bars (Single Asset Mode) */}
            {!isComparing &&
              points.map((pt) => {
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

            {/* CHART CURVES / CANDLES */}
            {isComparing && comparisonData ? (
              /* MULTI-SERIES COMPARISON CURVES */
              <g>
                {/* Base asset line */}
                {comparisonData.baseCoords.length > 1 && (
                  <path
                    d={comparisonData.baseLinePath}
                    fill="none"
                    stroke={BASE_COLOR}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Comparison assets lines */}
                {comparisonData.compPaths.map((cp) => (
                  <path
                    key={cp.asset.symbol}
                    d={cp.linePath}
                    fill="none"
                    stroke={cp.asset.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </g>
            ) : chartType === "area" ? (
              /* SINGLE ASSET AREA CHART */
              <g>
                {areaPathD && (
                  <path
                    d={areaPathD}
                    fill="url(#stockAreaGradient)"
                    style={{
                      transition: isTimeframeTransition
                        ? "d 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease"
                        : "none",
                    }}
                  />
                )}
                {linePathD && (
                  <path
                    d={linePathD}
                    fill="none"
                    stroke={isPositive ? "var(--positive)" : "var(--negative)"}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transition: isTimeframeTransition
                        ? "d 0.4s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease"
                        : "none",
                    }}
                  />
                )}
              </g>
            ) : (
              /* SINGLE ASSET CANDLESTICK CHART */
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

            {/* ACTIVE HOVER CROSSHAIR: Comparison Mode */}
            {isComparing && activeCompHover && (
              <g>
                <line
                  x1={activeCompHover.basePt.x}
                  y1={padding.top}
                  x2={activeCompHover.basePt.x}
                  y2={padding.top + chartHeight}
                  stroke="var(--text-muted)"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  opacity={0.7}
                />

                {/* Base dot */}
                <circle
                  cx={activeCompHover.basePt.x}
                  cy={activeCompHover.basePt.y}
                  r={4.5}
                  fill="#ffffff"
                  stroke={BASE_COLOR}
                  strokeWidth={2.5}
                />

                {/* Comparison dots */}
                {activeCompHover.comps.map((c) => (
                  <circle
                    key={c.asset.symbol}
                    cx={c.matched.x}
                    cy={c.matched.y}
                    r={4.5}
                    fill="#ffffff"
                    stroke={c.asset.color}
                    strokeWidth={2.5}
                  />
                ))}
              </g>
            )}

            {/* ACTIVE HOVER CROSSHAIR: Single Asset Mode */}
            {!isComparing && activePoint && (
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
                  width={52}
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

          {/* SINGLE ASSET HOVER TOOLTIP */}
          {!isComparing &&
            activePoint &&
            (() => {
              const tooltipWidth = 205;
              const isRightSide = activePoint.x + tooltipWidth + 24 > containerWidth;
              const tooltipX = isRightSide
                ? Math.max(10, activePoint.x - tooltipWidth - 14)
                : Math.min(containerWidth - tooltipWidth - 10, activePoint.x + 14);
              const tooltipY = Math.max(
                padding.top + 6,
                Math.min(activePoint.y - 30, chartHeight - 125)
              );

              const candleDate = new Date(activePoint.candle.date || activePoint.candle.timestamp);
              const dateStr = `${candleDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}, ${candleDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}`;

              return (
                <div
                  className="absolute pointer-events-none z-30 rounded-[var(--radius-card)] border border-white/10 px-3 py-2.5 shadow-2xl text-[var(--text-xs)] w-[205px]"
                  style={{
                    left: tooltipX,
                    top: tooltipY,
                    backgroundColor: "rgba(18, 19, 22, 0.62)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pb-1.5 mb-1.5 border-b border-white/10">
                    <span
                      className="font-[var(--weight-medium)] text-[var(--text-primary)] truncate max-w-[130px]"
                      title={dateStr}
                    >
                      {dateStr}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] px-1 py-0.5 rounded bg-white/5 shrink-0 ml-1">
                      Regular
                    </span>
                  </div>

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

        {/* BOTTOM MULTI-TICKER COMPARISON LEGEND (Matches Perplexity style in User Reference) */}
        {isComparing && comparisonData && (
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-col gap-2">
            {/* Base Asset Row */}
            {(() => {
              const basePt = activeCompHover
                ? activeCompHover.basePt
                : comparisonData.baseCoords[comparisonData.baseCoords.length - 1];
              const p = basePt ? basePt.close : activePrice;
              const r = basePt ? basePt.pctReturn : effectiveChangePercent;
              const nominal = basePt && visibleCandles[0] ? basePt.close - visibleCandles[0].close : effectiveChange;

              return (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: BASE_COLOR }} />
                    <TickerLogo symbol={symbol} name={name} size={32} />
                    <div>
                      <div className="font-[var(--weight-medium)] text-[13px] text-white leading-tight">
                        {name || symbol}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {symbol} • {exchange}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="font-[var(--weight-medium)] text-[13px] text-white tabular-nums">
                        {formatPrice(p, currency)}
                      </div>
                      <div
                        className={`text-[11px] tabular-nums ${
                          nominal >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {nominal >= 0 ? "+" : ""}
                        {formatChange(nominal, currency)}
                      </div>
                    </div>

                    <div
                      className={`px-2 py-0.5 rounded text-[11px] font-[var(--weight-medium)] tabular-nums ${
                        r >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {r >= 0 ? "↗" : "↘"} {Math.abs(r).toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Comparison Assets Rows */}
            {comparisonData.compPaths.map(({ asset, coords }) => {
              const matched = activeCompHover
                ? activeCompHover.comps.find((c) => c.asset.symbol === asset.symbol)?.matched
                : coords[coords.length - 1];

              const p = matched ? matched.close : asset.price;
              const r = matched ? matched.pctReturn : asset.changePercent;
              const firstClose = asset.candles[0]?.close || p;
              const nominal = matched ? matched.close - firstClose : asset.change;

              return (
                <div
                  key={asset.symbol}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: asset.color }} />
                    <TickerLogo symbol={asset.symbol} name={asset.name} size={32} />
                    <div>
                      <div className="font-[var(--weight-medium)] text-[13px] text-white leading-tight">
                        {asset.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {asset.symbol} • {asset.exchange || "US"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-[var(--weight-medium)] text-[13px] text-white tabular-nums">
                        {formatPrice(p, asset.currency)}
                      </div>
                      <div
                        className={`text-[11px] tabular-nums ${
                          nominal >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {nominal >= 0 ? "+" : ""}
                        {formatChange(nominal, asset.currency)}
                      </div>
                    </div>

                    <div
                      className={`px-2 py-0.5 rounded text-[11px] font-[var(--weight-medium)] tabular-nums ${
                        r >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {r >= 0 ? "↗" : "↘"} {Math.abs(r).toFixed(2)}%
                    </div>

                    <button
                      onClick={() => handleRemoveComparison(asset.symbol)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
                      title={`Remove ${asset.symbol}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Share Screenshot Image Export Modal */}
      <ShareScreenshotModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        symbol={symbol}
        name={name || symbol}
        exchange={exchange}
        currency={currency}
        price={activePrice}
        change={effectiveChange}
        changePercent={effectiveChangePercent}
        previousClose={previousClose}
        candles={visibleCandles}
        currentRange={currentRange}
      />
    </>
  );
}

// Utility for smooth SVG path rendering in comparison mode
function makePathD(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  return pts.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    const prev = arr[idx - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }, "");
}
