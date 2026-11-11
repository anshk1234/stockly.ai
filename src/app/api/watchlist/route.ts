import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getWatchlist } from "@/lib/yahoo";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { getUserWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/user";
import { serverCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? verifySessionToken(sessionCookie) : null;

  const { searchParams } = new URL(req.url);
  const symbolsParam = searchParams.get("symbols");

  let targetSymbols: string[] = [];
  let userWatchlistSymbols: string[] = [];

  if (session) {
    try {
      // Cache user's watchlist symbols from D1 for 24h, invalidated automatically on POST/DELETE
      const cacheKey = `user-d1-watchlist-${session.id}`;
      const records = await serverCache.getOrSet(cacheKey, 86400, async () => {
        return getUserWatchlist(session.id);
      });
      userWatchlistSymbols = records.map((r) => r.symbol);
    } catch (err) {
      console.error("[Watchlist] Failed to fetch user watchlist from D1:", err);
    }
  }

  if (symbolsParam) {
    targetSymbols = symbolsParam.split(",").map((s) => s.trim().toUpperCase());
  } else if (session) {
    // Authenticated user: return their exact D1 watchlist (even if empty)
    targetSymbols = userWatchlistSymbols;
  } else {
    // Guest default recommendations
    targetSymbols = ["MSFT", "AAPL", "NVDA"];
  }

  try {
    const quotes = targetSymbols.length > 0 ? await getWatchlist(targetSymbols) : [];
    return NextResponse.json({
      quotes,
      savedSymbols: userWatchlistSymbols,
      isLoggedIn: Boolean(session),
    }, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[Watchlist] Error fetching quotes:", error);
    return NextResponse.json({ error: "Failed to fetch watchlist" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? verifySessionToken(sessionCookie) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { symbol, name, assetType } = body;

    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    await addToWatchlist(session.id, symbol.toUpperCase(), name || symbol, assetType || "STOCK");
    // Invalidate cached D1 watchlist symbols immediately
    serverCache.clear(`user-d1-watchlist-${session.id}`);

    return NextResponse.json({ success: true, symbol: symbol.toUpperCase() });
  } catch (err) {
    console.error("[Watchlist] Failed to add to D1:", err);
    return NextResponse.json({ error: "Failed to add to watchlist" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? verifySessionToken(sessionCookie) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { symbol } = body;

    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    await removeFromWatchlist(session.id, symbol.toUpperCase());
    // Invalidate cached D1 watchlist symbols immediately
    serverCache.clear(`user-d1-watchlist-${session.id}`);

    return NextResponse.json({ success: true, symbol: symbol.toUpperCase() });
  } catch (err) {
    console.error("[Watchlist] Failed to remove from D1:", err);
    return NextResponse.json({ error: "Failed to remove from watchlist" }, { status: 500 });
  }
}
