import { NextRequest, NextResponse } from "next/server";
import { getWatchlist } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbolsParam = searchParams.get("symbols");
  const symbols = symbolsParam
    ? symbolsParam.split(",").map((s) => s.trim().toUpperCase())
    : ["MSFT", "AAPL", "NVDA"];

  try {
    const quotes = await getWatchlist(symbols);
    return NextResponse.json({ quotes }, {
      headers: {
        "Cache-Control": "public, max-age=15, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch watchlist" }, { status: 500 });
  }
}
