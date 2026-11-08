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
        "Cache-Control": range === "1D" ? "public, max-age=15, s-maxage=30, stale-while-revalidate=60" : "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stock chart" }, { status: 500 });
  }
}
