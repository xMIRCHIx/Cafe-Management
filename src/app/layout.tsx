import type { Metadata } from "next";
import { Outfit, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Noiric Cafe | Premium Coffee & Gourmet Pizza in Ambikapur",
  description: "Experience the premium coffee, wood-fired style pizzas, gourmet burgers, and cozy vibes at Noiric Cafe on MG Road, Ambikapur. Good Food, Good Mood, Good Times.",
  keywords: "Noiric Cafe, Cafe in Ambikapur, Coffee Ambikapur, Pizza Ambikapur, MG Road Cafe, Gourmet Burger Ambikapur, Premium Cafe near Goyal Super Mart",
  openGraph: {
    title: "Noiric Cafe | Premium Coffee & Gourmet Pizza in Ambikapur",
    description: "Experience the premium coffee, wood-fired style pizzas, gourmet burgers, and cozy vibes at Noiric Cafe on MG Road, Ambikapur.",
    type: "website",
    locale: "en_IN",
    siteName: "Noiric Cafe",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${playfair.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-coffee-950 font-sans">
        {children}
      </body>
    </html>
  );
}

