import { NextResponse } from "next/server";
import { getCryptoAssets, getPopularCryptos } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [cryptoMovements, popularCryptos] = await Promise.all([
      getCryptoAssets(),
      getPopularCryptos(),
    ]);

    return NextResponse.json({
      movements: cryptoMovements,
      popular: popularCryptos,
    }, {
      headers: {
        "Cache-Control": "public, max-age=15, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch crypto assets" }, { status: 500 });
  }
}
