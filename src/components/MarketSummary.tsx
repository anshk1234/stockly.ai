"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Clock } from "lucide-react";
import { NewsItem } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";

interface MarketSummaryProps {
  news: NewsItem[];
  isLoading: boolean;
  lastUpdated: Date | null;
}

export function MarketSummary({ news, isLoading, lastUpdated }: MarketSummaryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    news.length > 0 ? news[0].id : null
  );

  // Sync initial expanded item when news arrives
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
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-sm font-semibold text-neutral-200">Market Summary</h2>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Clock className="w-3 h-3" />
          <span>{lastUpdated ? `Updated ${formatTimeAgo(lastUpdated)}` : "Fetching updates..."}</span>
        </div>
      </div>

      {/* Accordion List */}
      <div className="flex flex-col gap-2">
        {isLoading && news.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500 bg-[#11151F] rounded-xl border border-[#1C2230]">
            Fetching latest market summary & intelligence from Yahoo Finance...
          </div>
        ) : news.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500 bg-[#11151F] rounded-xl border border-[#1C2230]">
            No market updates available at the moment.
          </div>
        ) : (
          news.map((item, index) => {
            const isExpanded = expandedId === item.id || (!expandedId && index === 0);

            return (
              <div
                key={item.id}
                className="bg-[#11151F] border border-[#1C2230] rounded-xl transition-all duration-200 overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[#161B28] transition-colors"
                >
                  <div className="flex items-center gap-2 pr-3">
                    <span className="text-xs sm:text-sm font-medium text-neutral-200 hover:text-white transition-colors">
                      {item.title}
                    </span>
                  </div>

                  <div className="text-neutral-500 shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-500" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-1 border-t border-[#181D2A] text-xs text-neutral-400 leading-relaxed bg-[#0E121A]/50">
                    <p className="mb-3">
                      {item.summary ||
                        "Key benchmark indices continue to react to macroeconomic triggers, institutional flows, and quarterly corporate developments reported in the global markets dispatch."}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
                      <span className="flex items-center gap-1.5 font-medium text-neutral-400">
                        <span>{item.publisher}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(item.publishedAt)}</span>
                      </span>

                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-emerald-400 hover:underline hover:text-emerald-300"
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
      </div>
    </div>
  );
}
