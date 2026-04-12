"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate, daysUntil, getRiskLevel } from "@/lib/utils";

type Contract = {
  id: string;
  vendor_name: string;
  category: string;
  contract_value: number;
  start_date: string;
  end_date: string;
  auto_renewal_clause: boolean;
  usage_data: { utilization_percentage: number; usage_trend: string }[];
  sentiment: { satisfaction_score: number }[];
  ai_recommendations: { score: number; risk_flags: string[] }[];
};

const categoryColors: Record<string, string> = {
  SaaS: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  "Cloud Infrastructure": "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  "Professional Services": "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  Hardware: "bg-slate-50 text-slate-600 ring-1 ring-slate-200",
};

function ScoreBadge({ score }: { score: number }) {
  const level = getRiskLevel(score);
  const styles = {
    high: "bg-red-50 text-red-700 ring-1 ring-red-100",
    medium: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    low: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${styles[level]}`}>
      {score}
    </span>
  );
}

function RenewalBadge({ endDate, autoRenewal }: { endDate: string; autoRenewal: boolean }) {
  const days = daysUntil(endDate);
  if (days < 0) return <span className="text-xs text-gray-400">Expired</span>;
  if (days <= 60) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        {days}d{autoRenewal ? " · auto" : ""}
      </span>
    );
  }
  if (days <= 180) {
    return <span className="text-xs font-medium text-amber-600">{days}d</span>;
  }
  return <span className="text-xs text-gray-500">{formatDate(endDate)}</span>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [sortField, setSortField] = useState<"score" | "value" | "renewal">("score");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data } = await supabase
        .from("contracts")
        .select("*, usage_data(*), sentiment(*), ai_recommendations(*)");
      setContracts((data as Contract[]) || []);
      setLoading(false);
    };
    init();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const categories = ["All", ...Array.from(new Set(contracts.map((c) => c.category)))];
  const filtered = contracts.filter((c) => categoryFilter === "All" || c.category === categoryFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortField === "score") {
      return (b.ai_recommendations?.[0]?.score ?? 0) - (a.ai_recommendations?.[0]?.score ?? 0);
    }
    if (sortField === "value") return b.contract_value - a.contract_value;
    return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
  });

  const totalValue = contracts.reduce((s, c) => s + c.contract_value, 0);
  const scores = contracts.map((c) => c.ai_recommendations?.[0]?.score).filter((s): s is number => s !== undefined);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
  const highPriority = scores.filter((s) => s >= 65).length;
  const autoRenewing = contracts.filter((c) => c.auto_renewal_clause && daysUntil(c.end_date) <= 90).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900 tracking-tight">ContractAI</span>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/market-intelligence"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Market Intelligence
              </Link>
              <Link href="/contracts/new">
                <button className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Contract
                </button>
              </Link>
              <button
                onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
                className="rounded-md px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Page title */}
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-gray-900">Contract Portfolio</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            {contracts.length} contracts · AI-powered renewal intelligence
          </p>
        </div>

        {/* Stats */}
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Portfolio Value</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{formatCurrency(totalValue)}</p>
            <p className="mt-0.5 text-xs text-gray-400">{contracts.length} active contracts</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">High Priority</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-red-600">{highPriority}</p>
            <p className="mt-0.5 text-xs text-gray-400">Score ≥ 65 — act now</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Avg. Renewal Score</p>
            <p className={`mt-1 text-2xl font-bold tracking-tight ${avgScore >= 65 ? "text-red-600" : avgScore >= 35 ? "text-amber-600" : "text-emerald-600"}`}>
              {avgScore}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">out of 100</p>
          </div>
          <div className={`rounded-lg border px-4 py-3 shadow-sm ${autoRenewing > 0 ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}>
            <p className={`text-xs font-medium ${autoRenewing > 0 ? "text-red-500" : "text-gray-500"}`}>
              Auto-Renewing Soon
            </p>
            <p className={`mt-1 text-2xl font-bold tracking-tight ${autoRenewing > 0 ? "text-red-600" : "text-gray-900"}`}>
              {autoRenewing}
            </p>
            <p className={`mt-0.5 text-xs ${autoRenewing > 0 ? "text-red-400" : "text-gray-400"}`}>within 90 days</p>
          </div>
        </div>

        {/* Table controls */}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Sort</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as "score" | "value" | "renewal")}
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="score">AI Score</option>
              <option value="value">Value</option>
              <option value="renewal">Renewal</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Vendor</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Category</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Value</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500">Utilization</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500">Sentiment</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Renewal</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((contract) => {
                  const score = contract.ai_recommendations?.[0]?.score;
                  const utilization = contract.usage_data?.[0]?.utilization_percentage;
                  const satisfaction = contract.sentiment?.[0]?.satisfaction_score;
                  const level = score !== undefined ? getRiskLevel(score) : null;

                  return (
                    <tr
                      key={contract.id}
                      className="group cursor-pointer hover:bg-blue-50/40 transition-colors"
                      onClick={() => router.push(`/contracts/${contract.id}`)}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                            level === "high" ? "bg-red-500" : level === "medium" ? "bg-amber-400" : level === "low" ? "bg-emerald-500" : "bg-gray-300"
                          }`} />
                          <span className="font-medium text-gray-900 group-hover:text-blue-700 text-sm">
                            {contract.vendor_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${categoryColors[contract.category] ?? "bg-gray-50 text-gray-700 ring-1 ring-gray-200"}`}>
                          {contract.category}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-medium text-gray-800 tabular-nums">
                        {formatCurrency(contract.contract_value)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-1 w-14 rounded-full bg-gray-100">
                            <div
                              className={`h-1 rounded-full ${
                                (utilization ?? 0) >= 80 ? "bg-emerald-500" : (utilization ?? 0) >= 50 ? "bg-amber-400" : "bg-red-500"
                              }`}
                              style={{ width: `${utilization ?? 0}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-xs tabular-nums text-gray-600">{utilization ?? "—"}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-xs font-medium tabular-nums ${
                          (satisfaction ?? 0) >= 80 ? "text-emerald-600" : (satisfaction ?? 0) >= 65 ? "text-amber-600" : "text-red-600"
                        }`}>
                          {satisfaction ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <RenewalBadge endDate={contract.end_date} autoRenewal={contract.auto_renewal_clause} />
                      </td>
                      <td className="px-4 py-2.5">
                        {score !== undefined ? (
                          <ScoreBadge score={score} />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="mb-2 h-8 w-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-500">No contracts in this category</p>
            </div>
          )}
        </div>

        {/* Risk pipeline */}
        {scores.length > 0 && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Renewal Risk Pipeline</h2>
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {sorted
                .filter((c) => c.ai_recommendations?.[0]?.score !== undefined)
                .sort((a, b) => (b.ai_recommendations?.[0]?.score ?? 0) - (a.ai_recommendations?.[0]?.score ?? 0))
                .slice(0, 10)
                .map((c) => {
                  const s = c.ai_recommendations[0].score;
                  const lv = getRiskLevel(s);
                  return (
                    <Link key={c.id} href={`/contracts/${c.id}`}>
                      <div className={`min-w-[96px] cursor-pointer rounded-md border px-3 py-2.5 transition-all hover:shadow-sm ${
                        lv === "high" ? "border-red-100 bg-red-50" : lv === "medium" ? "border-amber-100 bg-amber-50" : "border-emerald-100 bg-emerald-50"
                      }`}>
                        <p className="truncate text-xs font-medium text-gray-700">{c.vendor_name}</p>
                        <p className={`mt-0.5 text-xl font-bold tabular-nums leading-none ${
                          lv === "high" ? "text-red-600" : lv === "medium" ? "text-amber-600" : "text-emerald-600"
                        }`}>{s}</p>
                        <p className="mt-0.5 text-xs text-gray-400">{c.category.split(" ")[0]}</p>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
