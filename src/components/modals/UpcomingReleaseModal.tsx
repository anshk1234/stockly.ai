"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink } from "lucide-react";

interface UpcomingReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UPCOMING_UPDATES = [
  {
    num: "1",
    title: "Better Generated Market Summary",
    desc: "Refined real-time market synthesis with deeper macro context, live wire speed, and multi-source aggregation.",
    tag: "AI & Synthesis",
  },
  {
    num: "2",
    title: "ML Models for Trend Analysis & Overall Sentiment Analysis",
    desc: "Quantitative machine learning models calculating momentum indicators, market regime detection, and comprehensive sentiment metrics.",
    tag: "Machine Learning",
  },
  {
    num: "3",
    title: "AI Researcher & Agent in Chat Mode",
    desc: "Interactive conversational terminal agent to ask any question regarding global stocks, crypto, and prediction markets on live data.",
    tag: "Agentic AI",
  },
  {
    num: "4",
    title: "Paper Trading Mode",
    desc: "Zero-risk virtual trading simulator with cash balances, live portfolio tracking, and real-time execution in live markets.",
    tag: "Trading Engine",
  },
  {
    num: "5",
    title: "Better RAG Engine for AI Agent & Features",
    desc: "Ultra-fast retrieval-augmented generation pipeline indexing live market feeds, earnings reports, and financial news.",
    tag: "Infrastructure",
  },
  {
    num: "6",
    title: "Special Dedicated Page for Sponsors & Supporting Organisations",
    desc: "Official recognition hub celebrating our supporting organizations, open-source sponsors, maintainers, and community contributors.",
    tag: "Community",
  },
  {
    num: "7",
    title: "Download Option for Android & Windows",
    desc: "Installable desktop and mobile applications with offline caching, local alerts, and native window controls.",
    tag: "Multi-Platform",
  },
  {
    num: "8",
    title: "Better Security Features",
    desc: "Hardened edge API verification, automated dependency audits, and enhanced protection aligned with OpenSSF Best Practices standards.",
    tag: "Security",
  },
];

export function UpcomingReleaseModal({ isOpen, onClose }: UpcomingReleaseModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-[#16171a] border border-white/10 shadow-2xl overflow-hidden text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Next Release</span>
              </div>
              <h2 className="text-[19px] font-bold text-white tracking-tight">
                v0.1.1 Coming Soon
              </h2>
              <p className="text-[12.5px] text-neutral-400">
                Upcoming roadmap milestones currently in engineering for the next release.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Updates List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5 divide-y divide-white/5">
          {UPCOMING_UPDATES.map((item, index) => (
            <div
              key={item.num}
              className={`flex items-start gap-3.5 ${index > 0 ? "pt-3.5" : ""}`}
            >
              <div className="w-6 h-6 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-[11px] font-mono font-bold text-emerald-400 shrink-0 mt-0.5">
                {item.num}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[13.5px] font-semibold text-white">
                    {item.title}
                  </h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/5">
                    {item.tag}
                  </span>
                </div>
                <p className="text-[12px] text-neutral-400 mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-white/[0.02] border-t border-white/10 flex items-center justify-between gap-3 shrink-0 text-[12px]">
          <a
            href="https://github.com/anshk1234/stockly.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors"
          >
            <span>Follow development on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-[12px] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
