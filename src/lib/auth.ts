import crypto from "crypto";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  exp: number; // Expiration timestamp in ms
}

const SESSION_COOKIE_NAME = "stockly_session";
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.GOOGLE_CLIENT_SECRET || "stockly-default-secure-dev-secret-32-chars";
  return secret;
}

/**
 * Creates a signed session token: base64(payload).signature
 */
export function createSessionToken(user: Omit<SessionUser, "exp">): string {
  const secret = getAuthSecret();
  const payload: SessionUser = {
    ...user,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadStr)
    .digest("base64url");

  return `${payloadStr}.${signature}`;
}

/**
 * Verifies a signed session token and returns the session user if valid and not expired.
 */
export function verifySessionToken(token: string): SessionUser | null {
  if (!token || !token.includes(".")) return null;

  try {
    const [payloadStr, signature] = token.split(".");
    if (!payloadStr || !signature) return null;

    const secret = getAuthSecret();
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payloadStr)
      .digest("base64url");

    // Timing-safe comparison to prevent timing attacks
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const json = Buffer.from(payloadStr, "base64url").toString("utf8");
    const session: SessionUser = JSON.parse(json);

    // Check expiration (30 days)
    if (Date.now() > session.exp) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
