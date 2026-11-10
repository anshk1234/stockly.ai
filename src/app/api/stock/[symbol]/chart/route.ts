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
    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          range === "1D"
            ? "public, max-age=15, s-maxage=30, stale-while-revalidate=60"
            : range === "5D"
            ? "public, max-age=30, s-maxage=60, stale-while-revalidate=120"
            : range === "1M"
            ? "public, max-age=300, s-maxage=600, stale-while-revalidate=1200"
            : "public, max-age=1800, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch stock chart" }, { status: 500 });
  }
}
