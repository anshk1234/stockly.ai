"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Compass,
  Bookmark,
  Clock,
  ArrowUp,
  TrendingUp,
} from "lucide-react";

export function SidebarRail() {
  return (
    <aside className="hidden md:flex flex-col items-center justify-between w-14 shrink-0 border-r border-[#23252A] bg-[#141517] py-3.5 z-30 select-none">
      {/* Top Icons */}
      <div className="flex flex-col items-center gap-4">
        {/* Logo / Brand Asterisk */}
        <Link
          href="/"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-400 hover:bg-[#1E1F24] transition-colors"
          title="Stockly.ai"
        >
          <Sparkles className="w-5 h-5" />
        </Link>

        {/* Plus / New */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#1E1F24] transition-colors"
          title="New thread / search"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Home / Discover */}
        <Link
          href="/"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-[#1E1F24] transition-colors"
          title="Markets Dashboard"
        >
          <Compass className="w-4 h-4" />
        </Link>

        {/* Library / Watchlist */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#1E1F24] transition-colors"
          title="Library"
        >
          <Bookmark className="w-4 h-4" />
        </button>

        {/* History */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#1E1F24] transition-colors"
          title="History"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col items-center gap-3">
        <button
          className="w-7 h-7 rounded-full bg-[#1E1F24] hover:bg-[#25272E] text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          title="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>

        {/* User Avatar Circle */}
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center cursor-pointer">
          A
        </div>
      </div>
    </aside>
  );
}
