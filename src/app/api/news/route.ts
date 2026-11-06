import { NextRequest, NextResponse } from "next/server";
import { getMarketNews } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const region = (searchParams.get("region") || "IN") as "IN" | "US";

  try {
    const news = await getMarketNews(region);
    return NextResponse.json({ news }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
