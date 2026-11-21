import { NextRequest, NextResponse } from "next/server";
import { getPredictionDetail } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const detail = await getPredictionDetail(id);

    if (!detail) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }

    return NextResponse.json(
      { prediction: detail },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Error in /api/predictions/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch prediction detail" }, { status: 500 });
  }
}
