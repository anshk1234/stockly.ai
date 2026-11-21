import { NextRequest, NextResponse } from "next/server";
import { getNotablePriceMovements } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    const movementsData = await getNotablePriceMovements(decodeURIComponent(symbol).toUpperCase());
    return NextResponse.json(movementsData, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error in /api/stock/[symbol]/movements:", error);
    return NextResponse.json({ error: "Failed to fetch price movements" }, { status: 500 });
  }
}
