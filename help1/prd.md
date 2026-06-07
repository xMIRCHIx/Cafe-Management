# MASTER PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Project Ecosystem:** Mindspace Library & Noric Cafe Integration
**Target Location:** Ambikapur, Chhattisgarh
**Engineered by:** Kryto Studio (synchAD)
**Tech Stack:** Next.js (App Router), Tailwind CSS, Framer Motion, Supabase

---

## 1. Business Context & Core Model
**CRITICAL UNDERSTANDING:** "Mindspace Library" is a Tier-3 city terminology for a **Study Hall / Reading Room**. 
*   **We DO NOT deal with issuing books.** 
*   The business provides a peaceful study environment with numbered desk cubicles, ergonomic chairs, individual lighting, Wi-Fi, AC, and personal lockers.
*   The UI/UX must strictly focus on promoting productivity, focus, and premium amenities, avoiding traditional book-repository visuals.

---

## 2. System Architecture (Split-Ready Monorepo)
The ecosystem will be built as a single Next.js project using Route Groups to prepare for a future Decoupled/Air-gapped architecture.
*   **(customer)/** : Cloud-Hosted on Vercel. Contains the Visitor pages and the QR Ordering Portal.
*   **(admin)/** : Built alongside but designed to be extracted later into a Local Desktop App (via Tauri/Electron) running exclusively on the Reception PC for maximum security.

---

## 3. Design System & Theming
### A. Noric Cafe (Cream & Mocha Aesthetic)
*   **Colors:** Primary Background `#EADACF` (Warm Beige), Dark Accent `#2D2B2A` (Espresso/Charcoal), Card Backgrounds `#F5EBE4` (Light Cream).
*   **Typography:** Elegant Serif (e.g., Playfair Display) for headings, Clean Sans-Serif (e.g., Inter) for body.
*   **Shapes:** Wavy SVG dividers separating sections (especially Hero to Main Content). Soft rounded corners (`rounded-3xl`) for item cards.

### B. Mindspace Library (Focus & Calm Aesthetic)
*   **Colors:** Crisp White `#FFFFFF`, Light Blue `#E0F2FE`, Aqua/Teal Accent `#0D9488`, Warm Birch `#F4EBD0` for cozy architectural feel.
*   **Shapes:** Subtle Arch masks for image containers to convey premium architecture. 

---

## 4. Frontend Modules & User Flows

### Module 1: Mindspace Visitor Landing Page (`/library`)
*   **Focus:** High-converting, premium digital brochure.
*   **Sections:** 100vh Hero with Arch-masked study desk image, "Our Story", Radial/Spider-web Features layout (Wi-Fi, AC, Lockers), Open-Book Testimonial CSS layout, Booking Form, Google Reviews banner.

### Module 2: Noric Cafe Visitor Brochure (`/cafe`)
*   **Focus:** Display-only menu and vibe check.
*   **Constraint:** Strictly NO ordering capability here. Global badges must state: *"Available Exclusively In-Cafe"*.

### Module 3: In-Cafe QR Ordering Portal (`/order/[deskId]`)
*   **Trigger:** Accessed ONLY via scanning physical QR codes placed on Library desks.
*   **Table Locking:** The `deskId` is locked in the URL parameters and cannot be altered by the user.

---

## 5. The Integration Logic: Library ↔ Cafe
*   **Authentication:** Users log into the Cafe portal using their Library `member_id` / Mobile Number + OTP.
*   **The Discount Engine:** If the Supabase `members` table confirms the user is currently ACTIVE, they receive an automatic **10% Flat Discount** with a celebration popup on their first use.

---

## 6. Fortress Security Architecture
To prevent tampering, inspect-element hacks, or external fake orders, the system enforces these strict protocols:

1.  **Server-Side RBAC Only:** Role verification happens entirely on the Supabase backend. Frontend roles are for UI rendering only, never for security clearance.
2.  **Secure Sessions:** Authentication tokens (JWTs) are strictly stored in `HttpOnly` cookies. They cannot be accessed via JavaScript/browser console, neutralizing XSS attacks.
3.  **Mandatory HTTPS:** All traffic is encrypted to prevent local network sniffing.
4.  **IP Whitelisting (Anti-Sharing Rule):** Cafe orders and OTP generations are **REJECTED** unless the network request originates from the Mindspace Library's static Wi-Fi IP address. Members cannot share OTPs to order from home.
5.  **24-Hour Session Expiry:** Cafe portal sessions expire strictly after 24 hours, forcing daily re-authentication to effortlessly verify active library membership status.
6.  **The Operational Fail-Safe:** Cafe staff are instructed via the KDS (Kitchen Display System) to deliver orders **ONLY to the physical study desk**. No counter pickups. This renders any bypassed VPN/remote fake orders useless.

---

## 7. Supabase Database Schema (Core Tables)

**Table: `library_members`**
*   `id` (uuid, PK)
*   `phone` (text, unique)
*   `desk_allocation` (text)
*   `shift_type` (enum: Morning, Evening, Night, Full)
*   `is_active` (boolean) - Toggled by Admin subscription status.

**Table: `cafe_menu`**
*   `id` (uuid, PK)
*   `name` (text), `category` (text), `price` (numeric), `image_url` (text), `is_available` (boolean)

**Table: `cafe_orders`**
*   `id` (uuid, PK)
*   `desk_id` (text)
*   `member_id` (uuid, FK -> library_members.id)
*   `items` (jsonb)
*   `discount_applied` (boolean)
*   `final_amount` (numeric)
*   `status` (enum: pending, preparing, delivered, cancelled)

**Row Level Security (RLS) Policies:**
*   `cafe_menu`: Public (READ ONLY).
*   `cafe_orders`: Authenticated users can `INSERT` (conditional on IP match). Users cannot `READ` others' orders.
*   `library_members`: Users can only `READ` their own data. Service Role (Admin) has full CRUD.