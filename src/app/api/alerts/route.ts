import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { createPriceAlert, getUserAlerts } from "@/lib/user";
import { d1Query } from "@/lib/db";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? verifySessionToken(sessionCookie) : null;

  if (!session) {
    return NextResponse.json({ alerts: [], triggeredCount: 0, activeCount: 0 });
  }

  try {
    const alerts = await getUserAlerts(session.id);
    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ alerts: [], triggeredCount: 0, activeCount: 0 });
    }

    // Extract unique symbols to batch fetch current prices
    const symbols = Array.from(new Set(alerts.map((a) => a.symbol)));
    const quotesMap: Record<
      string,
      { price: number; change: number; changePercent: number; currency: string; name?: string }
    > = {};

    try {
      const quotes = await yf.quote(symbols);
      const quotesList = Array.isArray(quotes) ? quotes : [quotes];
      quotesList.forEach((q) => {
        if (q && q.symbol) {
          quotesMap[q.symbol.toUpperCase()] = {
            price: q.regularMarketPrice ?? 0,
            change: q.regularMarketChange ?? 0,
            changePercent: q.regularMarketChangePercent ?? 0,
            currency: q.currency || "USD",
            name: q.shortName || q.longName || q.symbol,
          };
        }
      });
    } catch (e) {
      console.error("[Alerts] Failed to batch fetch quotes:", e);
    }

    const now = Date.now();

    const enrichedAlerts = await Promise.all(
      alerts.map(async (alert) => {
        const quote = quotesMap[alert.symbol.toUpperCase()];
        const currentPrice = quote?.price ?? 0;
        const change = quote?.change ?? 0;
        const changePercent = quote?.changePercent ?? 0;
        const currency = quote?.currency || "USD";
        const name = quote?.name || alert.symbol;

        let isTriggered = alert.status === "TRIGGERED";
        let distancePercent = 0;

        if (alert.criteria === "TARGET_PRICE" && alert.target_price && currentPrice > 0) {
          distancePercent = ((alert.target_price - currentPrice) / currentPrice) * 100;
          if (alert.status === "ACTIVE") {
            // Trigger if price crossed target or reached within 0.25%
            if (currentPrice >= alert.target_price || Math.abs(distancePercent) < 0.25) {
              isTriggered = true;
            }
          }
        } else if (alert.criteria === "MOVEMENT_AMOUNT" && alert.movement_pct) {
          distancePercent = Math.abs(changePercent) - alert.movement_pct;
          if (alert.status === "ACTIVE" && Math.abs(changePercent) >= alert.movement_pct) {
            isTriggered = true;
          }
        }

        // If newly triggered, update status in Cloudflare D1
        if (isTriggered && alert.status !== "TRIGGERED") {
          try {
            await d1Query("UPDATE price_alerts SET status = 'TRIGGERED', triggered_at = ? WHERE id = ?", [
              now,
              alert.id,
            ]);
          } catch (err) {
            console.error("[Alerts] Failed to update triggered status in D1:", err);
          }
        }

        return {
          id: alert.id,
          symbol: alert.symbol,
          name,
          criteria: alert.criteria,
          targetPrice: alert.target_price,
          movementPct: alert.movement_pct,
          channels: typeof alert.channels === "string" ? JSON.parse(alert.channels || "[]") : alert.channels,
          status: isTriggered ? "TRIGGERED" : alert.status,
          triggeredAt: alert.triggered_at || (isTriggered ? now : null),
          createdAt: alert.created_at,
          currentPrice,
          change,
          changePercent,
          currency,
          distancePercent: Number(distancePercent.toFixed(2)),
          additionalInstructions: alert.additional_instructions,
        };
      })
    );

    const triggeredCount = enrichedAlerts.filter((a) => a.status === "TRIGGERED").length;
    const activeCount = enrichedAlerts.filter((a) => a.status === "ACTIVE").length;

    return NextResponse.json({
      alerts: enrichedAlerts,
      triggeredCount,
      activeCount,
    });
  } catch (err) {
    console.error("[Alerts] Failed to fetch alerts from D1:", err);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? verifySessionToken(sessionCookie) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please sign in to set alerts." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { symbol, criteria, targetPrice, movementPct, channels, defaultQuery, additionalInstructions } = body;

    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    const alertId = await createPriceAlert({
      userId: session.id,
      symbol: symbol.toUpperCase(),
      criteria: criteria || "TARGET_PRICE",
      targetPrice: targetPrice ? Number(targetPrice) : undefined,
      movementPct: movementPct ? Number(movementPct) : undefined,
      channels: Array.isArray(channels) ? channels : ["in_app"],
      defaultQuery,
      additionalInstructions,
    });

    return NextResponse.json({ success: true, alertId });
  } catch (err) {
    console.error("[Alerts] Failed to create price alert in D1:", err);
    return NextResponse.json({ error: "Failed to save alert" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? verifySessionToken(sessionCookie) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, action } = body; // 'DISMISS' | 'REACTIVATE'

    if (!id) {
      return NextResponse.json({ error: "Alert ID required" }, { status: 400 });
    }

    if (action === "DISMISS") {
      await d1Query("UPDATE price_alerts SET status = 'DISMISSED' WHERE id = ? AND user_id = ?", [id, session.id]);
    } else if (action === "REACTIVATE") {
      await d1Query("UPDATE price_alerts SET status = 'ACTIVE', triggered_at = NULL WHERE id = ? AND user_id = ?", [
        id,
        session.id,
      ]);
    }

    return NextResponse.json({ success: true, id, action });
  } catch (err) {
    console.error("[Alerts] Failed to update alert in D1:", err);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? verifySessionToken(sessionCookie) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const alertId = searchParams.get("id");

    if (!alertId) {
      return NextResponse.json({ error: "Alert ID is required" }, { status: 400 });
    }

    await d1Query("DELETE FROM price_alerts WHERE id = ? AND user_id = ?", [alertId, session.id]);
    return NextResponse.json({ success: true, alertId });
  } catch (err) {
    console.error("[Alerts] Failed to delete alert from D1:", err);
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}
