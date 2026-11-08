import { NextRequest, NextResponse } from "next/server";
import { getPredictionMarkets } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || searchParams.get("tag") || "Finance";

  try {
    const markets = await getPredictionMarkets(category);
    return NextResponse.json(
      { markets },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Error in /api/predictions:", error);
    return NextResponse.json({ error: "Failed to fetch prediction markets" }, { status: 500 });
  }
}
