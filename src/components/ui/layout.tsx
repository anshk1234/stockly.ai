"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Standard page-level centered container
 * max-width: var(--container-max); margin: 0 auto; padding: 0 var(--page-gutter)
 */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full max-w-[var(--container-max)] mx-auto px-[var(--page-gutter)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Standard dashboard two-column layout:
 * Main content + fixed 320px sidebar. Collapses below 900px.
 */
export function TwoColumnLayout({
  main,
  sidebar,
  className,
}: {
  main: React.ReactNode;
  sidebar: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_var(--sidebar-width)] gap-[var(--col-gap)] w-full items-start",
        className
      )}
    >
      <section className="min-w-0 flex flex-col gap-[var(--space-6)]">{main}</section>
      <aside className="w-full min-[900px]:w-[var(--sidebar-width)] min-w-0 flex flex-col gap-[var(--space-6)]">
        {sidebar}
      </aside>
    </div>
  );
}

/**
 * Section Title component:
 * Sit above the card in --text-md, medium weight (500), with --space-3 below.
 */
export function SectionTitle({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between text-[13px] font-[var(--weight-medium)] text-[var(--text-muted)] mb-[var(--space-2)] tracking-tight",
        className
      )}
    >
      <span>{children}</span>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * Base Card component:
 * Group related rows in ONE bordered card with hairline borders.
 */
export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-card)] overflow-hidden shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Card Row component:
 * Card/row padding: 14px 16px, hairline divider between rows (none on last row)
 */
export function CardRow({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "px-[16px] py-[14px] border-b border-[var(--border)] last:border-b-0 transition-colors",
        onClick && "cursor-pointer hover:bg-[var(--bg-card-hover)]",
        className
      )}
    >
      {children}
    </div>
  );
}
