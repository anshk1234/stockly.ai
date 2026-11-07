import { NextRequest, NextResponse } from "next/server";
import { getMarketSummary } from "@/lib/news";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = (
    searchParams.get("category") ||
    searchParams.get("region") ||
    "IN"
  ).toUpperCase() as "IN" | "US" | "CRYPTO";

  try {
    const data = await getMarketSummary(category);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error("Failed to fetch market news summary:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
