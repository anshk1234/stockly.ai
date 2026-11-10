import { d1Query, isD1Configured } from "./db";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: number;
  updated_at: number;
}

export interface WatchlistRecord {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  asset_type: string;
  created_at: number;
}

export interface PriceAlertRecord {
  id: string;
  user_id: string;
  symbol: string;
  criteria: "TARGET_PRICE" | "MOVEMENT_AMOUNT";
  target_price?: number;
  movement_pct?: number;
  channels: string; // JSON string
  default_query?: string;
  additional_instructions?: string;
  status: "ACTIVE" | "TRIGGERED" | "DISABLED";
  triggered_at?: number;
  created_at: number;
}

/**
 * Upsert user profile upon successful Google OAuth login
 */
export async function upsertUser(user: {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}): Promise<void> {
  if (!isD1Configured()) return;

  const now = Date.now();
  const sql = `
    INSERT INTO users (id, email, name, avatar_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      avatar_url = excluded.avatar_url,
      updated_at = excluded.updated_at
  `;

  await d1Query(sql, [user.id, user.email, user.name, user.avatarUrl || null, now, now]);
}

/**
 * Get all watchlist symbols for a user
 */
export async function getUserWatchlist(userId: string): Promise<WatchlistRecord[]> {
  if (!isD1Configured()) return [];
  const sql = `SELECT * FROM watchlists WHERE user_id = ? ORDER BY created_at DESC`;
  return d1Query<WatchlistRecord>(sql, [userId]);
}

/**
 * Add ticker to user watchlist
 */
export async function addToWatchlist(
  userId: string,
  symbol: string,
  name: string,
  assetType = "STOCK"
): Promise<void> {
  if (!isD1Configured()) return;
  const id = `wl_${userId}_${symbol}`.replace(/[^a-zA-Z0-9_]/g, "_");
  const now = Date.now();
  const sql = `
    INSERT INTO watchlists (id, user_id, symbol, name, asset_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, symbol) DO NOTHING
  `;
  await d1Query(sql, [id, userId, symbol, name, assetType, now]);
}

/**
 * Remove ticker from user watchlist
 */
export async function removeFromWatchlist(userId: string, symbol: string): Promise<void> {
  if (!isD1Configured()) return;
  const sql = `DELETE FROM watchlists WHERE user_id = ? AND symbol = ?`;
  await d1Query(sql, [userId, symbol]);
}

/**
 * Create a new Price Alert
 */
export async function createPriceAlert(alert: {
  userId: string;
  symbol: string;
  criteria: "TARGET_PRICE" | "MOVEMENT_AMOUNT";
  targetPrice?: number;
  movementPct?: number;
  channels: string[];
  defaultQuery?: string;
  additionalInstructions?: string;
}): Promise<string> {
  if (!isD1Configured()) return "";
  const id = `alt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();
  const sql = `
    INSERT INTO price_alerts (
      id, user_id, symbol, criteria, target_price, movement_pct, channels, default_query, additional_instructions, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
  `;
  await d1Query(sql, [
    id,
    alert.userId,
    alert.symbol,
    alert.criteria,
    alert.targetPrice || null,
    alert.movementPct || null,
    JSON.stringify(alert.channels),
    alert.defaultQuery || null,
    alert.additionalInstructions || null,
    now,
  ]);
  return id;
}

/**
 * Get active alerts for a user
 */
export async function getUserAlerts(userId: string): Promise<PriceAlertRecord[]> {
  if (!isD1Configured()) return [];
  const sql = `SELECT * FROM price_alerts WHERE user_id = ? ORDER BY created_at DESC`;
  return d1Query<PriceAlertRecord>(sql, [userId]);
}
