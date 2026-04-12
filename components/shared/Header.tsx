import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            ContractAI
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/contracts"
              className="text-gray-600 hover:text-gray-900"
            >
              Contracts
            </Link>
            <Button variant="secondary" size="sm">
              Sign Out
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
