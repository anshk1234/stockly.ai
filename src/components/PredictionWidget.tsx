"use client";

import React, { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/layout";
import { PredictionMarketItem, FALLBACK_PREDICTIONS } from "@/lib/polymarket";

interface PredictionWidgetProps {
  category?: string;
}

// Module-level client cache keyed by category
const widgetCache: Record<string, PredictionMarketItem[]> = {};

export function PredictionWidget({ category = "Finance" }: PredictionWidgetProps) {
  const [predictions, setPredictions] = useState<PredictionMarketItem[]>(() => {
    if (widgetCache[category]) return widgetCache[category];
    const initial = FALLBACK_PREDICTIONS.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
    return initial.length > 0 ? initial.slice(0, 3) : FALLBACK_PREDICTIONS.slice(0, 3);
  });

  useEffect(() => {
    let isMounted = true;

    async function loadLivePredictions() {
      try {
        const res = await fetch(`/api/predictions?category=${encodeURIComponent(category)}`);
        const data = await res.json();
        if (data.markets && Array.isArray(data.markets) && data.markets.length > 0) {
          if (isMounted) {
            const top3 = data.markets.slice(0, 3);
            widgetCache[category] = top3;
            setPredictions(top3);
          }
        }
      } catch (err) {
        console.warn(`Failed to load live Polymarket predictions for ${category}:`, err);
      }
    }

    loadLivePredictions();
    return () => {
      isMounted = false;
    };
  }, [category]);

  return (
    <div className="w-full">
      {/* Section Title */}
      <SectionTitle>Prediction Markets</SectionTitle>

      <div className="flex flex-col gap-[var(--space-3)]">
        {predictions.map((card) => (
          <Card key={card.id} className="p-[16px]">
            <div className="text-[13px] font-[var(--weight-medium)] text-[var(--text-primary)] mb-[var(--space-2)] leading-snug">
              {card.title}
            </div>

            {/* Options Rows */}
            <div className="flex flex-col gap-[var(--space-2)] mb-[var(--space-3)]">
              {card.options.map((opt, i) => {
                const isPositive = opt.change >= 0;
                return (
                  <div key={i} className="flex items-center justify-between text-[var(--text-xs)]">
                    <span className="text-[var(--text-muted)] font-[var(--weight-regular)] truncate max-w-[140px]">
                      {opt.label}
                    </span>

                    <div className="flex items-center gap-[var(--space-2)] shrink-0">
                      <span className="font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums">
                        {opt.percentage.toFixed(1)}%
                      </span>

                      <div
                        className={`flex items-center gap-0.5 text-[var(--text-xs)] font-[var(--weight-medium)] tabular-nums`}
                        style={{ color: isPositive ? "#3ecf8e" : "#f2555a" }}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-3 h-3 stroke-[2]" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 stroke-[2]" />
                        )}
                        <span>{Math.abs(opt.change).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer metadata */}
            <div className="flex items-center justify-between text-[var(--text-xs)] text-[var(--text-muted)] pt-[var(--space-2)] border-t border-[var(--border)]">
              <span>{card.volume}</span>
              <a
                href="https://polymarket.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer font-[var(--weight-medium)]"
              >
                {card.platform}
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
