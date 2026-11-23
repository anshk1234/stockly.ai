import { NextRequest, NextResponse } from "next/server";
import { getStockChart } from "@/lib/yahoo";
import { TimeRange } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const { searchParams } = new URL(req.url);
  const range = (searchParams.get("range") || "1D").toUpperCase() as TimeRange;

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    const data = await getStockChart(decodeURIComponent(symbol).toUpperCase(), range);
    const cacheHeader =
      range === "1D"
        ? "public, max-age=60, s-maxage=60, stale-while-revalidate=120"
        : range === "5D"
        ? "public, max-age=600, s-maxage=600, stale-while-revalidate=1200"
        : range === "1M"
        ? "public, max-age=14400, s-maxage=14400, stale-while-revalidate=28800"
        : range === "6M" || range === "YTD"
        ? "public, max-age=43200, s-maxage=43200, stale-while-revalidate=86400"
        : "public, max-age=86400, s-maxage=86400, stale-while-revalidate=172800";

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": cacheHeader,
      },
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch stock chart" }, { status: 500 });
  }
}
