"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAV = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Benchmarking",
    href: "/benchmarking",
    icon: (
      <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: "Market Intelligence",
    href: "/market-intelligence",
    icon: (
      <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className="hidden md:flex w-[220px] flex-shrink-0 flex-col bg-white"
        style={{ boxShadow: "rgba(0,0,0,0.08) 1px 0px 0px 0px" }}
      >
        {/* Logo */}
        <div
          className="flex h-12 flex-shrink-0 items-center gap-2 px-4"
          style={{ boxShadow: "rgba(0,0,0,0.06) 0px -1px 0px 0px inset" }}
        >
          <svg className="h-5 w-5 text-[#171717]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[14px] font-semibold text-[#171717] tracking-[-0.01em]">ContractAI</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 pt-3 space-y-0.5">
          {NAV.map(({ label, href, icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-[#fafafa] text-[#171717]"
                    : "text-[#666666] hover:bg-[#fafafa] hover:text-[#171717]"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full bg-[#171717]" />
                )}
                {icon}
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 space-y-0.5" style={{ boxShadow: "rgba(0,0,0,0.06) 0px 1px 0px 0px inset" }}>
          <Link
            href="/contracts/new"
            className={`relative flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[13px] font-medium transition-colors ${
              pathname === "/contracts/new"
                ? "bg-[#fafafa] text-[#171717]"
                : "text-[#666666] hover:bg-[#fafafa] hover:text-[#171717]"
            }`}
          >
            {pathname === "/contracts/new" && (
              <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full bg-[#171717]" />
            )}
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v16m8-8H4" />
            </svg>
            Add Contract
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-[6px] px-3 py-2 text-[13px] font-medium text-[#808080] hover:bg-[#fafafa] hover:text-[#171717] transition-colors"
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>

      </aside>

      {/* ── Mobile top bar (hidden on md+) ──────────────── */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between bg-white px-4 md:hidden"
        style={{ boxShadow: "rgba(0,0,0,0.08) 0px -1px 0px 0px inset" }}>
        <Link href="/" className="flex items-center gap-2">
          <svg className="h-5 w-5 text-[#171717]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[14px] font-semibold text-[#171717]">ContractAI</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/benchmarking" className="rounded-[6px] px-2.5 py-1.5 text-[12px] text-[#666666] hover:bg-[#fafafa]">Benchmarks</Link>
          <Link href="/market-intelligence" className="rounded-[6px] px-2.5 py-1.5 text-[12px] text-[#666666] hover:bg-[#fafafa]">Market</Link>
          <Link href="/contracts/new" className="rounded-[6px] bg-[#171717] px-2.5 py-1.5 text-[12px] text-white">+ Add</Link>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col md:pt-0 pt-12">
        {children}
      </div>
    </div>
  );
}
