import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { createPriceAlert, getUserAlerts } from "@/lib/user";
import { d1Query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? verifySessionToken(sessionCookie) : null;

  if (!session) {
    return NextResponse.json({ alerts: [] });
  }

  try {
    const alerts = await getUserAlerts(session.id);
    return NextResponse.json({ alerts });
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
