"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Clock } from "lucide-react";
import { NewsItem } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";
import { Card, SectionTitle } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/Skeleton";

interface MarketSummaryProps {
  news: NewsItem[];
  isLoading: boolean;
  lastUpdated: Date | null;
}

export function MarketSummary({
  news,
  isLoading,
  lastUpdated,
}: MarketSummaryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    news.length > 0 ? news[0].id : null
  );

  React.useEffect(() => {
    if (news.length > 0 && !expandedId) {
      setExpandedId(news[0].id);
    }
  }, [news, expandedId]);

  const toggleItem = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full">
      {/* Section Title */}
      <SectionTitle
        action={
          <div className="flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--text-muted)] font-[var(--weight-regular)]">
            <Clock className="w-3 h-3" />
            <span>
              {lastUpdated ? `Updated ${formatTimeAgo(lastUpdated)}` : "Fetching updates..."}
            </span>
          </div>
        }
      >
        Market Summary
      </SectionTitle>

      {/* Grouped in ONE bordered card with hairline dividers */}
      <Card>
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
            {[...Array(4)].map((_, i) => (
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
          <div className="px-[16px] py-[14px] text-center text-[var(--text-xs)] text-[var(--text-muted)]">
            No market updates available at the moment.
          </div>
        ) : (
          news.map((item, index) => {
            const isExpanded = expandedId === item.id || (!expandedId && index === 0);

            return (
              <div
                key={item.id}
                className="border-b border-[var(--border)] last:border-b-0 transition-colors"
              >
                {/* Header row */}
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between px-[16px] py-[14px] text-left hover:bg-[var(--bg-card-hover)] transition-colors"
                >
                  <span className="text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--text-primary)] pr-[var(--space-2)]">
                    {item.title}
                  </span>

                  <div className="text-[var(--text-muted)] shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[var(--text-primary)]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-[16px] pb-[14px] pt-1 text-[var(--text-xs)] text-[var(--text-muted)] leading-relaxed bg-[var(--bg-page)]/40 border-t border-[var(--border)]">
                    <p className="mb-2">
                      {item.summary ||
                        "Key benchmark indices continue to react to macroeconomic triggers, institutional flows, and quarterly corporate developments reported in the global markets dispatch."}
                    </p>

                    <div className="flex items-center justify-between text-[var(--text-xs)] pt-1">
                      <span className="flex items-center gap-1.5 text-[var(--text-muted)] font-[var(--weight-regular)]">
                        <span>{item.publisher}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(item.publishedAt)}</span>
                      </span>

                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[var(--positive)] hover:underline transition-colors"
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
          })
        )}
      </Card>
    </div>
  );
}
