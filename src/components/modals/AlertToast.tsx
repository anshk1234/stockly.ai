"use client";

import React, { useEffect } from "react";
import { Bell, X, ArrowUpRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatPrice } from "@/lib/utils";

export function AlertToast() {
  const { latestTriggeredAlert, dismissToast, openNotificationDrawer } = useApp();

  useEffect(() => {
    if (!latestTriggeredAlert) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 8000);
    return () => clearTimeout(timer);
  }, [latestTriggeredAlert, dismissToast]);

  if (!latestTriggeredAlert) return null;

  return (
    <div className="fixed top-16 right-6 z-[80] animate-in slide-in-from-top-4 fade-in duration-300 max-w-[360px] w-full">
      <div className="p-3.5 rounded-2xl bg-[#141518]/95 backdrop-blur-xl border border-rose-500/30 shadow-[0_8px_32px_rgba(244,63,94,0.18)] flex items-start gap-3 text-left">
        <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
          <Bell className="w-4 h-4 animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[13px] font-semibold text-white tracking-tight">Price Alert Triggered!</span>
            <button
              onClick={dismissToast}
              className="p-1 rounded-md text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[12px] text-neutral-300 mt-0.5 leading-snug">
            <strong className="text-white">{latestTriggeredAlert.symbol}</strong> crossed your target of{" "}
            <span className="text-rose-400 font-semibold tabular-nums">
              {latestTriggeredAlert.targetPrice
                ? formatPrice(latestTriggeredAlert.targetPrice, latestTriggeredAlert.currency)
                : `${latestTriggeredAlert.movementPct}% move`}
            </span>
            .
          </p>

          <div className="flex items-center gap-3 mt-2.5">
            <button
              onClick={() => {
                dismissToast();
                openNotificationDrawer();
              }}
              className="text-[11.5px] font-medium text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
            >
              <span>View Alerts Drawer</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
