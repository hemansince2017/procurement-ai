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
  company: {
    name: string;
    ticker: string;
    cik: string;
    industry: string;
    stateOfInc: string;
  };
  financials: {
    revenue: number;
    revenueRaw: number;
    revenueYoY: number | null;
    grossMarginPct: number | null;
    operatingIncome: number | null;
    cash: number | null;
    netIncome: number | null;
    latestPeriod: string;
    latestFiled: string;
    latestForm: string;
    isQuarterly: boolean;
  };
  intelligence: {
    posture: "low" | "moderate" | "high";
    postureScore: number;
    postureLabel: string;
    narrative: string;
    topAction: string;
    levers: IntelligenceItem[];
    risks: IntelligenceItem[];
    opportunities: IntelligenceItem[];
  };
}

function fmt(n: number | null | undefined, suffix = "") {
  if (n == null) return "N/A";
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B${suffix}`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(0)}M${suffix}`;
  return `$${n.toLocaleString()}${suffix}`;
}

function PriorityBadge({ p }: { p: Priority }) {
  const styles: Record<Priority, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${styles[p]}`}>
      {p}
    </span>
  );
}

function AccordionSection({
  title,
  items,
  accentColor,
}: {
  title: string;
  items: IntelligenceItem[];
  accentColor: string;
}) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${accentColor}`}>{title}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {items.length}
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="divide-y divide-gray-100 border-t border-gray-100">
          {items.map((item, i) => (
            <div key={i} className="px-5 py-4">
              <button
                className="flex w-full items-start gap-3 text-left"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <PriorityBadge p={item.priority} />
                <span className="flex-1 text-sm font-medium text-gray-800">{item.title}</span>
                <svg
                  className={`mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${expanded === i ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expanded === i && (
                <div className="mt-3 pl-16 space-y-2">
                  <p className="text-sm text-gray-600 leading-relaxed">{item.detail}</p>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-blue-600">→ Action</span>
                    <p className="text-sm text-gray-700">{item.action}</p>
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
  const color =
    posture === "high" ? "#16a34a" : posture === "moderate" ? "#d97706" : "#dc2626";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Negotiation Posture
        </span>
        <span className="text-sm font-bold" style={{ color }}>{label}</span>
      </div>
      {/* Gradient bar */}
      <div className="relative mb-1">
        <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-500" />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
          style={{ left: `${score}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>Low leverage</span>
        <span>Moderate</span>
        <span>High leverage</span>
      </div>
    </div>
  );
}

export function MarketIntelligencePanel({
  data,
  onRefresh,
  loading = false,
}: {
  data: MarketData;
  onRefresh?: () => void;
  loading?: boolean;
}) {
  const { company, financials, intelligence } = data;

  return (
    <div className="space-y-5">
      {/* Company header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-gray-900">{company.name}</h2>
            {company.ticker && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                {company.ticker}
              </span>
            )}
            <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              SEC EDGAR
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {company.industry} · {financials.latestForm} · Period ending {financials.latestPeriod} · Filed {financials.latestFiled}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <svg className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        )}
      </div>

      {/* Financial snapshot */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Revenue" + (financials.isQuarterly ? " (annualized)" : ""),
            value: fmt(financials.revenue),
            sub: financials.revenueYoY !== null
              ? `${financials.revenueYoY > 0 ? "+" : ""}${financials.revenueYoY}% YoY`
              : undefined,
            subColor: (financials.revenueYoY ?? 0) > 0 ? "text-emerald-600" : "text-red-600",
          },
          {
            label: "Gross Margin",
            value: financials.grossMarginPct != null ? `${financials.grossMarginPct}%` : "N/A",
            sub: undefined,
          },
          {
            label: "Operating Income",
            value: fmt(financials.operatingIncome),
            sub: undefined,
          },
          {
            label: "Cash",
            value: fmt(financials.cash),
            sub: undefined,
          },
        ].map(({ label, value, sub, subColor }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {sub && <p className={`text-xs font-medium mt-0.5 ${subColor ?? "text-gray-500"}`}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* Posture gauge */}
      <PostureGauge
        score={intelligence.postureScore}
        label={intelligence.postureLabel}
        posture={intelligence.posture}
      />

      {/* Narrative + top action */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-700 leading-relaxed mb-3">{intelligence.narrative}</p>
        <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">Top Action</p>
          <p className="text-sm text-gray-800">{intelligence.topAction}</p>
        </div>
      </div>

      {/* Levers / Risks / Opportunities */}
      <AccordionSection
        title="Levers"
        items={intelligence.levers}
        accentColor="text-blue-700"
      />
      <AccordionSection
        title="Risks"
        items={intelligence.risks}
        accentColor="text-red-700"
      />
      <AccordionSection
        title="Opportunities"
        items={intelligence.opportunities}
        accentColor="text-emerald-700"
      />
    </div>
  );
}
