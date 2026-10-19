"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExpenseDialog } from "@/hooks/useExpenseDialog";
import SyncCenter from "@/components/cloud/SyncCenter";

const LINKS: Array<{ href: string; label: string; short?: string }> = [
  { href: "/", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
  { href: "/export", label: "Share & Export", short: "Share" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { openAdd } = useExpenseDialog();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-sm">
              $
            </span>
            <span className="hidden text-base font-semibold tracking-tight text-slate-900 sm:inline">Spendwise</span>
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-2 py-2 text-sm font-medium transition sm:px-3 ${
                    active ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {link.short ? (
                    <>
                      <span className="hidden sm:inline">{link.label}</span>
                      <span className="sm:hidden">{link.short}</span>
                    </>
                  ) : (
                    link.label
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <SyncCenter />
          <button type="button" onClick={openAdd} aria-label="Add expense" className="btn-primary px-2.5 sm:px-4">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            <span className="hidden sm:inline">Add expense</span>
          </button>
        </div>
      </div>
    </header>
  );
}
