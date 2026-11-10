/**
 * Cloudflare D1 Database Client for Stockly Finance
 * Direct Low-Latency HTTP API with Cloudflare Edge execution
 */

interface D1QueryResult<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

interface D1ApiResponse<T = unknown> {
  result: D1QueryResult<T>[];
  success: boolean;
  errors: { code: number; message: string }[];
  messages: string[];
}

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID;
const CLOUDFLARE_D1_API_TOKEN = process.env.CLOUDFLARE_D1_API_TOKEN;

export function isD1Configured(): boolean {
  return Boolean(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_DATABASE_ID && CLOUDFLARE_D1_API_TOKEN);
}

/**
 * Execute a single SQL query against Cloudflare D1 edge database
 */
export async function d1Query<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<T[]> {
  if (!isD1Configured()) {
    console.warn("[D1] Cloudflare D1 credentials not fully configured in .env.local");
    return [];
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_DATABASE_ID}/query`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_D1_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sql,
      params,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[D1 Error ${response.status}]`, errorText);
    throw new Error(`D1 Query failed (${response.status}): ${errorText}`);
  }

  const json: D1ApiResponse<T> = await response.json();
  if (!json.success || !json.result || json.result.length === 0) {
    const err = json.errors?.[0]?.message || "Unknown D1 error";
    console.error("[D1 Execution Error]", err);
    throw new Error(`D1 Execution Error: ${err}`);
  }

  return json.result[0].results;
}

/**
 * Execute multiple batch statements atomically in one edge roundtrip
 */
export async function d1Batch(
  statements: { sql: string; params?: (string | number | boolean | null)[] }[]
): Promise<boolean> {
  if (!isD1Configured()) {
    console.warn("[D1] Cloudflare D1 credentials not configured.");
    return false;
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_DATABASE_ID}/query`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_D1_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      statements.map((s) => ({
        sql: s.sql,
        params: s.params || [],
      }))
    ),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`D1 Batch failed: ${errorText}`);
  }

  const json: D1ApiResponse = await response.json();
  return json.success;
}
