import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = "USD"): string {
  if (isNaN(price) || price === null || price === undefined) return "0.00";

  const isUSD = currency === "USD" || currency === "$" || currency === "USDT";
  const isINR = currency === "INR" || currency === "₹";

  const formatter = new Intl.NumberFormat(isINR ? "en-IN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formatted = formatter.format(price);
  if (isUSD) return `$${formatted}`;
  if (isINR) return `₹${formatted}`;
  return formatted;
}

export function formatChange(change: number, currency: string = "USD"): string {
  if (isNaN(change) || change === null || change === undefined) return "+0.00";
  const sign = change >= 0 ? "+" : "-";
  const abs = Math.abs(change);
  const isUSD = currency === "USD" || currency === "$";
  const isINR = currency === "INR" || currency === "₹";

  const formatter = new Intl.NumberFormat(isINR ? "en-IN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const symbol = isUSD ? "$" : isINR ? "₹" : "";
  return `${sign}${symbol}${formatter.format(abs)}`;
}

export function formatPercent(percent: number): string {
  if (isNaN(percent) || percent === null || percent === undefined) return "0.00%";
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

export function formatCompactNumber(num: number | undefined | null, prefix: string = ""): string {
  if (num === null || num === undefined || isNaN(num) || num === 0) return "N/A";

  const abs = Math.abs(num);
  if (abs >= 1e12) {
    return `${prefix}${(num / 1e12).toFixed(2)}T`;
  }
  if (abs >= 1e9) {
    return `${prefix}${(num / 1e9).toFixed(2)}B`;
  }
  if (abs >= 1e6) {
    return `${prefix}${(num / 1e6).toFixed(2)}M`;
  }
  if (abs >= 1e3) {
    return `${prefix}${(num / 1e3).toFixed(1)}K`;
  }
  return `${prefix}${num.toFixed(2)}`;
}

export function formatTimeAgo(dateString: string | number | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes === 1) return "1 minute ago";
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return "1 hour ago";
  if (diffInHours < 24) return `${diffInHours} hours ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
}
