# NOIRIC CAFE - 3D Cinematic Scroll Experience
**Theme:** Premium, Dark Vibes, Rich Flavours, Japanese Minimalist (月光/Moonlight)
**Core Tech:** Next.js (App Router), Tailwind CSS, Framer Motion (useScroll, useTransform)

## 1. The Core Concept (Hybrid 2.5D Scroll)
Instead of relying on a single, messy AI video for complex camera movements, we are using a "Hybrid System". We will use a sequence of background frames for a smooth dolly-in zoom, combined with transparent high-res PNG layers animated via Framer Motion to create a flawless Apple-style parallax experience.

## 2. Asset Inventory
✅ **Ready:**
* Noiric Cafe Logo (Gold/Black)
* Hero Element: Premium takeaway paper coffee cup with black ribbed lid (3 Angles: Center, Left Tilt, Right Tilt).
* Parallax Elements: High-res floating espresso beans.
* Parallax Elements: High-res floating basil leaves.
* Background Colors: Deep Espresso `#2B2523`, Warm Cream `#EADACF`.

⏳ **Pending:**
* Background Sequence: A 16:9 static/slow-zoom frame sequence of the cafe interior.

## 3. The 3-Phase Scroll Architecture

### PHASE 1: The Grand Entrance (0% - 30% Scroll)
* **Visual:** The user lands on the page. The background is a premium cafe interior. Centered large Serif text: "NOIRIC CAFE".
* **Action:** As the user scrolls, the background image/video slowly zooms in (scale increases). The "NOIRIC CAFE" title moves up slightly and fades to 0% opacity. The background smoothly transitions into a Gaussian blur.

### PHASE 2: The Hero Reveal & Story (30% - 60% Scroll)
* **Visual:** The background is now blurred. 
* **Action:** The Hero Coffee Cup slides up from the bottom of the screen (`y: 100vh` to `y: 0`). 
* As scrolling continues, the cup rotates slightly and translates to the Right (`x: 25vw`).
* Simultaneously, the floating beans and basil leaves enter the screen at different Z-index layers and scroll speeds (Parallax depth).
* On the Left side, the text "About Us" and "Dark Vibes. Rich Flavours." fades in.

### PHASE 3: The Deep Dive to Menu (60% - 100% Scroll)
* **Visual:** Transitioning from the cinematic intro to the functional Digital Menu.
* **Action:** The "About Us" text and Coffee Cup fade out.
* The entire blurred background scales up massively (zooming past the environment) and fades into a solid `#EADACF` (Cream) or `#2B2523` (Dark Espresso) background.
* The interactive, coded Next.js "Digital Menu" (Grid layout with Order buttons) slides up smoothly to take over the screen.