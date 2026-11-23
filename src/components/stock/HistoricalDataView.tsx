"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Calendar,
  MoreHorizontal,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { DetailedStockQuote, CandlePoint, TimeRange } from "@/lib/types";
import { TwoColumnLayout } from "@/components/ui/layout";
import { CompanyProfileWidget } from "@/components/stock/CompanyProfileWidget";

interface HistoricalDataViewProps {
  stock: DetailedStockQuote;
  onSwitchTab?: (tab: string) => void;
}

const TIMEFRAMES: TimeRange[] = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"];
const INTRADAY_INTERVALS = ["1 min", "5 min", "15 min", "30 min"] as const;
type IntradayInterval = (typeof INTRADAY_INTERVALS)[number];

export function HistoricalDataView({ stock, onSwitchTab }: HistoricalDataViewProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("1D");
  const [candles, setCandles] = useState<CandlePoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 15;

  // 3-dots Menu Popover state
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [priceInterval, setPriceInterval] = useState<IntradayInterval>("1 min");
  const [extendedHours, setExtendedHours] = useState(false);

  // Download Menu Popover state
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  // In-memory cache for loaded chart ranges
  const cacheRef = useRef<Record<string, CandlePoint[]>>({});
  const optionsRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setIsOptionsOpen(false);
      }
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) {
        setIsDownloadOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch candles when range changes
  useEffect(() => {
    let isCurrent = true;
    setCurrentPage(1);

    if (cacheRef.current[selectedRange]) {
      setCandles(cacheRef.current[selectedRange]);
      setLoading(false);
      return;
    }

    setLoading(true);
    async function fetchCandles() {
      try {
        const res = await fetch(`/api/stock/${encodeURIComponent(stock.symbol)}/chart?range=${selectedRange}`);
        if (!res.ok) throw new Error("Failed to fetch historical chart data");
        const json = await res.json();
        if (isCurrent && Array.isArray(json.candles)) {
          cacheRef.current[selectedRange] = json.candles;
          setCandles(json.candles);
        }
      } catch (err) {
        console.error("Error fetching historical table candles:", err);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    fetchCandles();
    return () => {
      isCurrent = false;
    };
  }, [stock.symbol, selectedRange]);

  const isIntraday = selectedRange === "1D" || selectedRange === "5D";

  // Filter & Resample candles based on options
  const processedCandles = useMemo(() => {
    if (!candles || candles.length === 0) return [];

    let filtered = [...candles];

    // Filter Extended Hours for intraday
    if (isIntraday && !extendedHours) {
      filtered = filtered.filter((c) => {
        const d = new Date(c.timestamp);
        const hours = d.getUTCHours();
        const mins = d.getUTCMinutes();
        const totalMins = hours * 60 + mins;
        // Approx regular hours: US: 14:30 to 21:00 UTC; IN: 03:45 to 10:00 UTC
        const isIndia = stock.currency === "INR" || stock.symbol.endsWith(".NS");
        if (isIndia) {
          return totalMins >= 225 && totalMins <= 600;
        }
        return totalMins >= 870 && totalMins <= 1260;
      });
      // Fallback if filter leaves empty (e.g. weekend or timezone shift)
      if (filtered.length === 0) filtered = [...candles];
    }

    // Resample intraday intervals (5m, 15m, 30m)
    if (isIntraday && priceInterval !== "1 min") {
      const bucketSizeMins = priceInterval === "5 min" ? 5 : priceInterval === "15 min" ? 15 : 30;
      const bucketMs = bucketSizeMins * 60 * 1000;
      const buckets: Record<number, CandlePoint[]> = {};

      for (const c of filtered) {
        const bucketKey = Math.floor(c.timestamp / bucketMs) * bucketMs;
        if (!buckets[bucketKey]) buckets[bucketKey] = [];
        buckets[bucketKey].push(c);
      }

      const resampled: CandlePoint[] = [];
      const keys = Object.keys(buckets).map(Number).sort((a, b) => a - b);
      for (const key of keys) {
        const group = buckets[key];
        if (group.length === 0) continue;
        const open = group[0].open;
        const close = group[group.length - 1].close;
        const high = Math.max(...group.map((g) => g.high));
        const low = Math.min(...group.map((g) => g.low));
        const volume = group.reduce((sum, g) => sum + (g.volume || 0), 0);
        resampled.push({
          date: group[group.length - 1].date,
          timestamp: group[group.length - 1].timestamp,
          open,
          high,
          low,
          close,
          volume,
        });
      }
      filtered = resampled;
    }

    // Reverse chronological order (latest candle on top)
    return filtered.slice().reverse();
  }, [candles, isIntraday, extendedHours, priceInterval, stock.currency, stock.symbol]);

  // Pagination slices
  const totalPages = Math.max(1, Math.ceil(processedCandles.length / ROWS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * ROWS_PER_PAGE;
  const currentRows = processedCandles.slice(startIndex, startIndex + ROWS_PER_PAGE);

  // Formatting helpers
  const currencySymbol = stock.currency === "INR" ? "₹" : "$";

  const formatTimestamp = (timestamp: number, isFirstRow: boolean) => {
    const d = new Date(timestamp);
    if (!isIntraday) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return isFirstRow ? `${dateStr}, ${timeStr} EST` : `${dateStr}, ${timeStr}`;
  };

  const formatPrice = (val: number, isFirstRow: boolean) => {
    if (val == null || isNaN(val)) return "—";
    const num = val >= 1000
      ? val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : val.toFixed(2);
    return isFirstRow ? `${currencySymbol}${num}` : num;
  };

  const formatVolume = (val: number) => {
    if (!val || val === 0) return "—";
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
    return val.toLocaleString("en-US");
  };

  // Export handlers
  const handleExportCSV = () => {
    setIsDownloadOpen(false);
    if (processedCandles.length === 0) return;

    const headers = ["Date", "Open", "High", "Low", "Close", "Volume"];
    const csvRows = [headers.join(",")];

    for (const c of processedCandles) {
      const d = new Date(c.timestamp).toISOString();
      csvRows.push([`"${d}"`, c.open, c.high, c.low, c.close, c.volume].join(","));
    }

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${stock.symbol}_historical_${selectedRange}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    setIsDownloadOpen(false);
    if (processedCandles.length === 0) return;

    const tableRows = processedCandles
      .map(
        (c) =>
          `<tr><td>${new Date(c.timestamp).toLocaleString("en-US")}</td><td>${c.open}</td><td>${c.high}</td><td>${c.low}</td><td>${c.close}</td><td>${c.volume}</td></tr>`
      )
      .join("");

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${stock.symbol} Historical</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      </head>
      <body>
        <table border="1">
          <thead>
            <tr style="background:#1e222d;color:#ffffff;font-weight:bold;">
              <th>Date</th><th>Open</th><th>High</th><th>Low</th><th>Close</th><th>Volume</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${stock.symbol}_historical_${selectedRange}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <TwoColumnLayout
      main={
        <div className="flex flex-col gap-4 w-full">
          {/* Main Card with Toolbar & Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-b border-[var(--border)] bg-zinc-900/30">
              {/* Left: Timeframe Range Buttons + Calendar Icon */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {TIMEFRAMES.map((range) => {
                  const isActive = selectedRange === range;
                  return (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setSelectedRange(range)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[var(--bg-card-hover)] text-white border border-[var(--border)]"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                      }`}
                    >
                      {range}
                    </button>
                  );
                })}

                <button
                  type="button"
                  title="Calendar Date Filter"
                  className="p-1.5 ml-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800/50 transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Right: 3-dots Menu + Download Menu */}
              <div className="flex items-center gap-1.5 relative">
                {/* 3-dots Button */}
                <div className="relative" ref={optionsRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOptionsOpen(!isOptionsOpen);
                      setIsDownloadOpen(false);
                    }}
                    title="Table Settings & Intervals"
                    className={`p-1.5 rounded-lg border border-[var(--border)] transition-colors cursor-pointer ${
                      isOptionsOpen ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                    }`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {/* 3-dots Settings Popover */}
                  {isOptionsOpen && (
                    <div className="absolute right-0 mt-2 w-64 p-3.5 bg-[#16181f] border border-zinc-700/80 rounded-xl shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                      {/* Price Interval */}
                      <div className="mb-3">
                        <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                          Price Interval
                        </label>
                        <div className="grid grid-cols-4 gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800">
                          {INTRADAY_INTERVALS.map((intv) => (
                            <button
                              key={intv}
                              type="button"
                              onClick={() => setPriceInterval(intv)}
                              className={`py-1 text-[11px] font-medium rounded transition-colors text-center cursor-pointer ${
                                priceInterval === intv
                                  ? "bg-zinc-800 text-white shadow-sm"
                                  : "text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              {intv.replace(" min", "m")}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Extended Hours */}
                      <div>
                        <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                          Extended Hours
                        </label>
                        <div className="grid grid-cols-2 gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800">
                          <button
                            type="button"
                            onClick={() => setExtendedHours(false)}
                            className={`py-1 text-[11px] font-medium rounded transition-colors text-center cursor-pointer ${
                              !extendedHours
                                ? "bg-zinc-800 text-white shadow-sm"
                                : "text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            Off
                          </button>
                          <button
                            type="button"
                            onClick={() => setExtendedHours(true)}
                            className={`py-1 text-[11px] font-medium rounded transition-colors text-center cursor-pointer ${
                              extendedHours
                                ? "bg-zinc-800 text-white shadow-sm"
                                : "text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            On
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Download Export Button */}
                <div className="relative" ref={downloadRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDownloadOpen(!isDownloadOpen);
                      setIsOptionsOpen(false);
                    }}
                    title="Export Historical Data"
                    className={`p-1.5 rounded-lg border border-[var(--border)] transition-colors cursor-pointer ${
                      isDownloadOpen ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                    }`}
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Download Menu Dropdown */}
                  {isDownloadOpen && (
                    <div className="absolute right-0 mt-2 w-36 py-1.5 bg-[#16181f] border border-zinc-700/80 rounded-xl shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-left text-zinc-200 hover:text-white hover:bg-zinc-800/70 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-medium">CSV</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportExcel}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-left text-zinc-200 hover:text-white hover:bg-zinc-800/70 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-medium">Excel</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[380px] gap-2.5 text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                <span className="text-xs">Loading historical price records...</span>
              </div>
            ) : processedCandles.length === 0 ? (
              <div className="p-12 text-center text-xs text-zinc-400">
                No historical records available for the selected range.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[11px] font-semibold text-zinc-400 tracking-wider">
                        <th className="py-2.5 px-4 font-sans font-medium">Date</th>
                        <th className="py-2.5 px-4 text-right font-sans font-medium">Open</th>
                        <th className="py-2.5 px-4 text-right font-sans font-medium">High</th>
                        <th className="py-2.5 px-4 text-right font-sans font-medium">Low</th>
                        <th className="py-2.5 px-4 text-right font-sans font-medium">Close</th>
                        <th className="py-2.5 px-4 text-right font-sans font-medium">Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] text-[12.5px]">
                      {currentRows.map((candle, idx) => {
                        const isFirstOnPage = idx === 0 && currentPageSafe === 1;

                        return (
                          <tr
                            key={`${candle.timestamp}-${idx}`}
                            className="hover:bg-[var(--bg-card-hover)] transition-colors"
                          >
                            {/* Date */}
                            <td className="py-2.5 px-4 text-zinc-300 font-sans whitespace-nowrap text-xs">
                              {formatTimestamp(candle.timestamp, isFirstOnPage)}
                            </td>

                            {/* Open */}
                            <td className="py-2.5 px-4 text-right text-zinc-200 whitespace-nowrap">
                              {formatPrice(candle.open, isFirstOnPage)}
                            </td>

                            {/* High */}
                            <td className="py-2.5 px-4 text-right text-zinc-200 whitespace-nowrap">
                              {formatPrice(candle.high, isFirstOnPage)}
                            </td>

                            {/* Low */}
                            <td className="py-2.5 px-4 text-right text-zinc-200 whitespace-nowrap">
                              {formatPrice(candle.low, isFirstOnPage)}
                            </td>

                            {/* Close */}
                            <td className="py-2.5 px-4 text-right text-zinc-100 font-semibold whitespace-nowrap">
                              {formatPrice(candle.close, isFirstOnPage)}
                            </td>

                            {/* Volume */}
                            <td className="py-2.5 px-4 text-right text-zinc-400 whitespace-nowrap text-xs">
                              {formatVolume(candle.volume)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-zinc-900/20 text-xs">
                  {/* Previous Button */}
                  <button
                    type="button"
                    disabled={currentPageSafe === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] font-medium transition-colors cursor-pointer ${
                      currentPageSafe === 1
                        ? "opacity-30 cursor-not-allowed text-zinc-500 border-zinc-800"
                        : "text-zinc-300 hover:text-white hover:bg-zinc-800/60"
                    }`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  {/* Centered Page Counter */}
                  <span className="text-zinc-400 font-sans text-xs">
                    Page {currentPageSafe} of {totalPages}
                  </span>

                  {/* Next Button */}
                  <button
                    type="button"
                    disabled={currentPageSafe === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] font-medium transition-colors cursor-pointer ${
                      currentPageSafe === totalPages
                        ? "opacity-30 cursor-not-allowed text-zinc-500 border-zinc-800"
                        : "text-zinc-300 hover:text-white hover:bg-zinc-800/60"
                    }`}
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      }
      sidebar={<CompanyProfileWidget stock={stock} onSwitchTab={onSwitchTab} />}
    />
  );
}
