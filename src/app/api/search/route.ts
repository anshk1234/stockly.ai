import { NextRequest, NextResponse } from "next/server";
import { searchSymbols } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchSymbols(query.trim());
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: "Failed to search symbols" }, { status: 500 });
  }
}
