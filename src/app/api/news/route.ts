import { NextRequest, NextResponse } from "next/server";
import { getMarketNews } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get("category") || searchParams.get("region") || "IN").toUpperCase() as
    | "IN"
    | "US"
    | "CRYPTO";

  try {
    const news = await getMarketNews(category);
    return NextResponse.json({ news }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
