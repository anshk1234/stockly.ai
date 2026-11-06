import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = "INR"): string {
  if (isNaN(price)) return "0.00";

  const isCryptoOrUSD = currency === "USD" || currency === "$" || currency === "USDT";
  
  const formatter = new Intl.NumberFormat(currency === "INR" || currency === "₹" ? "en-IN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formatted = formatter.format(price);
  return isCryptoOrUSD ? `$${formatted}` : formatted;
}

export function formatChange(change: number, currency: string = "INR"): string {
  if (isNaN(change)) return "+0.00";
  const sign = change >= 0 ? "+" : "-";
  const abs = Math.abs(change);
  const isCryptoOrUSD = currency === "USD" || currency === "$";
  
  const formatter = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${sign}${isCryptoOrUSD ? "$" : ""}${formatter.format(abs)}`;
}

export function formatPercent(percent: number): string {
  if (isNaN(percent)) return "0.00%";
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
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
