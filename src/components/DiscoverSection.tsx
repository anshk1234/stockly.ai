"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Heart, MoreHorizontal, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { DiscoverStory } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DiscoverSectionProps {
  region?: "IN" | "US";
  category?: "IN" | "US" | "CRYPTO";
}

// Client-side cache: 15-minute freshness per category
const discoverClientCache: Record<string, { stories: DiscoverStory[]; timestamp: number }> = {};
const CACHE_TTL_MS = 15 * 60 * 1000;

export function DiscoverSection({ region = "IN", category }: DiscoverSectionProps) {
  const activeKey = (category || region).toUpperCase();
  const [stories, setStories] = useState<DiscoverStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [likedStories, setLikedStories] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Touch swipe handling
  const touchStartXRef = useRef<number | null>(null);

  // Fetch stories
  const fetchDiscoverStories = useCallback(async (selectedKey: string) => {
    const cached = discoverClientCache[selectedKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.stories.length > 0) {
      setStories(cached.stories);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/discover?category=${selectedKey}`);
      const data = await res.json();
      if (data.stories && Array.isArray(data.stories)) {
        discoverClientCache[selectedKey] = {
          stories: data.stories,
          timestamp: Date.now(),
        };
        setStories(data.stories);
      }
    } catch (err) {
      console.error("Failed to load discover stories:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(0);
    fetchDiscoverStories(activeKey);
  }, [activeKey, fetchDiscoverStories]);

  // Group stories into pages of 3
  const pageSize = 3;
  const pages: DiscoverStory[][] = [];
  for (let i = 0; i < stories.length; i += pageSize) {
    pages.push(stories.slice(i, i + pageSize));
  }
  const totalPages = Math.max(pages.length, 1);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const toggleLike = (storyId: string) => {
    setLikedStories((prev) => ({
      ...prev,
      [storyId]: !prev[storyId],
    }));
  };

  const handleShare = (story: DiscoverStory) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(story.link || window.location.href);
      setCopiedId(story.id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  // Touch event handlers for mobile/tablet swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartXRef.current - touchEndX;

    if (deltaX > 45 && currentPage < totalPages - 1) {
      handleNext();
    } else if (deltaX < -45 && currentPage > 0) {
      handlePrev();
    }
    touchStartXRef.current = null;
  };

  return (
    <section className="w-full">
      {/* Header Title */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-sm font-medium text-[var(--text-secondary)] tracking-tight">
          Discover
        </h2>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-[#1b1c20] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col justify-between animate-pulse"
            >
              <div className="aspect-[16/10] bg-[#24262d] w-full" />
              <div className="p-3.5 space-y-2">
                <div className="h-4 bg-[#26282f] rounded w-full" />
                <div className="h-4 bg-[#26282f] rounded w-3/4" />
              </div>
              <div className="px-3.5 pb-3.5 flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    <div className="w-4 h-4 rounded-full bg-[#2a2c35]" />
                    <div className="w-4 h-4 rounded-full bg-[#2a2c35]" />
                  </div>
                  <div className="h-3 w-16 bg-[#2a2c35] rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="w-4 h-4 rounded bg-[#2a2c35]" />
                  <div className="w-4 h-4 rounded bg-[#2a2c35]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? null : (
        <>
          {/* Carousel Viewport */}
          <div
            className="overflow-hidden w-full select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {pages.map((pageStories, pageIdx) => (
                <div
                  key={pageIdx}
                  className="w-full flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
                >
                  {pageStories.map((story) => {
                    const isLiked = !!likedStories[story.id];
                    return (
                      <article
                        key={story.id}
                        onClick={() => window.open(story.link, "_blank", "noopener,noreferrer")}
                        className="bg-[#1b1c20] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[#383a42] transition-colors group flex flex-col justify-between cursor-pointer"
                      >
                        {/* 16:10 Hero Image with subtle zoom on hover */}
                        <div className="aspect-[16/10] w-full overflow-hidden relative bg-[#131418]">
                          <img
                            src={story.imageUrl}
                            alt={story.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                            onError={(e) => {
                              // Fallback to high quality financial exchange photo if broken
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80";
                            }}
                          />
                        </div>

                        {/* Editorial Headline */}
                        <div className="p-3.5 pb-2 flex-1 flex flex-col justify-between">
                          <h3
                            className="text-[13.5px] font-semibold text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors line-clamp-2 leading-[1.38] tracking-tight"
                            title={story.title}
                          >
                            {story.title}
                          </h3>
                        </div>

                        {/* Footer with stacked source favicons, source badge, interactive heart and share */}
                        <div className="px-3.5 pb-3 pt-1 flex items-center justify-between">
                          {/* Sources stacked favicons & count badge */}
                          <div className="flex items-center">
                            <div className="flex items-center -space-x-1.5">
                              {story.sourceDomains.slice(0, 3).map((domain, i) => (
                                <span
                                  key={i}
                                  className="w-4 h-4 rounded-full border border-[#1b1c20] bg-[#24262b] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm"
                                >
                                  <img
                                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                                    alt={domain}
                                    className="w-3 h-3 object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                </span>
                              ))}
                            </div>
                            <span className="text-[11.5px] text-[var(--text-muted)] font-medium ml-2">
                              {story.sourcesCount} sources
                            </span>
                          </div>

                          {/* Interactive Actions */}
                          <div className="flex items-center gap-1 text-[var(--text-muted)]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(story.id);
                              }}
                              aria-label="Like story"
                              title={isLiked ? "Unlike" : "Like"}
                              className="p-1 rounded-md hover:text-red-400 hover:bg-white/5 transition-colors"
                            >
                              <Heart
                                className={cn(
                                  "w-3.5 h-3.5 transition-transform active:scale-125",
                                  isLiked
                                    ? "fill-red-500 text-red-500"
                                    : "hover:text-red-400"
                                )}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(story);
                              }}
                              aria-label="Share story"
                              title="Copy link"
                              className="p-1 rounded-md hover:text-white hover:bg-white/5 transition-colors"
                            >
                              {copiedId === story.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 animate-in fade-in" />
                              ) : (
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 px-1">
              {/* Invisible spacer on left to keep dots perfectly centered */}
              <div className="w-14" />

              {/* Dynamic Dot Indicators */}
              <div className="flex items-center gap-1.5">
                {pages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentPage(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={cn(
                      "transition-all duration-200 rounded-full",
                      currentPage === idx
                        ? "w-4 h-1.5 bg-white"
                        : "w-1.5 h-1.5 bg-white/20 hover:bg-white/45"
                    )}
                  />
                ))}
              </div>

              {/* Dedicated Arrow Buttons */}
              <div className="flex items-center gap-1 w-14 justify-end">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentPage === 0}
                  aria-label="Previous slide"
                  className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentPage === totalPages - 1}
                  aria-label="Next slide"
                  className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
