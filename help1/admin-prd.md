# PRODUCT REQUIREMENTS DOCUMENT (PRD) - ADMIN PANEL
**Product:** synchAD Command (NOIRIC ADMIN)
**Ecosystem:** Noric Cafe & Mindspace Library Integration
**Engineered by:** Kryto Studio 
**Tech Stack:** Next.js (App Router), Tailwind CSS, Supabase (Realtime Subscriptions)

---

## 1. System Architecture (The "Fortress" Local Setup)
This module resides entirely within the `(admin)` route group. 
*   **Deployment Strategy:** While initially built in the same cloud monorepo for speed, this UI is designed to be extracted into a standalone desktop application (using Tauri or Electron) running strictly on the Reception/Manager PC at the Ambikapur branch.
*   **Authentication:** Requires elevated Admin credentials (Supabase Service Role/Admin Role). It bypasses the customer-facing `HttpOnly` flow to use direct, persistent staff sessions.

---

## 2. Admin Design System (SaaS UI)
Unlike the Cafe's "Cream & Mocha" theme, the Admin Panel uses a high-contrast, data-dense SaaS aesthetic for operational efficiency.
*   **Background:** Crisp White (`#FFFFFF`) and ultra-light gray (`#F9FAFB`) for canvas.
*   **Primary Text:** Slate/Charcoal (`#1E293B`) for high legibility.
*   **Status Indicators (Crucial):**
    *   🟢 **EMPTY:** Soft Mint Green (`#E8F5E9` text/border, `#4CAF50` indicator).
    *   🟡 **SCANNING:** Soft Amber (`#FFF8E1` text/border, `#FFC107` indicator).
    *   🔴 **OCCUPIED:** Soft Rose (`#FCE4EC` text/border, `#E91E63` indicator).
*   **Action Buttons:** Deep Navy/Midnight Blue (`#0F172A`) for primary actions.

---

## 3. Core Modules (Sidebar Navigation)

1.  **Overview:** High-level dashboard (Daily Revenue, Total Footfall, Active Members).
2.  **Live Seat Matrix:** (Detailed below - The core operational view).
3.  **Kitchen Display (KDS):** Real-time queue of incoming orders with "Pending", "Preparing", and "Ready" lanes.
4.  **Vibe & Jukebox:** Controls for in-cafe ambient music.
5.  **Loyalty & Library:** Direct integration view to verify Mindspace member statuses and manage manual discount overrides.

---

## 4. Deep Dive: Live Seat Matrix (Based on UI Blueprint)

### A. Top Control Bar
*   **Branding:** "synchAD Command | NOIRIC ADMIN" (Left).
*   **Context:** Module Title ("LIVE SEAT MATRIX") & Location ("MG Road, Ambikapur Branch").
*   **Actions & Info:** 
    *   "Simulate Realtime Order" (Dev Tool/Manual Override).
    *   Live Clock (Local Time).
    *   Current User Profile (e.g., "Operator - Shift Lead #1").

### B. Center Canvas: Cafe Interior Floor Map
*   **Visual Layout:** Grid representation of physical tables (T-1 to T-8).
*   **Dynamic Table Cards:** Each card listens to Supabase Realtime and updates instantly.
    *   **Empty State:** Shows table number, capacity, and "READY" text.
    *   **Scanning State (QR engaged):** Shows "QR SCANNING" and a timestamp (e.g., "Just now", "2 mins ago"). Indicates a user has scanned the desk QR but hasn't placed an order yet.
    *   **Occupied State:** Shows Customer Name.
    *   **The "LIBRARY" Badge:** If the user ordering from the desk is authenticated via the Mindspace Library database, a distinct purple "LIBRARY" badge appears on their table card.

### C. Right Panel: Table Details (Contextual Sidebar)
*   **Trigger:** Clicking any Table Card populates this sidebar.
*   **Information Displayed:**
    *   Table Status (e.g., OCCUPIED) & Capacity.
    *   Active Session Data: Customer Name and Type ("Walk-in Guest" vs "Library Member").
    *   **Current Bill Summary:** Line items of ordered food, quantities, and a running Subtotal.
*   **Staff Operations:** Quick action buttons at the bottom (e.g., "+ Add Signature Combo" for manual POS entries).
*   **System Status Footer:** "Database Channel Live" indicator verifying the WebSocket connection is active.

---

## 5. Security & Backend Integration (Admin Context)

### The Anti-Fraud Enforcement
*   **Location Validation:** The Admin panel visually confirms if an order is coming from a Library Desk. The staff physically delivers the food to that specific desk, nullifying any remote ordering hacks.
*   **Realtime Sockets:** The Seat Matrix does NOT rely on manual page refreshes. It uses Supabase's `channel.on('postgres_changes')` to instantly flip a table from Green -> Yellow -> Red the millisecond a database row updates.

### Supabase Admin Schema Rules
*   **Admin Bypass:** While public users cannot `READ` the `orders` table (due to strict RLS), the Admin Panel uses a secure role that can `SELECT * FROM orders` and `UPDATE` statuses.
*   **Cross-Table Joins:** The Admin panel runs joined queries across `cafe_orders`, `cafe_tables`, and `library_members` to accurately render the UI (e.g., matching a `member_id` on an order to display the "LIBRARY" badge on the floor map).