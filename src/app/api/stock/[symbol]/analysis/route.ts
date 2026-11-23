import { NextRequest, NextResponse } from "next/server";
import { getStockAnalysis } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    const cleanSym = decodeURIComponent(symbol).toUpperCase();
    const analysis = await getStockAnalysis(cleanSym);

    if (!analysis) {
      return NextResponse.json({ error: "Analysis data not found" }, { status: 404 });
    }

    return NextResponse.json(
      { analysis },
      {
        headers: {
          "Cache-Control": "public, max-age=25200, s-maxage=25200, stale-while-revalidate=50400",
        },
      }
    );
  } catch (error) {
    console.error("API error in stock analysis:", error);
    return NextResponse.json({ error: "Failed to fetch stock analysis" }, { status: 500 });
  }
}
