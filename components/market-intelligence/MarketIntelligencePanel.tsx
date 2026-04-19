"use client";

import { useState } from "react";

type Priority = "high" | "medium" | "low";

interface IntelligenceItem {
  priority: Priority;
  title: string;
  detail: string;
  action: string;
}

interface Segment {
  name: string;
  revenueShare: number;
}

interface Executive {
  name: string;
  title: string;
}

interface EpsPoint {
  period: string;
  actual: number;
}

interface AnalystRating {
  consensus: string;
  mean: number;
  count: number;
  source: "yahoo" | "ai";
}

interface FundingInfo {
  estimatedValuation: string | null;
  lastRound: string | null;
  totalFunding: string | null;
  notableInvestors: string[];
  note: string;
}

interface MarketData {
  source?: "sec" | "ai";
  company: {
    name: string; ticker?: string | null; cik?: string | null; industry?: string | null;
    stateOfInc?: string | null; fiscalYearEnd?: string | null;
  };
  financials: {
    revenue: number; revenueRaw: number; revenueYoY: number | null;
    grossMarginPct: number | null; operatingIncome: number | null;
    cash: number | null; netIncome: number | null;
    latestPeriod: string; latestFiled: string; latestForm: string; isQuarterly: boolean;
  } | null;
  intelligence: {
    companyOverview?: string;
    products?: string[];
    segments?: Segment[];
    executives?: Executive[];
    posture: "low" | "moderate" | "high"; postureScore: number; postureLabel: string;
    narrative: string; topAction: string;
    levers: IntelligenceItem[]; risks: IntelligenceItem[]; opportunities: IntelligenceItem[];
    fundingInfo?: FundingInfo;
    epsEstimates?: EpsPoint[];
    analystRating?: AnalystRating;
  };
  marketMetrics?: {
    eps: EpsPoint[];
    analystRating: AnalystRating | null;
    source: "yahoo" | "ai";
  } | null;
  cached?: boolean;
}

