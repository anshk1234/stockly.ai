import { NextRequest, NextResponse } from "next/server";
import { getTopAssets } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const region = (searchParams.get("region") || "IN") as "IN" | "US";

  try {
    const assets = await getTopAssets(region);
    return NextResponse.json({ assets }, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}
