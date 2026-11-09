import { NextRequest, NextResponse } from "next/server";
import { getTopAssets } from "@/lib/yahoo";
import { AssetCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryParam = (
    searchParams.get("category") ||
    searchParams.get("region") ||
    "IN"
  ).toUpperCase() as AssetCategory;

  try {
    const assets = await getTopAssets(categoryParam);
    return NextResponse.json({ assets }, {
      headers: {
        "Cache-Control": "public, max-age=15, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Failed to fetch assets:", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}