function fmt(n: number | null | undefined) {
  if (n == null) return "N/A";
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function PriorityDot({ p }: { p: Priority }) {
  const colors: Record<Priority, string> = {
    high: "bg-red-500",
    medium: "bg-amber-400",
    low: "bg-gray-300",
  };
  return <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${colors[p]}`} />;
}

function AccordionSection({ title, items, count }: { title: string; items: IntelligenceItem[]; count: number }) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const accentMap: Record<string, string> = {
    Levers: "text-blue-600",
    Risks: "text-red-600",
    Opportunities: "text-emerald-600",
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm self-start">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${accentMap[title] ?? "text-gray-700"}`}>{title}</span>
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">{count}</span>
        </div>
        <svg className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="divide-y divide-gray-50 border-t border-gray-100">
          {items.map((item, i) => (
            <div key={i} className="px-4 py-3">
              <button
                className="flex w-full items-start gap-2.5 text-left"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <PriorityDot p={item.priority} />
                <span className="flex-1 text-xs font-medium text-gray-800">{item.title}</span>
                <svg className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-300 transition-transform ${expanded === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expanded === i && (
                <div className="mt-2.5 ml-4 space-y-2 border-l-2 border-gray-100 pl-3">
                  <p className="text-xs text-gray-500 leading-relaxed">{item.detail}</p>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mt-0.5">Action</span>
                    <p className="text-xs text-gray-700">{item.action}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostureGauge({ score, label, posture }: { score: number; label: string; posture: string }) {
  const color = posture === "high" ? "#16a34a" : posture === "moderate" ? "#d97706" : "#dc2626";
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Negotiation Posture</span>
        <span className="text-xs font-bold" style={{ color }}>{label}</span>
      </div>
      <div className="relative mb-1">
        <div className="h-2 w-full rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-500" />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${score}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-400">Low leverage</span>
        <span className="text-[10px] text-gray-400">Moderate</span>
        <span className="text-[10px] text-gray-400">High leverage</span>
      </div>
    </div>
  );
}

function EpsChart({ eps, source }: { eps: EpsPoint[]; source: "yahoo" | "ai" }) {
  if (!eps || eps.length === 0) return null;
  const values = eps.map((e) => e.actual);
  const max = Math.max(...values.map(Math.abs), 0.01);
  const isAiEps = source === "ai";

  return (
    <div className="shadow-card rounded-lg bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ boxShadow: "rgba(0,0,0,0.06) 0px -1px 0px 0px inset" }}>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#808080]">Earnings Per Share (EPS)</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${isAiEps ? "bg-[#faf5ff] text-[#6d28d9]" : "bg-[#f0fdf4] text-[#16a34a]"}`}
        >
          {isAiEps ? "AI estimate" : "Yahoo Finance"}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-end gap-2 h-20">
          {eps.map((e, i) => {
            const isPos = e.actual >= 0;
            const height = Math.abs(e.actual / max) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <span className="text-[10px] font-semibold text-[#171717] tabular-nums opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#171717] text-white rounded px-1.5 py-0.5 z-10">
                  {e.actual >= 0 ? "+" : ""}{e.actual.toFixed(2)}
                </span>
                <div className="w-full flex flex-col items-center justify-end" style={{ height: "60px" }}>
                  <div
                    className={`w-full rounded-t-sm transition-all ${isPos ? "bg-[#16a34a]" : "bg-[#dc2626]"}`}
                    style={{ height: `${Math.max(height * 0.6, 4)}px`, opacity: 0.8 }}
                  />
                </div>
                <span className="text-[9px] text-[#808080] text-center leading-tight">{e.period ? e.period.slice(0, 7) : ""}</span>
                <span className={`text-[10px] font-semibold tabular-nums ${isPos ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
                  {e.actual >= 0 ? "+" : ""}{e.actual.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const CONSENSUS_META: Record<string, { label: string; color: string; bg: string; position: number }> = {
  strongBuy:    { label: "Strong Buy",    color: "#16a34a", bg: "#f0fdf4", position: 5  },
  buy:          { label: "Buy",           color: "#22c55e", bg: "#f0fdf4", position: 75 },
  hold:         { label: "Hold",          color: "#d97706", bg: "#fffbeb", position: 50 },
  underperform: { label: "Underperform",  color: "#f97316", bg: "#fff7ed", position: 30 },
  sell:         { label: "Sell",          color: "#dc2626", bg: "#fef2f2", position: 10 },
};

function AnalystRatingWidget({ rating }: { rating: AnalystRating }) {
  const meta = CONSENSUS_META[rating.consensus] ?? {
    label: rating.consensus,
    color: "#808080",
    bg: "#fafafa",
    position: 50,
  };
  // mean: 1.0 (strong buy) → 5.0 (sell). Convert to 0–100% for bar (1=100%, 5=0%)
  const barPct = Math.round(((5 - (rating.mean ?? 3)) / 4) * 100);
  const isAi = rating.source === "ai";

  return (
    <div className="shadow-card rounded-lg bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ boxShadow: "rgba(0,0,0,0.06) 0px -1px 0px 0px inset" }}>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#808080]">Analyst Rating</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${isAi ? "bg-[#faf5ff] text-[#6d28d9]" : "bg-[#ebf5ff] text-[#0068d6]"}`}
        >
          {isAi ? "AI estimate" : `${rating.count} analysts`}
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ backgroundColor: meta.bg, color: meta.color }}
          >
            {meta.label}
          </span>
          {rating.mean != null && (
            <span className="text-[11px] text-[#808080]">Score: <span className="font-semibold text-[#171717]">{rating.mean.toFixed(1)}</span> / 5.0</span>
          )}
        </div>
        <div>
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#dc2626] via-[#d97706] to-[#16a34a]" />
          <div className="relative h-0">
            <div
              className="absolute -top-3 h-5 w-2 -translate-x-1/2 rounded-full border-2 border-white shadow"
              style={{ left: `${barPct}%`, backgroundColor: meta.color }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[9px] text-[#808080]">Sell</span>
            <span className="text-[9px] text-[#808080]">Hold</span>
            <span className="text-[9px] text-[#808080]">Strong Buy</span>
          </div>
        </div>
        {isAi && (
          <p className="text-[10px] text-[#808080] leading-relaxed">
            AI-estimated based on financial health and market position. Not from live analyst data.
          </p>
        )}
      </div>
    </div>
  );
}

function FundingInfoCard({ funding }: { funding: FundingInfo }) {
  const hasData = funding.estimatedValuation || funding.lastRound || funding.totalFunding;
  if (!hasData && (!funding.notableInvestors || funding.notableInvestors.length === 0)) return null;

  return (
    <div className="shadow-card rounded-lg bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ boxShadow: "rgba(0,0,0,0.06) 0px -1px 0px 0px inset" }}>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#808080]">Funding & Valuation</span>
        <span className="rounded-full bg-[#faf5ff] px-2 py-0.5 text-[10px] font-medium text-[#6d28d9]">AI estimate</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {funding.estimatedValuation && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-[#808080] mb-1">Est. Valuation</p>
              <p className="text-[14px] font-semibold text-[#171717]">{funding.estimatedValuation}</p>
            </div>
          )}
          {funding.lastRound && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-[#808080] mb-1">Last Round</p>
              <p className="text-[13px] font-medium text-[#171717]">{funding.lastRound}</p>
            </div>
          )}
          {funding.totalFunding && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-[#808080] mb-1">Total Funding</p>
              <p className="text-[14px] font-semibold text-[#171717]">{funding.totalFunding}</p>
            </div>
          )}
        </div>
        {funding.notableInvestors && funding.notableInvestors.length > 0 && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#808080] mb-1.5">Notable Investors</p>
            <div className="flex flex-wrap gap-1.5">
              {funding.notableInvestors.map((inv, i) => (
                <span key={i} className="rounded-full bg-[#f5f5f5] px-2.5 py-0.5 text-[11px] font-medium text-[#4d4d4d]">{inv}</span>
              ))}
            </div>
          </div>
        )}
        {funding.note && (
          <p className="text-[10px] text-[#808080] leading-relaxed border-t border-gray-100 pt-2">{funding.note}</p>
        )}
      </div>
    </div>
  );
}

function SegmentBar({ segments }: { segments: Segment[] }) {
  const colors = [
    "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-400", "bg-rose-400",
  ];
  return (
    <div className="space-y-2.5">
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {segments.map((s, i) => (
          <div
            key={i}
            className={`${colors[i % colors.length]} transition-all`}
            style={{ width: `${s.revenueShare}%` }}
            title={`${s.name}: ${s.revenueShare}%`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 flex-shrink-0 rounded-sm ${colors[i % colors.length]}`} />
            <span className="truncate text-[11px] text-gray-600">{s.name}</span>
            <span className="ml-auto text-[11px] font-semibold text-gray-800 tabular-nums">{s.revenueShare}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketIntelligencePanel({ data, onRefresh, loading = false }: {
  data: MarketData; onRefresh?: () => void; loading?: boolean;
}) {
  const { company, financials, intelligence, marketMetrics } = data;
  const isAI = data.source === "ai";
  const fundingInfo = intelligence.fundingInfo;
  const hasContext = intelligence.companyOverview || (intelligence.products?.length ?? 0) > 0
    || (intelligence.segments?.length ?? 0) > 0 || (intelligence.executives?.length ?? 0) > 0;

  return (
    <div className="space-y-3.5">
      {/* Company header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-base font-semibold text-gray-900">{company.name}</h2>
            {company.ticker && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-500">{company.ticker}</span>
            )}
            {isAI ? (
              <span className="rounded-full bg-[#f5f0ff] px-2 py-0.5 text-[10px] font-medium text-[#6d28d9]">
                AI Analysis
              </span>
            ) : (
              <span className="rounded-full bg-[#ebf5ff] px-2 py-0.5 text-[10px] font-medium text-[#0068d6]">
                SEC EDGAR
              </span>
            )}
            {data.cached && (
              <span className="rounded-full bg-[#fafafa] px-2 py-0.5 text-[10px] font-medium text-[#808080]" style={{ boxShadow: "rgb(235,235,235) 0px 0px 0px 1px" }}>cached</span>
            )}
          </div>
          {isAI ? (
            <p className="text-[11px] text-[#808080]">
              {company.industry || "Private or unlisted company"} · AI-generated based on market knowledge
            </p>
          ) : (
            <p className="text-[11px] text-[#808080]">
              {company.industry} · {financials?.latestForm} · Period ending {financials?.latestPeriod} · Filed {financials?.latestFiled}
              {company.fiscalYearEnd && ` · FY ends ${company.fiscalYearEnd}`}
            </p>
          )}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1 rounded-[6px] px-2.5 py-1.5 text-[12px] text-[#4d4d4d] hover:bg-[#fafafa] disabled:opacity-40 transition-colors"
            style={{ boxShadow: "rgb(235,235,235) 0px 0px 0px 1px" }}
          >
            <svg className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        )}
      </div>

      {/* AI-only notice banner */}
      {isAI && (
        <div className="flex items-start gap-3 rounded-lg bg-[#faf5ff] px-4 py-3" style={{ boxShadow: "rgba(109,40,217,0.12) 0px 0px 0px 1px" }}>
          <svg className="h-4 w-4 flex-shrink-0 mt-0.5 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <p className="text-[12px] font-semibold text-[#6d28d9]">SEC data not available</p>
            <p className="text-[11px] text-[#7c3aed] mt-0.5 leading-relaxed">
              This company isn&apos;t listed in SEC EDGAR (private, foreign, or subsidiary). The analysis below is AI-generated from Claude&apos;s training knowledge — treat financial estimates as directional, not audited.
            </p>
          </div>
        </div>
      )}

      {/* Company context — overview, products, segments, executives */}
      {hasContext && (
        <div className="shadow-card rounded-lg bg-white overflow-hidden">
          <div className="px-4 py-3" style={{ boxShadow: "rgba(0,0,0,0.06) 0px -1px 0px 0px inset" }}>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#808080]">Company Overview</span>
          </div>

          <div className="p-4 space-y-4">
            {intelligence.companyOverview && (
              <p className="text-[13px] text-[#4d4d4d] leading-relaxed">{intelligence.companyOverview}</p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(intelligence.products?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#808080] mb-2">Products & Platforms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {intelligence.products!.map((p, i) => (
                      <span key={i} className="rounded-full bg-[#f5f5f5] px-2.5 py-0.5 text-[11px] font-medium text-[#4d4d4d]">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {(intelligence.executives?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#808080] mb-2">Key Executives</p>
                  <div className="space-y-1.5">
                    {intelligence.executives!.map((e, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-[12px] font-medium text-[#171717]">{e.name}</span>
                        <span className="rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[10px] font-medium text-[#666666]">{e.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(intelligence.segments?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#808080] mb-2.5">Revenue Segments</p>
                <SegmentBar segments={intelligence.segments!} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Financial snapshot — SEC only */}
      {!isAI && financials && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            {
              label: "Revenue" + (financials.isQuarterly ? " (ann.)" : ""),
              value: fmt(financials.revenue),
              sub: financials.revenueYoY !== null ? `${financials.revenueYoY > 0 ? "+" : ""}${financials.revenueYoY}% YoY` : undefined,
              subColor: (financials.revenueYoY ?? 0) > 0 ? "text-[#16a34a]" : "text-[#dc2626]",
            },
            { label: "Gross Margin", value: financials.grossMarginPct != null ? `${financials.grossMarginPct}%` : "N/A" },
            { label: "Operating Income", value: fmt(financials.operatingIncome) },
            { label: "Cash & Equiv.", value: fmt(financials.cash) },
          ].map(({ label, value, sub, subColor }) => (
            <div key={label} className="shadow-card rounded-lg bg-white px-3.5 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-[#808080] mb-1">{label}</p>
              <p className="text-[18px] font-semibold tracking-tight text-[#171717] leading-none">{value}</p>
              {sub && <p className={`text-[10px] font-medium mt-1 ${subColor ?? "text-[#808080]"}`}>{sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* EPS + Analyst Rating (public companies) */}
      {marketMetrics && (marketMetrics.eps?.length > 0 || marketMetrics.analystRating) && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {marketMetrics.eps?.length > 0 && (
            <EpsChart eps={marketMetrics.eps} source={marketMetrics.source} />
          )}
          {marketMetrics.analystRating && (
            <AnalystRatingWidget rating={marketMetrics.analystRating} />
          )}
        </div>
      )}

      {/* Funding info (private companies) */}
      {isAI && fundingInfo && (
        <FundingInfoCard funding={fundingInfo} />
      )}

      {/* Posture gauge */}
      <PostureGauge score={intelligence.postureScore} label={intelligence.postureLabel} posture={intelligence.posture} />

      {/* Narrative + top action */}
      <div className="shadow-card rounded-lg bg-white p-4">
        <p className="text-[13px] text-[#4d4d4d] leading-relaxed mb-3">{intelligence.narrative}</p>
        <div className="rounded-[6px] bg-[#fafafa] px-3.5 py-2.5" style={{ boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#808080] mb-1">Top Action</p>
          <p className="text-[12px] text-[#171717]">{intelligence.topAction}</p>
        </div>
      </div>

      {/* Levers / Risks / Opportunities */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AccordionSection title="Levers" items={intelligence.levers} count={intelligence.levers.length} />
        <AccordionSection title="Risks" items={intelligence.risks} count={intelligence.risks.length} />
        <AccordionSection title="Opportunities" items={intelligence.opportunities} count={intelligence.opportunities.length} />
      </div>
    </div>
  );
}
