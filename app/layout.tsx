import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader" });
export const metadata: Metadata = { title: "StudyPilot — Your calm place to begin", description: "A gentle way to begin your study session." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${inter.variable} ${newsreader.variable}`}>{children}</body></html>; }
