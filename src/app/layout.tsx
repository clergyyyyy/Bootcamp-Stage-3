import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";

/* ========== Google Fonts ========== */
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-poppins",
});

/* ========== SEO / Metadata ========== */
export const metadata: Metadata = {
  title: "FanLink – Discover Your Fandom",
  description: "Connect with your favorite fandoms.",
};

/* ========== Root Layout ========== */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
