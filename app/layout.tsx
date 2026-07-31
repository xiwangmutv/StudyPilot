import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader" });
export const metadata: Metadata = { title: "FirstPilot — Your AI Action Guide", description: "帮助你从想开始，走到已经开始。" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${inter.variable} ${newsreader.variable}`}>{children}</body></html>; }
