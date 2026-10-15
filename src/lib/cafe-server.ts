import "server-only";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { ApiError, cookieOptions, db } from "./order-server";
import type { Customer, Loyalty, Reward, Seat, Settings } from "./cafe";
export const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function text(value: unknown, max = 200) {
  if (typeof value !== "string" || value.length > max)
    throw new ApiError("Please check the text fields.");
  return value.trim();
}
export function integer(value: unknown, min = 0, max = 100000) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  )
    throw new ApiError(`Enter a whole number between ${min} and ${max}.`);
  return value;
}
export async function settings() {
  const [row] = await db<Settings[]>("cafe_settings?id=eq.1");
  if (!row)
    throw new ApiError(
      "Finish the database setup before using the café workspace.",
      503,
    );
  return row;
}
export async function seatFor(code: string) {
  if (!uuid.test(code))
    throw new ApiError("Scan the QR on your seat to start an order.");
  const [seat] = await db<Seat[]>(`cafe_seats?code=eq.${code}&active=eq.true`);
  if (!seat)
    throw new ApiError(
      "This seat QR is inactive. Please ask our team for help.",
    );
  return seat;
}
export function checkWifi(req: Request, config: Settings) {
  if (!config.wifi_required) return;
  if (process.env.VERCEL !== "1")
    throw new ApiError(
      "Wi-Fi verification needs the café hosting setup. Please ask our team for help.",
      503,
    );
  const ip = req.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim();
  if (!ip || !isIP(ip) || !config.wifi_public_ips.includes(ip))
    throw new ApiError("Connect to the café Wi-Fi to place your order.", 403);
}
export async function authCall<T>(
  path: string,
  init?: RequestInit,
  token?: string,
): Promise<T> {
  const key = process.env.SUPABASE_ANON_KEY;
  if (!key) throw new ApiError("Sign-in is not configured.", 503);
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (path === "otp")
      throw new ApiError(
        response.status === 429
          ? "Please wait a minute before requesting another code."
          : "Could not send a code. The café’s email or SMS provider may need configuration.",
        response.status === 429 ? 429 : 503,
      );
    throw new ApiError(
      "Your code or session has expired. Please sign in again.",
      401,
    );
  }
  return result as T;
}
type AuthUser = { id: string; email?: string; phone?: string };
type Session = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
};
export async function saveSession(session: Session) {
  const jar = await cookies();
  jar.set("noiric_access", session.access_token, {
    ...cookieOptions,
    maxAge: session.expires_in,
  });
  jar.set("noiric_refresh", session.refresh_token, cookieOptions);
}
export async function currentUser(required = false): Promise<AuthUser | null> {
  const jar = await cookies();
  const access = jar.get("noiric_access")?.value;
  const refresh = jar.get("noiric_refresh")?.value;
  if (access) {
    try {
      return await authCall<AuthUser>("user", undefined, access);
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 401) throw e;
    }
  }
  if (refresh) {
    try {
      const session = await authCall<Session>(
        "token?grant_type=refresh_token",
        { method: "POST", body: JSON.stringify({ refresh_token: refresh }) },
      );
      await saveSession(session);
      return session.user;
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 401) throw e;
      jar.delete("noiric_access");
      jar.delete("noiric_refresh");
    }
  }
  if (required) throw new ApiError("Sign in to continue.", 401);
  return null;
}
export async function customer(user: AuthUser) {
  const [existing] = await db<Customer[]>(`cafe_customers?id=eq.${user.id}`);
  if (existing) return existing;
  const rows = await db<Customer[]>("cafe_customers?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({
      id: user.id,
      email: user.email || null,
      phone: user.phone || null,
    }),
  });
  if (rows[0]) return rows[0];
  return (await db<Customer[]>(`cafe_customers?id=eq.${user.id}`))[0];
}
export async function loyalty(id: string): Promise<Loyalty> {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - 29);
  const [visits, rewards] = await Promise.all([
    db<{ visit_day: string; reward_id: string | null }[]>(
      `cafe_visits?customer_id=eq.${id}&visit_day=gte.${cutoff.toISOString().slice(0, 10)}`,
    ),
    db<Reward[]>(
      `cafe_rewards?customer_id=eq.${id}&expires_at=gt.${new Date().toISOString()}&state=in.(available,reserved)&order=earned_at.desc`,
    ),
  ]);
  return {
    stamps: visits.filter((v) => !v.reward_id).length,
    visits: visits.length,
    rewards,
    returning: visits.some((v) => v.visit_day < today),
  };
}
const limits = new Map<string, { count: number; until: number }>();
export function throttle(key: string, max = 6, windowMs = 60000) {
  const hash = createHash("sha256").update(key).digest("hex"),
    now = Date.now();
  for (const [k, v] of limits) if (v.until < now) limits.delete(k);
  const row = limits.get(hash) || { count: 0, until: now + windowMs };
  row.count++;
  limits.set(hash, row);
  if (row.count > max)
    throw new ApiError("Too many attempts. Please wait a minute.", 429);
}
