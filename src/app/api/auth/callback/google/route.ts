import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { upsertUser } from "@/lib/user";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  if (error) {
    return NextResponse.redirect(`${appUrl}/?auth_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/?auth_error=missing_code_or_state`);
  }

  // Verify CSRF state
  let returnTo = "/";
  try {
    const parsedState = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    const cookieStore = await cookies();
    const storedCsrf = cookieStore.get("oauth_state")?.value;

    if (!storedCsrf || storedCsrf !== parsedState.csrf) {
      return NextResponse.redirect(`${appUrl}/?auth_error=invalid_csrf_state`);
    }

    if (parsedState.returnTo && typeof parsedState.returnTo === "string" && parsedState.returnTo.startsWith("/")) {
      returnTo = parsedState.returnTo;
    }
  } catch {
    return NextResponse.redirect(`${appUrl}/?auth_error=state_decode_failed`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/?auth_error=missing_credentials`);
  }

  const redirectUri = `${appUrl}/api/auth/callback/google`;

  try {
    // Exchange code for Google Access Token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[OAuth] Token exchange failed:", errText);
      return NextResponse.redirect(`${appUrl}/?auth_error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch user profile from Google UserInfo endpoint
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${appUrl}/?auth_error=userinfo_failed`);
    }

    const googleUser = await userRes.json();
    // googleUser format: { sub, name, given_name, family_name, picture, email, email_verified }

    // Persist or update user in Cloudflare D1
    try {
      await upsertUser({
        id: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name || "Investor",
        avatarUrl: googleUser.picture,
      });
    } catch (d1Err) {
      console.warn("[OAuth] Failed to upsert user into D1:", d1Err);
    }

    // Create 30-Day signed session token
    const sessionToken = createSessionToken({
      id: googleUser.sub,
      name: googleUser.name || "Investor",
      email: googleUser.email,
      avatarUrl: googleUser.picture,
    });

    const response = NextResponse.redirect(`${appUrl}${returnTo}`);

    // Set 30-Day HttpOnly session cookie
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS, // 30 days
    });

    // Clear temporary CSRF state cookie
    response.cookies.delete("oauth_state");

    return response;
  } catch (err) {
    console.error("[OAuth] Callback exception:", err);
    return NextResponse.redirect(`${appUrl}/?auth_error=server_error`);
  }
}
