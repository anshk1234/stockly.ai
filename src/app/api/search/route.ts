import { NextRequest, NextResponse } from "next/server";
import { searchSymbols, getTrendingSearchAssets } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  // If no search query, return real dynamic recommendations (recent + trending from Yahoo Finance)
  if (!query || query.trim().length === 0) {
    try {
      const recommendations = await getTrendingSearchAssets();
      return NextResponse.json({ results: [], ...recommendations }, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    });
    } catch (error) {
      return NextResponse.json({ results: [], recent: [], trending: [] });
    }
  }

  try {
    const results = await searchSymbols(query.trim());
    return NextResponse.json({ results }, {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to search symbols" }, { status: 500 });
  }
}
