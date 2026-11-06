import { NextResponse } from "next/server";
import { getMarketStatus } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getMarketStatus();
    return NextResponse.json({ status }, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch market status" }, { status: 500 });
  }
}
