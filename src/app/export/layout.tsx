import type { Metadata } from "next";

export const metadata: Metadata = { title: "Share & Export" };

export default function ExportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
