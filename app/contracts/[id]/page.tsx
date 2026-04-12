"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, daysUntil, getRiskLevel } from "@/lib/utils";
import { MarketIntelligencePanel } from "@/components/market-intelligence/MarketIntelligencePanel";

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
  market_analysis: {
    market_rate_comparison: string;
    vendor_financial_health: string;
    price_index: number;
  }[];
  sentiment: { satisfaction_score: number; stakeholder_comments: string }[];
  ai_recommendations: { score: number; narrative: string; risk_flags: string[] }[];
};

function ScoreGauge({ score }: { score: number }) {
  const level = getRiskLevel(score);
  const colors = { high: "#dc2626", medium: "#d97706", low: "#16a34a" };
  const labels = { high: "High Priority — Renegotiate", medium: "Monitor Closely", low: "Healthy Contract" };
  const color = colors[level];
  const circumference = 2 * Math.PI * 45;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-32 w-32">
        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold" style={{ color }}>{labels[level]}</p>
    </div>
  );
}

function SignalCard({
  title,
  icon,
  children,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className={`rounded-xl border ${accent ?? "border-gray-200 bg-white"} p-5 shadow-sm`}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function StatRow({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="text-right">
        <div className="text-sm font-medium text-gray-900">{value}</div>
        {sub && <div className="text-xs text-gray-400">{sub}</div>}
      </div>
    </div>
  );
}

function Chip({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const styles = {
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    neutral: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [justAnalyzed, setJustAnalyzed] = useState(false);
  const [activeTab, setActiveTab] = useState<"signals" | "market">("signals");
  const [marketData, setMarketData] = useState<any>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState("");

  useEffect(() => {
    fetch(`/api/contracts/${id}`)
      .then((r) => r.json())
      .then((data) => { setContract(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const fetchMarketIntel = async (vendorName: string, refresh = false) => {
    setMarketLoading(true);
    setMarketError("");
    try {
      const params = new URLSearchParams({ company: vendorName });
      if (refresh) params.set("refresh", "true");
      const res = await fetch(`/api/market-intelligence?${params}`);
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="font-medium text-gray-700">Contract not found</p>
          <Link href="/" className="mt-2 text-sm text-blue-600">← Back to dashboard</Link>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Dashboard
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-sm font-medium text-gray-900">{contract.vendor_name}</span>
            </div>
            <Link
              href={`/contracts/${id}/edit`}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Hero row */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: contract identity */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  {contract.category}
                </span>
                {contract.auto_renewal_clause && days <= 90 && (
                  <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                    Auto-renews in {days}d
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{contract.vendor_name}</h1>
              <p className="mt-1 text-sm text-gray-500">{contract.key_obligations}</p>

              <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-400">Contract Value</p>
                  <p className="text-base font-semibold text-gray-900">{formatCurrency(contract.contract_value)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Payment Terms</p>
                  <p className="text-base font-semibold text-gray-900">{contract.payment_terms}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Start Date</p>
                  <p className="text-base font-semibold text-gray-900">{formatDate(contract.start_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">End Date</p>
                  <p className={`text-base font-semibold ${days <= 90 ? "text-red-600" : "text-gray-900"}`}>
                    {formatDate(contract.end_date)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: score */}
            {recommendation && (
              <div className="flex-shrink-0">
                <ScoreGauge score={recommendation.score} />
              </div>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
          {(["signals", "market"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "market" && !marketData && !marketLoading && contract) {
                  fetchMarketIntel(contract.vendor_name);
                }
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "signals" ? "Signal Analysis" : "Market Intelligence"}
            </button>
          ))}
        </div>

        {activeTab === "signals" && (<>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Signal Analysis
        </h2>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Signal 1: Usage */}
          <SignalCard
            title="Usage Analysis"
            icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          >
            {usage ? (
              <>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Utilization</span>
                    <span className="font-semibold text-gray-800">{usage.utilization_percentage}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        usage.utilization_percentage >= 80 ? "bg-emerald-500" :
                        usage.utilization_percentage >= 50 ? "bg-amber-500" : "bg-red-500"
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
            ) : <p className="text-sm text-gray-400">No data</p>}
          </SignalCard>

          {/* Signal 2: Market */}
          <SignalCard
            title="Market Analysis"
            icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          >
            {market ? (
              <div className="divide-y divide-gray-50">
                <StatRow label="vs Market" value={
                  <Chip variant={marketVariant(market.market_rate_comparison)}>
                    {market.market_rate_comparison === "above" ? "Above market" :
                     market.market_rate_comparison === "below" ? "Below market" : "At market"}
                  </Chip>
                } />
                <StatRow label="Price Index" value={
                  <span className={market.price_index > 0 ? "text-red-600" : market.price_index < 0 ? "text-emerald-600" : "text-gray-600"}>
                    {market.price_index > 0 ? "+" : ""}{market.price_index}%
                  </span>
                } />
                <StatRow label="Vendor Health" value={
                  <Chip variant={healthVariant(market.vendor_financial_health)}>
                    {market.vendor_financial_health}
                  </Chip>
                } />
              </div>
            ) : <p className="text-sm text-gray-400">No data</p>}
          </SignalCard>

          {/* Signal 3: Sentiment */}
          <SignalCard
            title="Stakeholder Sentiment"
            icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          >
            {sentiment ? (
              <>
                <div className="mb-3 flex items-end gap-2">
                  <span className={`text-3xl font-bold ${
                    sentiment.satisfaction_score >= 80 ? "text-emerald-600" :
                    sentiment.satisfaction_score >= 65 ? "text-amber-600" : "text-red-600"
                  }`}>{sentiment.satisfaction_score}</span>
                  <span className="mb-1 text-sm text-gray-400">/100</span>
                </div>
                {sentiment.stakeholder_comments && (
                  <p className="text-xs italic text-gray-500 leading-relaxed">
                    "{sentiment.stakeholder_comments}"
                  </p>
                )}
              </>
            ) : <p className="text-sm text-gray-400">No data</p>}
          </SignalCard>

          {/* Signal 4: Contract Terms */}
          <SignalCard
            title="Contract Terms"
            icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
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
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          AI Recommendation
        </h2>
        {recommendation ? (
          <div className={`rounded-xl border p-6 shadow-sm ${
            getRiskLevel(recommendation.score) === "high" ? "border-red-200 bg-red-50" :
            getRiskLevel(recommendation.score) === "medium" ? "border-amber-200 bg-amber-50" :
            "border-emerald-200 bg-emerald-50"
          }`}>
            <div className="flex items-start gap-4">
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                getRiskLevel(recommendation.score) === "high" ? "bg-red-100" :
                getRiskLevel(recommendation.score) === "medium" ? "bg-amber-100" : "bg-emerald-100"
              }`}>
                <svg className={`h-4 w-4 ${
                  getRiskLevel(recommendation.score) === "high" ? "text-red-600" :
                  getRiskLevel(recommendation.score) === "medium" ? "text-amber-600" : "text-emerald-600"
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 leading-relaxed">{recommendation.narrative}</p>

                {justAnalyzed && (
                  <p className="mt-2 text-xs text-gray-500 italic">Generated just now by Claude claude-sonnet-4-6</p>
                )}

                {recommendation.risk_flags?.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Risk Flags</p>
                    <ul className="space-y-1.5">
                      {recommendation.risk_flags.map((flag: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <svg className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                            getRiskLevel(recommendation.score) === "high" ? "text-red-500" :
                            getRiskLevel(recommendation.score) === "medium" ? "text-amber-500" : "text-emerald-500"
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
                  className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  {analyzing ? "Re-analyzing…" : "Regenerate with Claude"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
            <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="mb-1 font-medium text-gray-600">No AI analysis yet</p>
            <p className="mb-4 text-sm text-gray-400">Claude will analyze all 4 signals and generate a recommendation score.</p>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {analyzing ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing…
                </span>
              ) : "Generate AI Recommendation"}
            </button>
          </div>
        )}
        </>)}

        {/* Market Intelligence Tab */}
        {activeTab === "market" && (
          <div>
            {marketLoading && (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <p className="font-medium text-gray-700">Fetching SEC EDGAR data…</p>
                <p className="mt-1 text-sm text-gray-400">Pulling latest 10-Q and generating negotiation intelligence</p>
              </div>
            )}
            {marketError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-medium text-red-700">{marketError}</p>
                <p className="mt-1 text-xs text-red-500">
                  This vendor may not be publicly traded or the name may differ in SEC filings.
                </p>
                <button
                  onClick={() => fetchMarketIntel(contract!.vendor_name)}
                  className="mt-3 text-xs text-blue-600 underline hover:text-blue-700"
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
      </main>
    </div>
  );
}
