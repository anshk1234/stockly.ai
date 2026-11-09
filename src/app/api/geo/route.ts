import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const countryHeader =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-country-code") ||
    "IN";

  const cleanCountry = countryHeader.trim().toUpperCase();
  const region = cleanCountry === "IN" ? "IN" : "US";

  return NextResponse.json({
    country: cleanCountry,
    region,
  });
}
