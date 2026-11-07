"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/layout";

interface PredictionItem {
  id: string;
  title: string;
  volume: string;
  platform: string;
  options: {
    label: string;
    percentage: number;
    change: number;
  }[];
}

const PREDICTION_DATA: PredictionItem[] = [
  {
    id: "pred-1",
    title: "Largest Company end of December 2026?",
    volume: "$9.9M vol.",
    platform: "+5 on Polymarket",
    options: [
      { label: "Apple", percentage: 63.0, change: 3.3 },
      { label: "NVIDIA", percentage: 37.0, change: -2.5 },
      { label: "Microsoft", percentage: 1.0, change: -1.1 },
    ],
  },
  {
    id: "pred-2",
    title: "Anthropic IPO Closing Market Cap",
    volume: "$3.7M vol.",
    platform: "+7 on Polymarket",
    options: [
      { label: "$1.5–$1.75T", percentage: 29.0, change: 3.5 },
      { label: "$1.25–$1.5T", percentage: 19.0, change: 2.9 },
      { label: "$1.75–$2.0T", percentage: 18.0, change: -8.0 },
    ],
  },
  {
    id: "pred-3",
    title: "What will WTI Crude Oil (WTI) hit in November 2026?",
    volume: "$1.4M vol.",
    platform: "+21 on Polymarket",
    options: [
      { label: "↑ $95", percentage: 71.0, change: 12.0 },
      { label: "↓ $85", percentage: 68.0, change: -10.0 },
      { label: "↑ $100", percentage: 44.0, change: 8.0 },
    ],
  },
];

export function PredictionWidget() {
  return (
    <div className="w-full">
      {/* Section Title */}
      <SectionTitle>Prediction Markets</SectionTitle>

      <div className="flex flex-col gap-[var(--space-3)]">
        {PREDICTION_DATA.map((card) => (
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
                    <span className="text-[var(--text-muted)] font-[var(--weight-regular)]">
                      {opt.label}
                    </span>

                    <div className="flex items-center gap-[var(--space-2)]">
                      <span className="font-[var(--weight-medium)] text-[var(--text-primary)] tabular-nums">
                        {opt.percentage.toFixed(1)}%
                      </span>

                      <div
                        className={`flex items-center gap-0.5 text-[var(--text-xs)] font-[var(--weight-medium)] tabular-nums ${isPositive ? "text-positive" : "text-negative"}`} style={{ color: isPositive ? "#3ecf8e" : "#f2555a" }}
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
              <span className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer font-[var(--weight-medium)]">
                {card.platform}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
