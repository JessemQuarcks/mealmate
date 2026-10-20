import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import Providers from "./Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "Mealmate — Order. Pay. Track. Devour.",
  description: "Discover nearby restaurants, order, pay and track your delivery live.",
};

// Set the theme before paint so there's no flash of the wrong mode.
const themeScript = `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${sora.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* The Google Maps SDK is loaded on demand by APIProvider on the pages
            that need it (map, tracking) — not globally — so it never blocks
            first paint on pages that don't use a map. */}
      </head>
      <body className="font-sans antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Providers>
          <SiteHeader />
          <main id="main" className="min-h-[70vh]">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
