"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Bell,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatPrice, formatPercent } from "@/lib/utils";
import { TickerLogo } from "@/components/ui/TickerLogo";

export function NotificationDrawer() {
  const {
    isNotificationDrawerOpen,
    closeNotificationDrawer,
    alerts,
    triggeredAlertsCount,
    activeAlertsCount,
    dismissAlert,
    deleteAlert,
    openAlertModal,
    isGuest,
    openAuthModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"triggered" | "active">("triggered");

  if (!isNotificationDrawerOpen) return null;

  const triggeredAlerts = alerts.filter((a) => a.status === "TRIGGERED");
  const activeAlerts = alerts.filter((a) => a.status === "ACTIVE");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={closeNotificationDrawer} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-[420px] h-full bg-[#111215]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white tracking-tight leading-tight">Price Alerts</h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">Cloudflare D1 Real-Time Monitor</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isGuest) {
                  openAuthModal("alert");
                } else {
                  openAlertModal();
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[12px] font-medium border border-white/15 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            <button
              onClick={closeNotificationDrawer}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2 bg-white/[0.01]">
          <button
            onClick={() => setActiveTab("triggered")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-[12px] font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "triggered"
                ? "bg-white/10 text-white shadow-sm border border-white/15"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>Triggered</span>
            {triggeredAlertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/90 text-white text-[10px] font-bold">
                {triggeredAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-[12px] font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "active"
                ? "bg-white/10 text-white shadow-sm border border-white/15"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>Active Targets</span>
            {activeAlertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-neutral-700 text-neutral-200 text-[10px] font-medium">
                {activeAlertsCount}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {isGuest ? (
            <div className="py-16 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                <Bell className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="text-[14px] font-medium text-white mb-1">Sign in to track alerts</h3>
              <p className="text-[12px] text-neutral-400 max-w-xs mx-auto mb-5 leading-relaxed">
                Connect your account to save price targets across devices and get notified when markets move.
              </p>
              <button
                onClick={() => openAuthModal("alert")}
                className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 text-[12px] font-medium transition-all"
              >
                Sign In with Google
              </button>
            </div>
          ) : activeTab === "triggered" ? (
            /* TRIGGERED TAB */
            triggeredAlerts.length === 0 ? (
              <div className="py-16 text-center px-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-400/80 mx-auto mb-3 stroke-[1.5]" />
                <h3 className="text-[14px] font-medium text-white mb-1">All clear</h3>
                <p className="text-[12px] text-neutral-400 max-w-xs mx-auto leading-relaxed">
                  No triggered alerts right now. When an active target is crossed by market prices, it will appear here.
                </p>
              </div>
            ) : (
              triggeredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-xl bg-rose-500/[0.04] border border-rose-500/20 hover:border-rose-500/30 transition-all flex flex-col gap-2.5 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TickerLogo symbol={alert.symbol} name={alert.name} size={30} />
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-white truncate">{alert.name}</div>
                        <div className="text-[11px] text-neutral-400 uppercase">{alert.symbol}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 text-[11px] font-medium transition-colors"
                        title="Dismiss alert"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[12px]">
                    <div>
                      <span className="text-neutral-400">Triggered at: </span>
                      <span className="font-semibold text-rose-400 tabular-nums">
                        {alert.targetPrice ? formatPrice(alert.targetPrice, alert.currency) : `${alert.movementPct}% move`}
                      </span>
                    </div>

                    <div className="text-right tabular-nums">
                      <span className="text-neutral-400">Now: </span>
                      <span className="font-medium text-white">{formatPrice(alert.currentPrice, alert.currency)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span>{alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleTimeString() : "Just now"}</span>
                    </div>

                    <Link
                      href={`/stocks/${encodeURIComponent(alert.symbol)}`}
                      onClick={closeNotificationDrawer}
                      className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-medium transition-colors"
                    >
                      <span>Open Chart</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )
          ) : (
            /* ACTIVE TARGETS TAB */
            activeAlerts.length === 0 ? (
              <div className="py-16 text-center px-4">
                <Sparkles className="w-10 h-10 text-orange-400/80 mx-auto mb-3 stroke-[1.5]" />
                <h3 className="text-[14px] font-medium text-white mb-1">No active monitors</h3>
                <p className="text-[12px] text-neutral-400 max-w-xs mx-auto mb-5 leading-relaxed">
                  Set a price target or percentage move alert on any asset to track it automatically.
                </p>
                <button
                  onClick={() => openAlertModal()}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 text-[12px] font-medium transition-all"
                >
                  Create Target
                </button>
              </div>
            ) : (
              activeAlerts.map((alert) => {
                const isPositive = alert.changePercent >= 0;
                return (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all flex flex-col gap-2.5 relative group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <TickerLogo symbol={alert.symbol} name={alert.name} size={30} />
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-white truncate">{alert.name}</div>
                          <div className="text-[11px] text-neutral-400 uppercase">{alert.symbol}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[13px] font-medium text-white tabular-nums">
                          {formatPrice(alert.currentPrice, alert.currency)}
                        </div>
                        <div
                          className={`text-[11px] font-medium tabular-nums flex items-center justify-end gap-0.5 ${
                            isPositive ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          <span>{formatPercent(alert.changePercent)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Target & Distance */}
                    <div className="p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between text-[11.5px]">
                      <div>
                        <span className="text-neutral-400">Target: </span>
                        <span className="font-semibold text-white tabular-nums">
                          {alert.targetPrice ? formatPrice(alert.targetPrice, alert.currency) : `±${alert.movementPct}%`}
                        </span>
                      </div>

                      <div className="tabular-nums font-medium text-neutral-300">
                        {alert.distancePercent !== undefined && (
                          <span>
                            {alert.distancePercent > 0 ? `+${alert.distancePercent}%` : `${alert.distancePercent}%`} to
                            target
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Monitoring live</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/stocks/${encodeURIComponent(alert.symbol)}`}
                          onClick={closeNotificationDrawer}
                          className="hover:text-white transition-colors"
                        >
                          Chart
                        </Link>
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          className="text-neutral-400 hover:text-rose-400 transition-colors"
                          title="Delete alert"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
}
