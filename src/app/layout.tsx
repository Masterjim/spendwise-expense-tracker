import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import StorageWarning from "@/components/StorageWarning";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Spendwise — Expense Tracker", template: "%s · Spendwise" },
  description: "Track, filter and analyze your personal expenses.",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <StorageWarning />
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
