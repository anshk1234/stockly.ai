import { NextRequest, NextResponse } from "next/server";
import { getStockDetails } from "@/lib/yahoo";

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
    const details = await getStockDetails(decodeURIComponent(symbol).toUpperCase());
    if (!details) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    return NextResponse.json({ stock: details }, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stock details" }, { status: 500 });
  }
}
