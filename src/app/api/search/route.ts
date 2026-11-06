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
      return NextResponse.json({ results: [], ...recommendations });
    } catch (error) {
      return NextResponse.json({ results: [], recent: [], trending: [] });
    }
  }

  try {
    const results = await searchSymbols(query.trim());
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: "Failed to search symbols" }, { status: 500 });
  }
}
