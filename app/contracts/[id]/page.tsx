"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, daysUntil, getRiskLevel } from "@/lib/utils";
import { MarketIntelligencePanel } from "@/components/market-intelligence/MarketIntelligencePanel";
import { RateBenchmarkPanel } from "@/components/contracts/RateBenchmarkPanel";
import { AppShell } from "@/components/shared/AppShell";

type ContractDetail = {
  id: string;
  vendor_name: string;
  category: string;
  contract_value: number;
  start_date: string;
  end_date: string;
  payment_terms: string;
  auto_renewal_clause: boolean;
  key_obligations: string;
  usage_data: { utilization_percentage: number; usage_trend: string }[];
  market_analysis: { market_rate_comparison: string; vendor_financial_health: string; price_index: number }[];
  sentiment: { satisfaction_score: number; stakeholder_comments: string }[];
  ai_recommendations: { score: number; narrative: string; risk_flags: string[] }[];
};

function ScoreGauge({ score }: { score: number }) {
  const level = getRiskLevel(score);
  const colors = { high: "#dc2626", medium: "#d97706", low: "#16a34a" };
  const labels = { high: "High Priority", medium: "Monitor", low: "Healthy" };
  const color = colors[level];
  const circumference = 2 * Math.PI * 40;
  const strokeDash = (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r="40" fill="none" stroke="#ebebeb" strokeWidth="7" />
          <circle
            cx="45" cy="45" r="40" fill="none"
            stroke={color} strokeWidth="7"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[22px] font-semibold leading-none font-mono tracking-tight" style={{ color }}>{score}</span>
          <span className="text-[10px] text-[#808080] font-mono">/100</span>
        </div>
      </div>
      <span className="text-[11px] font-semibold font-mono" style={{ color }}>{labels[level]}</span>
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex">
      <svg className="h-3 w-3 text-[#d1d5db] hover:text-[#808080] cursor-default" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 w-48 -translate-x-1/2 rounded-[6px] bg-[#171717] px-2.5 py-1.5 text-[11px] leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#171717]" />
      </span>
    </span>
  );
}

function StatRow({ label, value, sub, tooltip }: { label: string; value: React.ReactNode; sub?: string; tooltip?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="flex items-center text-[11px] text-[#666666]">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </span>
      <div className="text-right">
        <div className="text-[12px] font-medium text-[#171717]">{value}</div>
        {sub && <div className="text-[10px] text-[#808080]">{sub}</div>}
      </div>
    </div>
  );
}

function Chip({ children, variant }: { children: React.ReactNode; variant: "success" | "warning" | "danger" | "info" | "neutral" }) {
  const styles = {
    success: "bg-[#f0fdf4] text-[#15803d]",
    warning: "bg-[#fffbeb] text-[#b45309]",
    danger:  "bg-[#fef2f2] text-[#dc2626]",
    info:    "bg-[#ebf5ff] text-[#0068d6]",
    neutral: "bg-[#f5f5f5] text-[#4d4d4d]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}

function SignalCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="shadow-card rounded-lg bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#fafafa] text-[#808080]" style={{ boxShadow: "rgb(235,235,235) 0px 0px 0px 1px" }}>
          {icon}
        </div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#808080]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [justAnalyzed, setJustAnalyzed] = useState(false);
  const initialTab = (searchParams.get("tab") as "signals" | "market" | "benchmark") ?? "signals";
  const [activeTab, setActiveTab] = useState<"signals" | "market" | "benchmark">(initialTab);
  const [marketData, setMarketData] = useState<any>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState("");
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState("");

  useEffect(() => {
    fetch(`/api/contracts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setContract(data);
        setLoading(false);
        // Auto-fetch market/benchmark if opened via deep-link tab
        if (initialTab === "market") fetchMarketIntel(data.vendor_name);
        if (initialTab === "benchmark") fetchBenchmark();
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBenchmark = async () => {
    setBenchmarkLoading(true);
    setBenchmarkError("");
    try {
      const res = await fetch(`/api/contracts/${id}/benchmark`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setBenchmarkData(json);
    } catch (err) {
      setBenchmarkError(err instanceof Error ? err.message : "Failed to load benchmark data");
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const fetchMarketIntel = async (vendorName: string, refresh = false) => {
    setMarketLoading(true);
    setMarketError("");
    try {
      const p = new URLSearchParams({ company: vendorName });
      if (refresh) p.set("refresh", "true");
      const res = await fetch(`/api/market-intelligence?${p}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setMarketData(json);
    } catch (err) {
      setMarketError(err instanceof Error ? err.message : "Failed to load market intelligence");
    } finally {
      setMarketLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/contracts/${id}/analyze`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const rec = await res.json();
      setContract((prev) => prev ? { ...prev, ai_recommendations: [rec] } : prev);
      setJustAnalyzed(true);
    } catch {
      alert("Analysis failed. Check that your Anthropic API key is set.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#171717] border-t-transparent" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-[13px] font-medium text-[#171717]">Contract not found</p>
          <Link href="/" className="mt-1 text-[12px] text-[#0072f5]">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const recommendation = contract.ai_recommendations?.[0];
  const usage = contract.usage_data?.[0];
  const market = contract.market_analysis?.[0];
  const sentiment = contract.sentiment?.[0];
  const days = daysUntil(contract.end_date);

  const marketVariant = (c: string): "success" | "warning" | "danger" | "info" =>
    c === "below" ? "success" : c === "above" ? "danger" : "info";
  const healthVariant = (h: string): "success" | "warning" | "danger" | "info" =>
    h === "strong" ? "success" : h === "at-risk" ? "danger" : "info";
  const trendVariant = (t: string): "success" | "warning" | "info" =>
    t === "increasing" ? "success" : t === "declining" ? "warning" : "info";

  return (
    <AppShell>
      {/* Slim breadcrumb bar */}
      <div
        className="flex h-12 flex-shrink-0 items-center justify-between px-6 bg-white print:hidden"
        style={{ boxShadow: "rgba(0,0,0,0.06) 0px -1px 0px 0px inset" }}
      >
        <div className="flex items-center gap-2 text-[13px]">
          <Link href="/" className="text-[#808080] hover:text-[#171717] transition-colors">Contracts</Link>
          <span className="text-[#d1d5db]">/</span>
          <span className="font-medium text-[#171717]">{contract.vendor_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-medium text-[#4d4d4d] transition-colors hover:bg-[#fafafa]"
            style={{ boxShadow: "rgb(235,235,235) 0px 0px 0px 1px" }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
          <Link
            href={`/contracts/${id}/edit`}
            className="rounded-[6px] px-3 py-1.5 text-[12px] font-medium text-[#4d4d4d] transition-colors hover:bg-[#fafafa]"
            style={{ boxShadow: "rgb(235,235,235) 0px 0px 0px 1px" }}
          >
            Edit
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-4xl w-full px-6 py-6">
        {/* Hero */}
        <div className="mb-4 shadow-card rounded-lg bg-white p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  contract.category === "Cloud Infrastructure" ? "bg-[#f5f0ff] text-[#6d28d9]" :
                  contract.category === "Security" ? "bg-[#fff7ed] text-[#c2410c]" :
                  contract.category === "DevTools" ? "bg-[#f0fdf4] text-[#15803d]" :
                  "bg-[#ebf5ff] text-[#0068d6]"
                }`}>
                  {contract.category}
                </span>
                {contract.auto_renewal_clause && days <= 90 && (
                  <span className="flex items-center gap-1 rounded-full bg-[#fef2f2] px-2.5 py-0.5 text-[11px] font-medium text-[#dc2626]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#dc2626]" />
                    Auto-renews in {days}d
                  </span>
                )}
              </div>
              <h1 className="text-[20px] font-semibold text-[#171717] tracking-[-0.5px]">{contract.vendor_name}</h1>
              <p className="mt-1 text-[12px] text-[#666666] leading-relaxed">{contract.key_obligations}</p>

              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                {[
                  { label: "Contract Value", value: formatCurrency(contract.contract_value) },
                  { label: "Payment Terms", value: contract.payment_terms },
                  { label: "Start Date", value: formatDate(contract.start_date) },
                  { label: "End Date", value: formatDate(contract.end_date), alert: days <= 90 },
                ].map(({ label, value, alert }) => (
                  <div key={label}>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#808080]">{label}</p>
                    <p className={`mt-0.5 text-[13px] font-semibold ${alert ? "text-[#dc2626]" : "text-[#171717]"}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {recommendation && (
              <div className="flex-shrink-0">
                <ScoreGauge score={recommendation.score} />
              </div>
            )}
          </div>
        </div>

        {/* Tabs — Vercel underline style */}
        <div className="mb-4 flex" style={{ boxShadow: "rgba(0,0,0,0.08) 0px -1px 0px 0px inset" }}>
          {([
            { id: "signals", label: "Signal Analysis" },
            { id: "market", label: "Market Intelligence" },
            { id: "benchmark", label: "Rate Benchmarking" },
          ] as const).map(({ id: tabId, label }) => (
            <button
              key={tabId}
              onClick={() => {
                setActiveTab(tabId);
                if (tabId === "market" && !marketData && !marketLoading && contract) {
                  fetchMarketIntel(contract.vendor_name);
                }
                if (tabId === "benchmark" && !benchmarkData && !benchmarkLoading) {
                  fetchBenchmark();
                }
              }}
              className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${
                activeTab === tabId
                  ? "text-[#171717]"
                  : "text-[#666666] hover:text-[#171717]"
              }`}
            >
              {label}
              {activeTab === tabId && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#171717]" />
              )}
            </button>
          ))}
        </div>

        {activeTab === "signals" && (
          <>
            {/* 4 Signal Cards */}
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Usage */}
              <SignalCard
                title="Usage Analysis"
                icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              >
                {usage ? (
                  <>
                    <div className="mb-2.5">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-500">Utilization</span>
                        <span className="text-xs font-semibold text-gray-800">{usage.utilization_percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            usage.utilization_percentage >= 80 ? "bg-emerald-500" :
                            usage.utilization_percentage >= 50 ? "bg-amber-400" : "bg-red-500"
                          }`}
                          style={{ width: `${usage.utilization_percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Trend</span>
                      <Chip variant={trendVariant(usage.usage_trend)}>{usage.usage_trend}</Chip>
                    </div>
                  </>
                ) : <p className="text-xs text-gray-400">No data</p>}
              </SignalCard>

              {/* Market */}
              <SignalCard
                title="Market Analysis"
                icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
              >
                {market ? (
                  <div className="divide-y divide-gray-50">
                    <StatRow
                      label="vs Market"
                      tooltip="Compares your contract rate to published list prices and peer-reported rates for comparable software in this category."
                      value={
                        <Chip variant={marketVariant(market.market_rate_comparison)}>
                          {market.market_rate_comparison === "above" ? "Above" : market.market_rate_comparison === "below" ? "Below" : "At market"}
                        </Chip>
                      }
                    />
                    <StatRow
                      label="Price Index"
                      tooltip="Estimated % above or below the market benchmark rate. Positive = you're paying more than peers; negative = you're paying less."
                      value={
                        <span className={market.price_index > 0 ? "text-red-600" : market.price_index < 0 ? "text-emerald-600" : "text-gray-600"}>
                          {market.price_index > 0 ? "+" : ""}{market.price_index}%
                        </span>
                      }
                    />
                    <StatRow
                      label="Vendor Health"
                      tooltip="Vendor financial stability based on SEC EDGAR filings — revenue trend, gross margin, and cash position from the most recent 10-K/10-Q."
                      value={
                        <Chip variant={healthVariant(market.vendor_financial_health)}>{market.vendor_financial_health}</Chip>
                      }
                    />
                  </div>
                ) : <p className="text-xs text-gray-400">No data</p>}
              </SignalCard>

              {/* Sentiment */}
              <SignalCard
                title="Stakeholder Sentiment"
                icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              >
                {sentiment ? (
                  <>
                    <div className="mb-2 flex items-end gap-1.5">
                      <span className={`text-2xl font-bold leading-none ${
                        sentiment.satisfaction_score >= 80 ? "text-emerald-600" :
                        sentiment.satisfaction_score >= 65 ? "text-amber-600" : "text-red-600"
                      }`}>{sentiment.satisfaction_score}</span>
                      <span className="mb-0.5 text-xs text-gray-400">/100</span>
                    </div>
                    {sentiment.stakeholder_comments && (
                      <p className="text-xs italic text-gray-400 leading-relaxed line-clamp-3">
                        "{sentiment.stakeholder_comments}"
                      </p>
                    )}
                  </>
                ) : <p className="text-xs text-gray-400">No data</p>}
              </SignalCard>

              {/* Terms */}
              <SignalCard
                title="Contract Terms"
                icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              >
                <div className="divide-y divide-gray-50">
                  <StatRow label="Duration" value={`${Math.round((new Date(contract.end_date).getTime() - new Date(contract.start_date).getTime()) / (1000 * 60 * 60 * 24 * 365))}yr`} />
                  <StatRow label="Expires" value={
                    <span className={days <= 90 ? "text-red-600" : "text-gray-900"}>
                      {days > 0 ? `${days}d` : "Expired"}
                    </span>
                  } sub={formatDate(contract.end_date)} />
                  <StatRow label="Auto-renew" value={
                    contract.auto_renewal_clause
                      ? <Chip variant="warning">Yes</Chip>
                      : <Chip variant="neutral">No</Chip>
                  } />
                </div>
              </SignalCard>
            </div>

            {/* AI Recommendation */}
            <div className="mb-1">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-[#808080]">AI Recommendation</p>
              {recommendation ? (
                <div className={`shadow-card rounded-lg p-5 ${
                  getRiskLevel(recommendation.score) === "high" ? "bg-[#fef2f2]" :
                  getRiskLevel(recommendation.score) === "medium" ? "bg-[#fffbeb]" :
                  "bg-[#f0fdf4]"
                }`}>
                  <div className="flex items-start gap-3.5">
                    <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                      getRiskLevel(recommendation.score) === "high" ? "bg-[#fee2e2]" :
                      getRiskLevel(recommendation.score) === "medium" ? "bg-[#fef3c7]" : "bg-[#dcfce7]"
                    }`}>
                      <svg className={`h-3.5 w-3.5 ${
                        getRiskLevel(recommendation.score) === "high" ? "text-[#dc2626]" :
                        getRiskLevel(recommendation.score) === "medium" ? "text-[#b45309]" : "text-[#16a34a]"
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#4d4d4d] leading-relaxed">{recommendation.narrative}</p>
                      {justAnalyzed && (
                        <p className="mt-1.5 text-[11px] text-[#808080] font-mono">Generated by Claude claude-sonnet-4-6</p>
                      )}
                      {recommendation.risk_flags?.length > 0 && (
                        <div className="mt-3.5">
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#808080]">Risk Flags</p>
                          <ul className="space-y-1">
                            {recommendation.risk_flags.map((flag: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5 text-[12px] text-[#4d4d4d]">
                                <svg className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${
                                  getRiskLevel(recommendation.score) === "high" ? "text-[#dc2626]" :
                                  getRiskLevel(recommendation.score) === "medium" ? "text-[#b45309]" : "text-[#16a34a]"
                                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {flag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="mt-3 text-[11px] text-[#808080] hover:text-[#4d4d4d] underline transition-colors"
                      >
                        {analyzing ? "Re-analyzing…" : "Regenerate"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="shadow-border rounded-lg bg-white p-8 text-center" style={{ borderStyle: "dashed" }}>
                  <svg className="mx-auto mb-2.5 h-8 w-8 text-[#ebebeb]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-[13px] font-semibold text-[#171717] mb-1">No AI analysis yet</p>
                  <p className="text-[12px] text-[#666666] mb-4">Claude analyzes all 4 signals to generate a renewal score.</p>
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="rounded-[6px] bg-[#171717] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-60 inline-flex items-center gap-2"
                  >
                    {analyzing && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                    {analyzing ? "Analyzing…" : "Generate AI Recommendation"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "market" && (
          <div>
            {marketLoading && (
              <div className="shadow-card rounded-lg bg-white p-10 text-center">
                <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#171717] border-t-transparent" />
                <p className="text-[13px] font-semibold text-[#171717]">Fetching SEC EDGAR data…</p>
                <p className="mt-1 text-[12px] text-[#808080]">Generating negotiation intelligence with Claude</p>
              </div>
            )}
            {marketError && (
              <div className="shadow-card rounded-lg bg-[#fef2f2] p-4">
                <p className="text-[13px] font-semibold text-[#dc2626]">{marketError}</p>
                <p className="mt-1 text-[11px] text-[#ef4444]">This vendor may not be publicly traded or the name may differ in SEC filings.</p>
                <button
                  onClick={() => fetchMarketIntel(contract!.vendor_name)}
                  className="mt-2 text-[12px] text-[#0072f5] underline hover:text-[#0068d6] transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
            {marketData && !marketLoading && (
              <MarketIntelligencePanel
                data={marketData}
                onRefresh={() => fetchMarketIntel(contract!.vendor_name, true)}
                loading={marketLoading}
              />
            )}
          </div>
        )}

        {activeTab === "benchmark" && (
          <div>
            {benchmarkLoading && (
              <div className="shadow-card rounded-lg bg-white p-10 text-center">
                <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#171717] border-t-transparent" />
                <p className="text-[13px] font-semibold text-[#171717]">Analysing unit rates…</p>
                <p className="mt-1 text-[12px] text-[#808080]">Comparing against market benchmarks with Claude</p>
              </div>
            )}
            {benchmarkError && (
              <div className="shadow-card rounded-lg bg-[#fef2f2] p-4">
                <p className="text-[13px] font-semibold text-[#dc2626]">{benchmarkError}</p>
                <button
                  onClick={fetchBenchmark}
                  className="mt-2 text-[12px] text-[#0072f5] underline hover:text-[#0068d6] transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
            {benchmarkData && !benchmarkLoading && (
              <RateBenchmarkPanel data={benchmarkData} />
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}
