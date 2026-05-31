import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ajo / Esusu — Decentralized Rotating Savings",
  description: "A trustless rotating savings protocol on Ritual Chain, by Hemisphere",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="bg-navy-900 text-white font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
