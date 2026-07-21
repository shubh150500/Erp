import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Triple Entente — Study Hard, Result Best",
    template: "%s · Triple Entente",
  },
  description:
    "Triple Entente coaching institute — Foundation (Class 8–10) and Class 11–12. Expert faculty, disciplined mentoring, and proven results.",
  keywords: [
    "Triple Entente",
    "coaching institute",
    "Foundation classes",
    "Class 11 12 coaching",
    "tuition",
  ],
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-ivory text-navy-700">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
