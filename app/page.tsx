"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate, daysUntil, getRiskLevel } from "@/lib/utils";
import { AppShell } from "@/components/shared/AppShell";

type Contract = {
  id: string;
  vendor_name: string;
  category: string;
  contract_value: number;
  start_date: string;
  end_date: string;
  auto_renewal_clause: boolean;
  usage_data: { utilization_percentage: number; usage_trend: string }[];
  market_analysis: { price_index: number }[];
  sentiment: { satisfaction_score: number }[];
  ai_recommendations: { score: number; risk_flags: string[] }[];
};

// Vercel-style muted category pills
const categoryPills: Record<string, string> = {
  SaaS:                   "bg-[#ebf5ff] text-[#0068d6]",
  "Cloud Infrastructure": "bg-[#f5f0ff] text-[#6d28d9]",
  Security:               "bg-[#fff7ed] text-[#c2410c]",
  DevTools:               "bg-[#f0fdf4] text-[#15803d]",
};

function ScorePill({ score }: { score: number }) {
  const level = getRiskLevel(score);
  const styles = {
    high:   "bg-[#fef2f2] text-[#dc2626]",
    medium: "bg-[#fffbeb] text-[#b45309]",
    low:    "bg-[#f0fdf4] text-[#16a34a]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums font-mono ${styles[level]}`}>
      {score}
    </span>
  );
}

