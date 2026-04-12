"use client";

import { useState } from "react";

type Priority = "high" | "medium" | "low";

interface IntelligenceItem {
  priority: Priority;
  title: string;
  detail: string;
  action: string;
}

interface MarketData {
  company: { name: string; ticker: string; cik: string; industry: string; stateOfInc: string };
  financials: {
    revenue: number; revenueRaw: number; revenueYoY: number | null;
    grossMarginPct: number | null; operatingIncome: number | null;
    cash: number | null; netIncome: number | null;
    latestPeriod: string; latestFiled: string; latestForm: string; isQuarterly: boolean;
  };
  intelligence: {
    posture: "low" | "moderate" | "high"; postureScore: number; postureLabel: string;
    narrative: string; topAction: string;
    levers: IntelligenceItem[]; risks: IntelligenceItem[]; opportunities: IntelligenceItem[];
  };
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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
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

export function MarketIntelligencePanel({ data, onRefresh, loading = false }: {
  data: MarketData; onRefresh?: () => void; loading?: boolean;
}) {
  const { company, financials, intelligence } = data;

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
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">SEC EDGAR</span>
            {data.cached && (
              <span className="rounded bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 ring-1 ring-gray-100">cached</span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {company.industry} · {financials.latestForm} · Period ending {financials.latestPeriod} · Filed {financials.latestFiled}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <svg className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        )}
      </div>

      {/* Financial snapshot */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          {
            label: "Revenue" + (financials.isQuarterly ? " (ann.)" : ""),
            value: fmt(financials.revenue),
            sub: financials.revenueYoY !== null ? `${financials.revenueYoY > 0 ? "+" : ""}${financials.revenueYoY}% YoY` : undefined,
            subColor: (financials.revenueYoY ?? 0) > 0 ? "text-emerald-600" : "text-red-600",
          },
          { label: "Gross Margin", value: financials.grossMarginPct != null ? `${financials.grossMarginPct}%` : "N/A" },
          { label: "Operating Income", value: fmt(financials.operatingIncome) },
          { label: "Cash & Equiv.", value: fmt(financials.cash) },
        ].map(({ label, value, sub, subColor }) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white px-3.5 py-3 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">{label}</p>
            <p className="text-lg font-bold tracking-tight text-gray-900">{value}</p>
            {sub && <p className={`text-[10px] font-medium mt-0.5 ${subColor ?? "text-gray-400"}`}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* Posture gauge */}
      <PostureGauge score={intelligence.postureScore} label={intelligence.postureLabel} posture={intelligence.posture} />

      {/* Narrative + top action */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-600 leading-relaxed mb-3">{intelligence.narrative}</p>
        <div className="rounded-md bg-blue-50 px-3.5 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mb-1">Top Action</p>
          <p className="text-xs text-gray-700">{intelligence.topAction}</p>
        </div>
      </div>

      {/* Levers / Risks / Opportunities */}
      <AccordionSection title="Levers" items={intelligence.levers} count={intelligence.levers.length} />
      <AccordionSection title="Risks" items={intelligence.risks} count={intelligence.risks.length} />
      <AccordionSection title="Opportunities" items={intelligence.opportunities} count={intelligence.opportunities.length} />
    </div>
  );
}
