import Link from "next/link";

interface HeaderProps {
  onSignOut?: () => void;
  showNav?: boolean;
}

export function Header({ onSignOut, showNav = true }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 bg-white"
      style={{ boxShadow: "rgba(0,0,0,0.08) 0px -1px 0px 0px inset" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-0">
        <div className="flex h-12 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <svg className="h-5 w-5 text-[#171717]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[14px] font-semibold text-[#171717] tracking-[-0.01em]">ContractAI</span>
          </Link>

          {showNav && (
            <nav className="flex items-center gap-1">
              <Link
                href="/market-intelligence"
                className="flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[13px] font-medium text-[#4d4d4d] hover:bg-[#fafafa] hover:text-[#171717] transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Market
              </Link>

              <Link
                href="/contracts/new"
                className="flex items-center gap-1.5 rounded-[6px] bg-[#171717] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#2a2a2a] transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Contract
              </Link>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="rounded-[6px] px-3 py-1.5 text-[13px] font-medium text-[#666666] hover:bg-[#fafafa] hover:text-[#171717] transition-colors"
                >
                  Sign out
                </button>
              )}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