function RenewalStatus({ endDate, autoRenewal }: { endDate: string; autoRenewal: boolean }) {
  const days = daysUntil(endDate);
  if (days < 0) return <span className="text-[11px] text-[#808080]">Expired</span>;
  if (days <= 60) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#dc2626]">
        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#dc2626] animate-pulse" />
        {days}d{autoRenewal ? " · auto" : ""}
      </span>
    );
  }
  if (days <= 180) {
    return <span className="text-[11px] font-medium text-[#b45309]">{days}d</span>;
  }
  return <span className="text-[11px] text-[#666666]">{formatDate(endDate)}</span>;
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
        .select("*, usage_data(*), market_analysis(*), sentiment(*), ai_recommendations(*)");
      setContracts((data as Contract[]) || []);
      setLoading(false);
    };
    init();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#171717] border-t-transparent" />
      </div>
    );
  }

  const categories = ["All", ...Array.from(new Set(contracts.map((c) => c.category)))];
  const filtered = contracts.filter((c) => categoryFilter === "All" || c.category === categoryFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortField === "score") return (b.ai_recommendations?.[0]?.score ?? 0) - (a.ai_recommendations?.[0]?.score ?? 0);
    if (sortField === "value") return b.contract_value - a.contract_value;
    return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
  });

  const totalValue = contracts.reduce((s, c) => s + c.contract_value, 0);
  const scores = contracts.map((c) => c.ai_recommendations?.[0]?.score).filter((s): s is number => s !== undefined);
  const highPriority = scores.filter((s) => s >= 65).length;
  const autoRenewing = contracts.filter((c) => c.auto_renewal_clause && daysUntil(c.end_date) <= 90).length;

  const savingsContracts = contracts
    .filter((c) => (c.ai_recommendations?.[0]?.score ?? 0) >= 55 && (c.market_analysis?.[0]?.price_index ?? 0) > 0)
    .sort((a, b) => (b.ai_recommendations?.[0]?.score ?? 0) - (a.ai_recommendations?.[0]?.score ?? 0))
    .slice(0, 4);
  const estimatedSavings = savingsContracts.reduce((sum, c) => {
    return sum + c.contract_value * ((c.market_analysis?.[0]?.price_index ?? 0) / 100);
  }, 0);

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold text-[#171717] tracking-[-0.5px]">Contract Portfolio</h1>
          <p className="mt-1 text-[13px] text-[#666666]">
            {contracts.length} contracts · AI-powered renewal intelligence
          </p>
        </div>

        {/* Stats — shadow-card technique, no CSS border */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="shadow-card rounded-lg bg-white px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#808080]">Portfolio Value</p>
            <p className="mt-2 text-[26px] font-semibold tracking-[-1px] text-[#171717] leading-none">{formatCurrency(totalValue)}</p>
            <p className="mt-1.5 text-[11px] text-[#808080]">{contracts.length} contracts</p>
          </div>

          <div className={`shadow-card rounded-lg px-4 py-4 ${estimatedSavings > 0 ? "bg-[#f0fdf4]" : "bg-white"}`}>
            <p className={`text-[11px] font-medium uppercase tracking-wide ${estimatedSavings > 0 ? "text-[#15803d]" : "text-[#808080]"}`}>
              Savings Opportunity
            </p>
            <p className={`mt-2 text-[26px] font-semibold tracking-[-1px] leading-none ${estimatedSavings > 0 ? "text-[#15803d]" : "text-[#171717]"}`}>
              {formatCurrency(estimatedSavings)}
            </p>
            <p className={`mt-1.5 text-[11px] ${estimatedSavings > 0 ? "text-[#16a34a]" : "text-[#808080]"}`}>
              top {savingsContracts.length} above-market
            </p>
          </div>

          <div className="shadow-card rounded-lg bg-white px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#808080]">High Priority</p>
            <p className="mt-2 text-[26px] font-semibold tracking-[-1px] leading-none text-[#dc2626]">{highPriority}</p>
            <p className="mt-1.5 text-[11px] text-[#808080]">score ≥ 65 · act now</p>
          </div>

          <div className={`shadow-card rounded-lg px-4 py-4 ${autoRenewing > 0 ? "bg-[#fffbeb]" : "bg-white"}`}>
            <p className={`text-[11px] font-medium uppercase tracking-wide ${autoRenewing > 0 ? "text-[#92400e]" : "text-[#808080]"}`}>
              Auto-Renewing Soon
            </p>
            <p className={`mt-2 text-[26px] font-semibold tracking-[-1px] leading-none ${autoRenewing > 0 ? "text-[#b45309]" : "text-[#171717]"}`}>
              {autoRenewing}
            </p>
            <p className={`mt-1.5 text-[11px] ${autoRenewing > 0 ? "text-[#b45309]" : "text-[#808080]"}`}>within 90 days</p>
          </div>
        </div>

        {/* Renewal Risk Pipeline */}
        {scores.length > 0 && (
          <div className="mb-4 shadow-card overflow-hidden rounded-lg bg-white">
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ boxShadow: "rgba(0,0,0,0.06) 0px -1px 0px 0px inset" }}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-[12px] font-semibold text-[#171717] tracking-tight">Renewal Risk Pipeline</h2>
                {highPriority > 0 && (
                  <span className="rounded-full bg-[#fef2f2] px-2 py-0.5 text-[10px] font-semibold text-[#dc2626]">
                    {highPriority} urgent
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#808080] font-mono">sorted by AI score</span>
            </div>
            <div className="flex gap-2 overflow-x-auto px-4 py-3">
              {[...contracts]
                .filter((c) => c.ai_recommendations?.[0]?.score !== undefined)
                .sort((a, b) => (b.ai_recommendations?.[0]?.score ?? 0) - (a.ai_recommendations?.[0]?.score ?? 0))
                .slice(0, 12)
                .map((c) => {
                  const s = c.ai_recommendations[0].score;
                  const lv = getRiskLevel(s);
                  const days = daysUntil(c.end_date);
                  const cardBg = lv === "high" ? "bg-[#fef2f2]" : lv === "medium" ? "bg-[#fffbeb]" : "bg-[#f0fdf4]";
                  const scoreColor = lv === "high" ? "text-[#dc2626]" : lv === "medium" ? "text-[#b45309]" : "text-[#16a34a]";
                  return (
                    <Link key={c.id} href={`/contracts/${c.id}`} className="flex-shrink-0">
                      <div className={`w-[108px] cursor-pointer rounded-lg ${cardBg} shadow-border px-3 py-2.5 transition-all hover:shadow-card`}>
                        <p className="truncate text-[11px] font-semibold text-[#171717]">{c.vendor_name}</p>
                        <p className={`mt-1 text-[22px] font-semibold tabular-nums leading-none font-mono tracking-tight ${scoreColor}`}>{s}</p>
                        <p className="mt-1.5 text-[10px] text-[#808080]">
                          {days < 0 ? "Expired" : days <= 90 ? `${days}d left` : c.category.split(" ")[0]}
                        </p>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                  categoryFilter === cat
                    ? "bg-[#171717] text-white"
                    : "text-[#4d4d4d] shadow-border-light hover:bg-[#fafafa] hover:text-[#171717]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#808080]">Sort by</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as "score" | "value" | "renewal")}
              className="rounded-[6px] bg-white px-2.5 py-1 text-[12px] text-[#171717] shadow-border focus:outline-none"
            >
              <option value="score">AI Score</option>
              <option value="value">Value</option>
              <option value="renewal">Renewal</option>
            </select>
          </div>
        </div>

        {/* Contracts table */}
        <div className="shadow-card overflow-hidden rounded-lg bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ boxShadow: "rgba(0,0,0,0.06) 0px -1px 0px 0px inset" }}>
                  <th className="bg-[#fafafa] px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-[#808080]">Vendor</th>
                  <th className="bg-[#fafafa] px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-[#808080]">Category</th>
                  <th className="bg-[#fafafa] px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-[#808080]">Value</th>
                  <th className="bg-[#fafafa] px-4 py-2.5 text-center text-[11px] font-medium uppercase tracking-wide text-[#808080]">Utilization</th>
                  <th className="bg-[#fafafa] px-4 py-2.5 text-center text-[11px] font-medium uppercase tracking-wide text-[#808080]">Sentiment</th>
                  <th className="bg-[#fafafa] px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-[#808080]">Renewal</th>
                  <th className="bg-[#fafafa] px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-[#808080]">Score</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((contract, idx) => {
                  const score = contract.ai_recommendations?.[0]?.score;
                  const utilization = contract.usage_data?.[0]?.utilization_percentage;
                  const satisfaction = contract.sentiment?.[0]?.satisfaction_score;
                  const level = score !== undefined ? getRiskLevel(score) : null;

                  return (
                    <tr
                      key={contract.id}
                      className="group cursor-pointer hover:bg-[#fafafa] transition-colors"
                      style={idx < sorted.length - 1 ? { boxShadow: "rgba(0,0,0,0.06) 0px -1px 0px 0px inset" } : undefined}
                      onClick={() => router.push(`/contracts/${contract.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                            level === "high" ? "bg-[#dc2626]" : level === "medium" ? "bg-[#f59e0b]" : level === "low" ? "bg-[#16a34a]" : "bg-[#d1d5db]"
                          }`} />
                          <span className="text-[13px] font-medium text-[#171717] group-hover:text-[#0072f5] transition-colors">
                            {contract.vendor_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ${categoryPills[contract.category] ?? "bg-[#f5f5f5] text-[#4d4d4d]"}`}>
                          {contract.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-medium text-[#171717] tabular-nums font-mono">
                        {formatCurrency(contract.contract_value)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-1 w-14 rounded-full bg-[#ebebeb]">
                            <div
                              className={`h-1 rounded-full ${
                                (utilization ?? 0) >= 80 ? "bg-[#16a34a]" : (utilization ?? 0) >= 50 ? "bg-[#f59e0b]" : "bg-[#dc2626]"
                              }`}
                              style={{ width: `${utilization ?? 0}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-[11px] tabular-nums text-[#666666] font-mono">{utilization ?? "—"}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[12px] font-medium tabular-nums font-mono ${
                          (satisfaction ?? 0) >= 80 ? "text-[#16a34a]" : (satisfaction ?? 0) >= 65 ? "text-[#b45309]" : "text-[#dc2626]"
                        }`}>
                          {satisfaction ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <RenewalStatus endDate={contract.end_date} autoRenewal={contract.auto_renewal_clause} />
                      </td>
                      <td className="px-4 py-3">
                        {score !== undefined ? <ScorePill score={score} /> : <span className="text-[11px] text-[#808080]">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 h-10 w-10 rounded-lg bg-[#fafafa] flex items-center justify-center shadow-border">
                <svg className="h-5 w-5 text-[#808080]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-[13px] text-[#666666]">No contracts in this category</p>
            </div>
          )}
        </div>

      </main>
    </AppShell>
  );
}
