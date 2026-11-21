"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  Tag,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PageContainer, TwoColumnLayout, Card } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/Skeleton";
import { SearchDropdown } from "@/components/SearchDropdown";
import { PredictionMultiLineChart } from "@/components/predictions/PredictionMultiLineChart";
import { PredictionMarketDetail, PredictionMarketItem } from "@/lib/polymarket";

export default function PredictionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = decodeURIComponent(resolvedParams.id);

  const [detail, setDetail] = useState<PredictionMarketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isNarrativeExpanded, setIsNarrativeExpanded] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/predictions/${encodeURIComponent(id)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (isCurrent && data.prediction) {
          setDetail(data.prediction);
        }
      })
      .catch((err) => {
        if (isCurrent) setError(err.message || "Failed to load prediction details");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [id]);

  const router = useRouter();

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectSymbol = (selectedSymbol: string) => {
    router.push(`/stocks/${encodeURIComponent(selectedSymbol)}`);
  };

  const isAnthropic = detail?.title?.toLowerCase().includes("anthropic");

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col font-sans">
      {/* Top Header matching Perplexity Finance */}
      <header className="w-full border-b border-[var(--border)] bg-[var(--bg-page)]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex items-center justify-start shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-[7px] overflow-hidden flex items-center justify-center shrink-0 border border-white/10 shadow-sm">
                <img src="/icon.svg" alt="Stockly" className="w-full h-full object-cover" />
              </div>
              <span className="font-[var(--weight-medium)] text-[14px] text-[var(--text-primary)] tracking-tight whitespace-nowrap">
                Stockly <span className="text-[var(--text-muted)] font-[var(--weight-regular)]">Finance</span>
              </span>
            </Link>
          </div>

          <div className="w-full max-w-[460px] mx-auto hidden sm:block">
            <SearchDropdown onSelectSymbol={handleSelectSymbol} />
          </div>

          <div className="flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Share"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 py-5">
        <PageContainer>
          {/* Breadcrumb matching Perplexity: "Stockly Finance > Title" */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-5">
            <Link
              href="/"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Stockly Finance
            </Link>
            <span>&gt;</span>
            <span className="text-[var(--text-primary)] truncate max-w-xl font-[var(--weight-medium)]">
              {detail ? detail.title : "Predictions"}
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-6 w-96 rounded" />
                  <Skeleton className="h-4 w-48 rounded" />
                </div>
              </div>
              <Skeleton className="h-[380px] w-full rounded-xl" />
            </div>
          ) : error || !detail ? (
            <div className="p-8 text-center bg-[var(--bg-card)] border border-[var(--border)] rounded-xl my-8">
              <p className="text-sm text-red-400 mb-4">{error || "Prediction market not found"}</p>
              <Link
                href="/?tab=predictions"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--bg-card-hover)] text-xs font-[var(--weight-medium)] border border-[var(--border)]"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Predictions
              </Link>
            </div>
          ) : (
            <TwoColumnLayout
              main={
                <div className="flex flex-col gap-5">
                  {/* Entity Header Banner (Anthropic / Brand Icon + Calm Title + Meta) */}
                  <div className="flex items-start gap-3.5">
                    {isAnthropic ? (
                      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black">
                          <path d="M13.82 3h3.58L24 21h-3.66l-1.87-4.42H12.9L11.02 21H7.36L13.82 3zm1.96 4.96L14.1 13.5h3.36l-1.68-5.54zM6.55 3H3L0 21h3.55l6.55-18z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-[#22242a] border border-[var(--border)] flex items-center justify-center shrink-0 font-bold text-xs text-[var(--text-primary)] mt-0.5">
                        {detail.category === "Crypto" ? "₿" : "$"}
                      </div>
                    )}

                    <div className="flex flex-col">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                        {detail.title}
                      </h1>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)] mt-1.5 font-[var(--weight-regular)]">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 opacity-60" />
                          <span>{detail.volume}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 opacity-60" />
                          <span>Ends {detail.date}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Line Chart & Integrated Outcomes List */}
                  <PredictionMultiLineChart
                    options={detail.options}
                    polymarketUrl={detail.url}
                  />
                </div>
              }
              sidebar={
                <div className="flex flex-col gap-4">
                  {/* Market Details Metadata Card (matching Perplexity side-by-side Image 2) */}
                  <Card className="p-4 sm:p-5 flex flex-col gap-3">
                    <div className="flex flex-col gap-2.5 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                        <span className="text-[var(--text-muted)]">Volume</span>
                        <span className="font-[var(--weight-medium)] text-[var(--text-primary)]">
                          {detail.volume.replace(" vol.", "")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                        <span className="text-[var(--text-muted)]">Currency</span>
                        <span className="font-[var(--weight-medium)] text-[var(--text-primary)]">USD</span>
                      </div>
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                        <span className="text-[var(--text-muted)]">Start Date</span>
                        <span className="text-[var(--text-primary)] font-mono text-[11px] text-right truncate max-w-[170px]">
                          {detail.startDate}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                        <span className="text-[var(--text-muted)]">End Date</span>
                        <span className="text-[var(--text-primary)] font-mono text-[11px] text-right truncate max-w-[170px]">
                          {detail.date}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                        <span className="text-[var(--text-muted)]">Markets</span>
                        <span className="text-[var(--text-primary)] font-mono">{detail.marketCount}</span>
                      </div>
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                        <span className="text-[var(--text-muted)]">Provider</span>
                        <span className="text-[var(--text-primary)] font-[var(--weight-medium)]">Polymarket</span>
                      </div>
                    </div>

                    {/* Narrative commentary with View More toggle */}
                    <div className="pt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                      <p className={isNarrativeExpanded ? "" : "line-clamp-4"}>
                        {detail.narrative}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setIsNarrativeExpanded(!isNarrativeExpanded)}
                          className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          <span>{isNarrativeExpanded ? "View Less" : "View More"}</span>
                          {isNarrativeExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {detail.sources}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* "More Prediction Markets" Card (matching Perplexity Image 2) */}
                  <Card className="p-4 sm:p-5 flex flex-col gap-3">
                    <h3 className="text-sm font-[var(--weight-medium)] text-[var(--text-primary)]">
                      More Prediction Markets
                    </h3>

                    <div className="flex flex-col divide-y divide-[var(--border)]">
                      {detail.relatedMarkets && detail.relatedMarkets.length > 0 ? (
                        detail.relatedMarkets.map((m: PredictionMarketItem) => (
                          <div key={m.id} className="py-3 first:pt-1 last:pb-1 flex flex-col gap-2">
                            <Link
                              href={`/predictions/${m.id}`}
                              className="text-xs font-[var(--weight-medium)] text-[var(--text-primary)] hover:text-blue-400 transition-colors line-clamp-1"
                            >
                              {m.title}
                            </Link>

                            {/* Mini outcomes preview */}
                            <div className="flex flex-col gap-1 text-xs">
                              {m.options.slice(0, 2).map((opt, i) => {
                                const isPositive = opt.change >= 0;
                                return (
                                  <div key={i} className="flex items-center justify-between text-[11px]">
                                    <span className="text-[var(--text-muted)] truncate max-w-[160px]">
                                      {opt.label}
                                    </span>
                                    <div className="flex items-center gap-2 font-mono">
                                      <span className="text-[var(--text-primary)] font-semibold">
                                        {opt.percentage.toFixed(1)}%
                                      </span>
                                      <span
                                        className="font-semibold text-[10px]"
                                        style={{ color: isPositive ? "#3ecf8e" : "#f2555a" }}
                                      >
                                        {isPositive ? "↗" : "↘"} {Math.abs(opt.change).toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1">
                              <span>{m.volume}</span>
                              <a
                                href={m.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                              >
                                {m.platform}
                              </a>
                            </div>
                          </div>
                        ))
                      ) : null}
                    </div>
                  </Card>
                </div>
              }
            />
          )}
        </PageContainer>
      </main>
    </div>
  );
}
