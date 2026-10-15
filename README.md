# Cafe Management

Noiric cafe ordering and operations app. Customers browse the menu and order from a table QR; staff manage the kitchen, tables, menu, loyalty and music from one workspace.

## Run locally

~~~bash
npm install
npm run dev
~~~

Open http://localhost:3000. Staff sign in at /admin; set KITCHEN_PASSWORD and SESSION_SECRET in your ignored .env.local.

## Workspaces

- / — Noiric visitor site
- /order — customer menu, QR scan, cart, email OTP sign-in, order status, rewards and music voting
- /admin — overview, live kitchen, menu editor, table QR printing, customer access, music queue and settings
- /kitchen — opens the kitchen view in the admin workspace

In Admin → Tables & QR, the base URL defaults to the current site origin. On Vercel that means the deployed domain is used automatically. Change the base URL once to apply it to every printed seat QR from that admin browser.

## Supabase

Set these server environment variables locally and in Vercel:

- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- KITCHEN_PASSWORD
- SESSION_SECRET
- RESEND_API_KEY
- Optional: RESEND_FROM (defaults to NOIRIC <onboarding@resend.dev>)

The Supabase migrations live in supabase/migrations. Apply both migrations to the target project before running the app. Keep service-role, Resend, staff-password and session secrets out of Git and browser code. The supplied local .env.local is ignored.

Email OTP uses Supabase Auth to create and verify the one-time code, with Resend's HTTP API delivering it. No SMTP setup is needed. The current test sender is for development; verify a cafe-owned sending domain in Resend and set RESEND_FROM before customer rollout. Phone OTP is postponed until an SMS provider is configured.

## Deploy to Vercel

Import this repository in Vercel, add the environment variables above, then deploy the main branch. The Supabase project must already have both migrations applied. The QR base URL will follow the deployed domain when you generate/print cards there.

Payments, online gateway, costs-based profit reporting, and automatic music playback are not connected yet.
