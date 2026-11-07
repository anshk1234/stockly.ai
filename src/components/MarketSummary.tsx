"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Clock } from "lucide-react";
import { NewsItem } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";
import { Card, SectionTitle } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/Skeleton";

export interface SourceItem {
  name: string;
  domain?: string;
  favicon?: string;
}

interface MarketSummaryProps {
  news: NewsItem[];
  isLoading: boolean;
  lastUpdated: Date | null;
  sourcesCount?: number;
  sources?: SourceItem[];
}

export function MarketSummary({
  news,
  isLoading,
  lastUpdated,
  sourcesCount = 0,
  sources = [],
}: MarketSummaryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  React.useEffect(() => {
    if (news.length > 0 && !expandedId) {
      setExpandedId(news[0].id);
    }
  }, [news, expandedId]);

  const toggleItem = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const effectiveSourcesCount = sourcesCount || (sources.length > 0 ? sources.length : news.length);

  return (
    <div className="w-full">
      {/* Section Title */}
      <SectionTitle
        action={
          <div className="flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--text-muted)] font-[var(--weight-regular)]">
            <Clock className="w-3 h-3" />
            <span>
              {lastUpdated ? `Updated ${formatTimeAgo(lastUpdated)}` : "Updating hourly..."}
            </span>
          </div>
        }
      >
        Market Summary
      </SectionTitle>

      {/* Grouped in ONE bordered card with hairline dividers (Perplexity style) */}
      <Card className="overflow-hidden">
        {isLoading && news.length === 0 ? (
          <div className="flex flex-col divide-y divide-[var(--border)]">
            {/* Expanded Item Skeleton */}
            <div className="px-[16px] py-[14px]">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3.5 w-3.5 rounded" />
              </div>
              <div className="space-y-2 pt-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
              <div className="flex items-center justify-between pt-3">
                <Skeleton className="h-2.5 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>

            {/* Collapsed Rows Skeleton */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-[16px] py-[14px]">
                <Skeleton
                  className={`h-3.5 ${
                    i === 0 ? "w-2/3" : i === 1 ? "w-4/5" : i === 2 ? "w-1/2" : "w-3/5"
                  }`}
                />
                <Skeleton className="h-3.5 w-3.5 rounded" />
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="px-[16px] py-[24px] text-center text-[var(--text-xs)] text-[var(--text-muted)]">
            No market updates available at the moment.
          </div>
        ) : (
          <div>
            <div className="divide-y divide-[var(--border)]">
              {news.map((item, index) => {
                const isExpanded = expandedId === item.id || (!expandedId && index === 0);

                return (
                  <div key={item.id} className="transition-colors group">
                    {/* Header row */}
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full flex items-center justify-between px-[16px] py-[13px] text-left hover:bg-[var(--bg-card-hover)] transition-colors"
                    >
                      <span className="text-[13.5px] font-[var(--weight-medium)] text-[var(--text-primary)] pr-3 leading-snug group-hover:text-white transition-colors">
                        {item.title}
                      </span>

                      <div className="text-[var(--text-muted)] shrink-0 ml-2">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[var(--text-primary)]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                        )}
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-[16px] pb-[14px] pt-1 text-[13px] text-[var(--text-muted)] leading-relaxed bg-[var(--bg-page)]/30 border-t border-[var(--border)]/60">
                        <p className="mb-3 text-[var(--text-secondary)]">
                          {item.summary ||
                            "Key benchmark indices continue to react to macroeconomic triggers, institutional flows, and quarterly corporate developments reported in the global markets dispatch."}
                        </p>

                        <div className="flex items-center justify-between text-[11.5px] pt-1">
                          <span className="flex items-center gap-1.5 text-[var(--text-muted)] font-[var(--weight-regular)]">
                            <span className="text-[var(--text-primary)] font-[var(--weight-medium)]">
                              {item.publisher}
                            </span>
                            <span>•</span>
                            <span>{formatTimeAgo(item.publishedAt)}</span>
                          </span>

                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[var(--positive)] hover:underline font-[var(--weight-medium)] transition-colors"
                            >
                              <span>Read full report</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Perplexity-style Footer: Verified Sources bar */}
            {effectiveSourcesCount > 0 && (
              <div className="px-[16px] py-[10px] bg-[var(--bg-page)]/40 border-t border-[var(--border)] flex items-center justify-between text-[12px] text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  {/* Small overlapping source icons */}
                  <div className="flex items-center -space-x-1.5 overflow-hidden">
                    {sources.slice(0, 5).map((s, idx) => (
                      <span
                        key={idx}
                        title={s.name}
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden text-[9px] font-bold text-neutral-300 shrink-0"
                      >
                        {s.favicon ? (
                          <img
                            src={s.favicon}
                            alt={s.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          s.name.charAt(0)
                        )}
                      </span>
                    ))}
                  </div>

                  <span className="font-[var(--weight-medium)] text-[var(--text-secondary)]">
                    {effectiveSourcesCount} sources
                  </span>
                </div>

                <span className="text-[11px] text-[var(--text-muted)]">
                  Live Wire • Updated Hourly
                </span>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
