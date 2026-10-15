import { cookies } from "next/headers";
import {
  ApiError,
  body,
  db,
  failure,
  orderFields,
  sameOrigin,
  signIn,
  staff,
} from "@/lib/order-server";
import { Order } from "@/lib/menu";
const attempts = new Map<string, { count: number; until: number }>();
export async function GET() {
  try {
    await staff();
    return Response.json({
      orders: await db<Order[]>(
        `cafe_orders?status=in.(received,preparing,ready)&select=${orderFields}&order=created_at.asc&limit=200`,
      ),
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    const now = Date.now();
    for (const [key, record] of attempts)
      if (record.until < now) attempts.delete(key);
    const entry = attempts.get(ip) || { count: 0, until: now + 60000 };
    if (++entry.count > 10)
      throw new ApiError("Please wait one minute before trying again.", 429);
    attempts.set(ip, entry);
    const input = await body(req);
    await signIn(typeof input.password === "string" ? input.password : "");
    attempts.delete(ip);
    return Response.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(req: Request) {
  try {
    sameOrigin(req);
    (await cookies()).delete("noiric_staff");
    return Response.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(req: Request) {
  try {
    sameOrigin(req);
    await staff();
    const input = await body(req);
    if (typeof input.id !== "string" || !/^[a-f0-9-]{36}$/.test(input.id))
      throw new ApiError("Invalid order.");
    if (
      !["preparing", "ready", "served", "paid", "cancelled"].includes(
        input.action,
      )
    )
      throw new ApiError("Invalid action.");
    await db("rpc/update_cafe_order", {
      method: "POST",
      body: JSON.stringify({
        p_id: input.id,
        p_action: input.action,
        p_verified: input.verified === true,
        p_reason: typeof input.reason === "string" ? input.reason : "",
      }),
    });
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
