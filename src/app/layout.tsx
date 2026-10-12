import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import HeaderTop from "@/components/HeaderTop";
import HeaderMain from "@/components/HeaderMain";
import Navbar from "@/components/Navbar";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import MobNavbar from "@/components/MobNavbar";
import Footer from "@/components/Footer";
import Providers from "./Providers";




    
 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MealMate",
  description: "Discover nearby restaurants, order, pay and track delivery.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
 


  return (
    <html lang="en">
      <head>

      <script async
            src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&loading=async`}>
       </script>
      </head>
      <body className={inter.className}>
        <Providers>
          <HeaderTop />
          <MobNavbar />
          <HeaderMain />
          <Navbar />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
