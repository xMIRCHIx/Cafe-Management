import { cookies } from "next/headers";
import { body, failure, sameOrigin, ApiError } from "@/lib/order-server";
import {
  authCall,
  currentUser,
  customer,
  loyalty,
  saveSession,
  text,
  throttle,
} from "@/lib/cafe-server";
import { emptyLoyalty } from "@/lib/cafe";
export async function GET() {
  try {
    const [user, config] = await Promise.all([
      currentUser(),
      authCall<{
        external: { email: boolean; phone: boolean; google: boolean };
      }>("settings"),
    ]);
    return Response.json({
      user,
      profile: user ? await customer(user) : null,
      loyalty: user ? await loyalty(user.id) : emptyLoyalty,
      methods: {
        email: !!config.external.email,
        phone: !!config.external.phone,
        google: !!config.external.google,
      },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const input = await body(req);
    if (!['send','verify'].includes(input.action)) throw new ApiError('Invalid sign-in action.');
    const channel = input.channel === "phone" ? "phone" : "email";
    const address = text(input.address, 254);
    if (
      channel === "email"
        ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)
        : !/^\+[1-9]\d{7,14}$/.test(address)
    )
      throw new ApiError(
        channel === "email"
          ? "Enter a valid email address."
          : "Use your country code, for example +919876543210.",
      );
    throttle(`${input.action}:${address}`, input.action === "verify" ? 10 : 3);
    if (input.action === "send") {
      if (channel === "email" && process.env.RESEND_API_KEY) {
        const linkRes = await fetch(
          `${process.env.SUPABASE_URL}/auth/v1/admin/generate_link`,
          {
            method: "POST",
            headers: {
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "magiclink",
              email: address,
            }),
          },
        );
        const linkData = await linkRes.json().catch(() => ({}));
        if (!linkRes.ok || !linkData.email_otp) {
          throw new ApiError(
            linkData.msg || linkData.error_description || "Could not generate sign-in code.",
            500,
          );
        }

        const sendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:
              process.env.RESEND_FROM || "NOIRIC <onboarding@resend.dev>",
            to: address,
            subject: "Your NOIRIC verification code",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 460px; margin: 0 auto; padding: 32px 24px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff;">
                <h1 style="margin: 0 0 16px 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; color: #111;">NOIRIC</h1>
                <p style="color: #444; font-size: 15px; margin: 0 0 20px 0;">Sign in to your account with this one-time code:</p>
                <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 18px; background: #f5f5f7; text-align: center; border-radius: 8px; color: #111; margin-bottom: 20px;">
                  ${linkData.email_otp}
                </div>
                <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 0;">This code is valid for 1 hour. If you did not request this, you can safely ignore this email.</p>
              </div>
            `,
          }),
        });

        const sendData = await sendRes.json().catch(() => ({}));
        if (!sendRes.ok) {
          throw new ApiError(
            sendData.message || "Failed to deliver email through Resend.",
            sendRes.status === 403 ? 403 : 500,
          );
        }

        return Response.json({ ok: true });
      }

      await authCall("otp", {
        method: "POST",
        body: JSON.stringify({ [channel]: address, create_user: true }),
      });
      return Response.json({ ok: true });
    }
    const token = text(input.token, 10);
    if (!/^\d{6,10}$/.test(token))
      throw new ApiError("Enter the code from your message.");
    const session = await authCall<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user: { id: string; email?: string; phone?: string };
    }>("verify", {
      method: "POST",
      body: JSON.stringify({
        [channel]: address,
        token,
        type: channel === "phone" ? "sms" : "email",
      }),
    });
    await saveSession(session);
    await customer(session.user);
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    sameOrigin(req);
    const jar = await cookies();
    const token = jar.get("noiric_access")?.value;
    if (token)
      await authCall("logout", { method: "POST" }, token).catch(() => {});
    jar.delete("noiric_access");
    jar.delete("noiric_refresh");
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
