"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";

interface BenchmarkRow {
  contractId: string;
  vendorName: string;
  category: string;
  contractValue: number;
  annualValue?: number;
  termMonths?: number;
  unitType?: string;
  contractUnitRate?: number;
  marketRates?: { low: number; median: number; high: number };
  percentile?: number;
  annualOverspend?: number;
  totalTermOverspend?: number;
  negotiationTarget?: number;
  targetSavingsAnnual?: number;
  insight?: string;
  confidence?: "high" | "medium" | "low";
  benchmarked: boolean;
  cachedAt?: string;
}

type StatusFilter = "all" | "overpaying" | "near_market" | "great_rate";

function getStatus(percentile: number): { label: string; color: string; bg: string; dot: string } {
  if (percentile >= 65) return { label: "Overpaying",   color: "#dc2626", bg: "#fef2f2", dot: "#dc2626" };
  if (percentile >= 40) return { label: "Near Market",  color: "#d97706", bg: "#fffbeb", dot: "#d97706" };
  return                       { label: "Great Rate",   color: "#16a34a", bg: "#f0fdf4", dot: "#16a34a" };
}

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function MiniPercentileBar({ percentile }: { percentile: number }) {
  const { color } = getStatus(percentile);
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-16 rounded-full bg-gradient-to-r from-[#dcfce7] via-[#fef9c3] to-[#fee2e2]">
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-white shadow-sm"
          style={{ left: `calc(${percentile}% - 6px)`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-mono font-semibold tabular-nums" style={{ color }}>
        {percentile}th
      </span>
    </div>
  );
}

function SummaryCards({ rows }: { rows: BenchmarkRow[] }) {
  const benchmarked = rows.filter((r) => r.benchmarked && r.percentile != null);
  const overpaying = benchmarked.filter((r) => r.percentile! >= 65);
  const greatRate  = benchmarked.filter((r) => r.percentile! < 40);
  const totalOverspend = benchmarked.reduce((sum, r) => sum + (r.annualOverspend ?? 0), 0);
  const totalOpportunity = benchmarked.reduce((sum, r) => sum + (r.targetSavingsAnnual ?? 0), 0);

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {[
        {
          label: "Overpaying",
          value: overpaying.length,
          sub: `of ${benchmarked.length} contracts`,
          color: "#dc2626",
          bg: "#fef2f2",
        },
        {
          label: "Great Rate",
          value: greatRate.length,
          sub: `of ${benchmarked.length} contracts`,
          color: "#16a34a",
          bg: "#f0fdf4",
        },
        {
          label: "Est. Annual Overspend",
          value: fmt(totalOverspend > 0 ? totalOverspend : 0),
          sub: "vs market median",
          color: totalOverspend > 0 ? "#dc2626" : "#16a34a",
          bg: totalOverspend > 0 ? "#fef2f2" : "#f0fdf4",
        },
        {
          label: "Savings Opportunity",
          value: fmt(totalOpportunity),
          sub: "if renegotiated",
          color: "#0068d6",
          bg: "#ebf5ff",
        },
      ].map(({ label, value, sub, color, bg }) => (
        <div key={label} className="shadow-card rounded-lg bg-white px-4 py-3.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#808080] mb-1">{label}</p>
          <p className="text-[22px] font-semibold tracking-tight leading-none" style={{ color }}>
            {value}
          </p>
          <p className="text-[10px] text-[#808080] mt-1">{sub}</p>
        </div>
      ))}
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  "Cloud Infrastructure": "bg-[#f5f0ff] text-[#6d28d9]",
  "Security":             "bg-[#fff7ed] text-[#c2410c]",
  "DevTools":             "bg-[#f0fdf4] text-[#15803d]",
  "SaaS":                 "bg-[#ebf5ff] text-[#0068d6]",
};

function VendorRow({ row }: { row: BenchmarkRow }) {
  if (!row.benchmarked || row.percentile == null) {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f5f5f5] last:border-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 flex-shrink-0 rounded-[6px] bg-[#f5f5f5] flex items-center justify-center">
            <span className="text-[11px] font-semibold text-[#808080]">
              {row.vendorName.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[#171717] truncate">{row.vendorName}</p>
            <p className="text-[11px] text-[#808080]">{fmt(row.contractValue)} contract</p>
          </div>
        </div>
        <span className="text-[11px] text-[#808080]">Not benchmarked</span>
      </div>
    );
  }

  const { label, color, bg } = getStatus(row.percentile);
  const isOver = (row.annualOverspend ?? 0) > 0;

  return (
    <Link
      href={`/contracts/${row.contractId}?tab=benchmark`}
      className="flex items-center gap-4 px-4 py-3 border-b border-[#f5f5f5] last:border-0 hover:bg-[#fafafa] transition-colors group"
    >
      {/* Avatar */}
      <div
        className="h-8 w-8 flex-shrink-0 rounded-[6px] flex items-center justify-center text-[11px] font-semibold"
        style={{ backgroundColor: bg, color }}
      >
        {row.vendorName.slice(0, 2).toUpperCase()}
      </div>

      {/* Vendor + category */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-[#171717] truncate group-hover:text-[#0068d6] transition-colors">
            {row.vendorName}
          </p>
          <span className={`hidden sm:inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${CATEGORY_COLORS[row.category] ?? "bg-[#f5f5f5] text-[#4d4d4d]"}`}>
            {row.category}
          </span>
        </div>
        <p className="text-[11px] text-[#808080] mt-0.5 truncate">{row.unitType}</p>
      </div>

      {/* Contract value */}
      <div className="hidden sm:block text-right w-24 flex-shrink-0">
        <p className="text-[12px] font-semibold text-[#171717]">{fmt(row.contractValue)}</p>
        <p className="text-[10px] text-[#808080]">{row.termMonths}mo term</p>
      </div>

      {/* Percentile bar */}
      <div className="hidden md:block w-28 flex-shrink-0">
        <MiniPercentileBar percentile={row.percentile} />
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0 w-28 text-right">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ backgroundColor: bg, color }}
        >
          <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          {label}
        </span>
      </div>

      {/* Overspend */}
      <div className="hidden lg:block text-right w-28 flex-shrink-0">
        <p className="text-[12px] font-semibold" style={{ color: isOver ? "#dc2626" : "#16a34a" }}>
          {isOver ? "+" : "-"}{fmt(Math.abs(row.annualOverspend ?? 0))}
        </p>
        <p className="text-[10px] text-[#808080]">per year</p>
      </div>

      {/* Arrow */}
      <svg className="h-3.5 w-3.5 flex-shrink-0 text-[#d1d5db] group-hover:text-[#808080] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default function BenchmarkingPage() {
  const [rows, setRows] = useState<BenchmarkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<"overspend" | "percentile" | "value">("overspend");

  const load = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const url = refresh ? "/api/benchmarking?refresh=true" : "/api/benchmarking";
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setRows(Array.isArray(json) ? json : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = rows.filter((r) => r.benchmarked && r.percentile != null);
    if (filter === "overpaying")  list = list.filter((r) => r.percentile! >= 65);
    if (filter === "near_market") list = list.filter((r) => r.percentile! >= 40 && r.percentile! < 65);
    if (filter === "great_rate")  list = list.filter((r) => r.percentile! < 40);

    return list.sort((a, b) => {
      if (sort === "overspend")  return (b.annualOverspend ?? 0) - (a.annualOverspend ?? 0);
      if (sort === "percentile") return (b.percentile ?? 0) - (a.percentile ?? 0);
      if (sort === "value")      return (b.contractValue ?? 0) - (a.contractValue ?? 0);
      return 0;
    });
  }, [rows, filter, sort]);

  const unbenchmarked = rows.filter((r) => !r.benchmarked);

  return (
    <AppShell>
      {/* Top bar */}
      <div
        className="flex h-12 flex-shrink-0 items-center justify-between px-6 bg-white"
        style={{ boxShadow: "rgba(0,0,0,0.06) 0px -1px 0px 0px inset" }}
      >
        <h1 className="text-[14px] font-semibold text-[#171717] tracking-[-0.3px]">Rate Benchmarking</h1>
        <button
          onClick={() => load(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-medium text-[#4d4d4d] hover:bg-[#fafafa] disabled:opacity-40 transition-colors"
          style={{ boxShadow: "rgb(235,235,235) 0px 0px 0px 1px" }}
        >
          <svg className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? "Refreshing…" : "Refresh All"}
        </button>
      </div>

      <main className="mx-auto max-w-5xl w-full px-6 py-6 space-y-4">

        {loading ? (
          <div className="shadow-card rounded-lg bg-white p-16 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#171717] border-t-transparent" />
            <p className="text-[14px] font-semibold text-[#171717]">Benchmarking your portfolio…</p>
            <p className="mt-1 text-[12px] text-[#808080]">Comparing unit rates against market data for all contracts</p>
          </div>
        ) : error ? (
          <div className="shadow-card rounded-lg bg-[#fef2f2] p-5 text-center">
            <p className="text-[13px] font-semibold text-[#dc2626]">{error}</p>
            <button onClick={() => load()} className="mt-2 text-[12px] text-[#0072f5] underline">Retry</button>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <SummaryCards rows={rows} />

            {/* Filters + sort */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1">
                {([
                  { id: "all",         label: "All" },
                  { id: "overpaying",  label: "Overpaying" },
                  { id: "near_market", label: "Near Market" },
                  { id: "great_rate",  label: "Great Rate" },
                ] as { id: StatusFilter; label: string }[]).map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setFilter(id)}
                    className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                      filter === id
                        ? "bg-[#171717] text-white"
                        : "bg-[#f5f5f5] text-[#666666] hover:bg-[#ebebeb]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#808080]">Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="rounded-[6px] bg-white px-2.5 py-1.5 text-[12px] text-[#171717] focus:outline-none"
                  style={{ boxShadow: "rgb(235,235,235) 0px 0px 0px 1px" }}
                >
                  <option value="overspend">Annual overspend</option>
                  <option value="percentile">Market percentile</option>
                  <option value="value">Contract value</option>
                </select>
              </div>
            </div>

            {/* Vendor table */}
            <div className="shadow-card rounded-lg bg-white overflow-hidden">
              {/* Table header */}
              <div className="hidden lg:grid grid-cols-[1fr_96px_112px_112px_112px_16px] gap-4 px-4 py-2.5 border-b border-[#f5f5f5]">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#808080]">Vendor</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#808080] text-right">Value</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#808080]">Percentile</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#808080] text-right">Status</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#808080] text-right">Annual ±</span>
                <span />
              </div>

              {filtered.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-[13px] text-[#808080]">No contracts match this filter.</p>
                </div>
              ) : (
                filtered.map((row) => <VendorRow key={row.contractId} row={row} />)
              )}
            </div>

            {/* Unbenchmarked contracts */}
            {unbenchmarked.length > 0 && (
              <div className="shadow-card rounded-lg bg-white overflow-hidden">
                <div className="px-4 py-3" style={{ boxShadow: "rgba(0,0,0,0.06) 0px -1px 0px 0px inset" }}>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#808080]">
                    Pending Benchmark ({unbenchmarked.length})
                  </span>
                </div>
                {unbenchmarked.map((row) => <VendorRow key={row.contractId} row={row} />)}
              </div>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}
