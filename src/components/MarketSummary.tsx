"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Clock } from "lucide-react";
import { NewsItem } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";
import { Card, SectionTitle } from "@/components/ui/layout";

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
          <div className="px-[16px] py-[14px] text-center text-[var(--text-xs)] text-[var(--text-muted)]">
            Fetching live market intelligence from Yahoo Finance...
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
