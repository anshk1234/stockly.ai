import { NextRequest, NextResponse } from "next/server";
import { getMarketMovers } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const region = (searchParams.get("region") || "IN").toUpperCase() as "IN" | "US";

  try {
    const movers = await getMarketMovers(region);
    return NextResponse.json(movers, {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Error in /api/movers:", error);
    return NextResponse.json(
      { error: "Failed to fetch market movers" },
      { status: 500 }
    );
  }
}
