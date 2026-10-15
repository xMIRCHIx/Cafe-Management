import "server-only";
import { cookies } from "next/headers";
import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
export async function guest(create = false) {
  const jar = await cookies();
  let id = jar.get("noiric_guest")?.value;
  if (!id || !/^[a-f0-9-]{36}$/.test(id)) {
    if (!create) return null;
    id = randomUUID();
    jar.set("noiric_guest", id, cookieOptions);
  }
  return createHash("sha256").update(id).digest("hex");
}
export async function db<T>(path: string, init?: RequestInit): Promise<T> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !process.env.SUPABASE_URL)
    throw new ApiError("Order service is not configured yet.", 503);
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (["PGRST205", "PGRST202", "42P01"].includes(error.code))
      throw new ApiError(
        "Ordering is being set up. Please ask a staff member to take your order.",
        503,
      );
    if (error.code === "P0001") throw new ApiError(error.message);
    throw new ApiError("Could not save your request. Please try again.", 502);
  }
  const resultText = await response.text();
  return resultText ? (JSON.parse(resultText) as T) : (undefined as T);
}
function signature(value: string) {
  if (!process.env.SESSION_SECRET)
    throw new ApiError("Staff access is not configured.", 503);
  return createHmac("sha256", process.env.SESSION_SECRET)
    .update(value)
    .digest("hex");
}
export function equal(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export async function staff() {
  const token = (await cookies()).get("noiric_staff")?.value || "";
  const [expires, sig] = token.split(".");
  if (
    !expires ||
    !sig ||
    Number(expires) < Date.now() ||
    !equal(signature(expires), sig)
  )
    throw new ApiError("Please sign in to the kitchen.", 401);
}
export async function signIn(password: string) {
  if (
    !process.env.KITCHEN_PASSWORD ||
    !equal(password, process.env.KITCHEN_PASSWORD)
  )
    throw new ApiError("Incorrect kitchen password.", 401);
  const expires = String(Date.now() + 12 * 60 * 60 * 1000);
  (await cookies()).set("noiric_staff", `${expires}.${signature(expires)}`, {
    ...cookieOptions,
    maxAge: 12 * 60 * 60,
  });
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin)
    throw new ApiError("Request not allowed.", 403);
}
export async function body(req: Request) {
  const text = await req.text();
  if (text.length > 16000) throw new ApiError("Request too large.", 413);
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error();
    return parsed;
  } catch {
    throw new ApiError("Invalid request.");
  }
}
export function failure(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof ApiError
          ? error.message
          : "Connection interrupted. Please try again.",
    },
    { status: error instanceof ApiError ? error.status : 503 },
  );
}
export const orderFields =
  "id,number,seat,customer_name,notes,status,total,created_at,items,customer_id,subtotal,discount,paid,paid_at,seat_verified,rejection_reason,reward_id";
