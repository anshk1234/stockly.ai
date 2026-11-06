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
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-[#EDEDEE] tracking-tight">Market Summary</h2>
        <div className="flex items-center gap-1.5 text-[11px] text-[#717580]">
          <Clock className="w-3 h-3" />
          <span>
            {lastUpdated ? `Updated ${formatTimeAgo(lastUpdated)}` : "Fetching updates..."}
          </span>
        </div>
      </div>

      {/* Accordion List */}
      <div className="flex flex-col gap-1.5">
        {isLoading && news.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#717580] bg-[#1B1C20] rounded-xl border border-[#26282E]">
            Fetching live market intelligence from Yahoo Finance...
          </div>
        ) : news.length === 0 ? (
          <div className="p-5 text-center text-xs text-[#717580] bg-[#1B1C20] rounded-xl border border-[#26282E]">
            No market updates available at the moment.
          </div>
        ) : (
          news.map((item, index) => {
            const isExpanded = expandedId === item.id || (!expandedId && index === 0);

            return (
              <div
                key={item.id}
                className="bg-[#1B1C20] border border-[#26282E] rounded-xl transition-all duration-150 overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-[#202227] transition-colors"
                >
                  <span className="text-xs font-medium text-[#EDEDEE] hover:text-white transition-colors pr-2">
                    {item.title}
                  </span>

                  <div className="text-[#6D717B] shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#A1A4AC]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6D717B]" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-1 border-t border-[#23252A] text-xs text-[#989BA3] leading-relaxed bg-[#16171B]">
                    <p className="mb-2.5">
                      {item.summary ||
                        "Key benchmark indices continue to react to macroeconomic triggers, institutional flows, and quarterly corporate developments reported in the global markets dispatch."}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[#6D717B] pt-1">
                      <span className="flex items-center gap-1.5 font-medium text-[#8E929B]">
                        <span>{item.publisher}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(item.publishedAt)}</span>
                      </span>

                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-emerald-400 hover:underline hover:text-emerald-300 transition-colors"
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
