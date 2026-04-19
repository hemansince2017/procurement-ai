"use client";

interface MarketRates {
  low: number;
  median: number;
  high: number;
  currency: string;
}

interface BenchmarkSource {
  source: string;
  rate: number;
  unit: string;
  year: number;
}

interface RatePoint {
  label: string;
  rate: number;
  type: "market" | "contract";
}

interface BenchmarkData {
  contractId: string;
  vendorName: string;
  category: string;
  contractValue: number;
  termMonths: number;
  annualValue: number;
  monthlyValue: number;
  startDate: string;
  endDate: string;
  unitType: string;
  estimatedUnitCount: number;
  contractUnitRate: number;
  marketRates: MarketRates;
  percentile: number;
  annualOverspend: number;
  totalTermOverspend: number;
  benchmarkSources: BenchmarkSource[];
  rateHistory: RatePoint[];
  negotiationTarget: number;
  targetSavingsAnnual: number;
  insight: string;
  confidence: "high" | "medium" | "low";
}

function fmt(n: number, decimals = 0) {
  if (n == null) return "N/A";
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(decimals > 0 ? decimals : 0)}K`;
  return `$${n.toFixed(decimals)}`;
}

function fmtUnit(rate: number, unit: string) {
  const formatted = rate >= 1000 ? fmt(rate, 0) : `$${rate.toFixed(2)}`;
  return `${formatted} ${unit}`;
}

// Where contractUnitRate falls between low and high as a 0–100% position
function ratePosition(rate: number, low: number, high: number): number {
  if (high === low) return 50;
  return Math.min(100, Math.max(0, ((rate - low) / (high - low)) * 100));
}

function CommitmentSummary({ data }: { data: BenchmarkData }) {
  const years = Math.floor(data.termMonths / 12);
  const remMonths = data.termMonths % 12;
  const termLabel = years > 0
    ? `${years}yr${remMonths > 0 ? ` ${remMonths}mo` : ""}`
    : `${data.termMonths}mo`;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {[
        { label: "Total Commitment", value: fmt(data.contractValue), sub: `${termLabel} term` },
        { label: "Annual Value", value: fmt(data.annualValue), sub: "annualised" },
        { label: "Monthly Cost", value: fmt(data.monthlyValue), sub: "per month" },
        { label: "Est. Unit Count", value: data.estimatedUnitCount.toLocaleString(), sub: data.unitType },
      ].map(({ label, value, sub }) => (
        <div key={label} className="shadow-card rounded-lg bg-white px-3.5 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#808080] mb-1">{label}</p>
          <p className="text-[18px] font-semibold tracking-tight text-[#171717] leading-none">{value}</p>
          <p className="text-[10px] text-[#808080] mt-1">{sub}</p>
        </div>
      ))}
    </div>
  );
}

function RateRangeBar({ data }: { data: BenchmarkData }) {
  const { marketRates, contractUnitRate, unitType } = data;
  const contractPos = ratePosition(contractUnitRate, marketRates.low, marketRates.high);
  const medianPos = ratePosition(marketRates.median, marketRates.low, marketRates.high);
  const isOver = contractUnitRate > marketRates.median;
  const contractColor = data.percentile >= 70 ? "#dc2626" : data.percentile >= 45 ? "#d97706" : "#16a34a";

  return (
    <div className="shadow-card rounded-lg bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ boxShadow: "rgba(0,0,0,0.06) 0px -1px 0px 0px inset" }}>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#808080]">Unit Rate vs Market Range</span>
        <span className="text-[11px] font-medium text-[#808080]">{unitType}</span>
      </div>
      <div className="p-5">
        {/* Range bar */}
        <div className="relative mb-6">
          {/* Track */}
          <div className="h-3 w-full rounded-full bg-gradient-to-r from-[#16a34a] via-[#d97706] to-[#dc2626] opacity-20" />
          <div className="absolute inset-0 h-3 w-full rounded-full" style={{
            background: "linear-gradient(to right, #dcfce7 0%, #fef9c3 50%, #fee2e2 100%)"
          }} />

          {/* Median marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${medianPos}%` }}
          >
            <div className="h-5 w-0.5 bg-[#808080] opacity-50" />
          </div>

          {/* Contract rate marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
            style={{ left: `${contractPos}%` }}
          >
            <div
              className="h-5 w-5 rounded-full border-2 border-white shadow-md flex items-center justify-center"
              style={{ backgroundColor: contractColor }}
            />
          </div>
        </div>

        {/* Labels */}
        <div className="flex justify-between text-[10px] text-[#808080] mb-4 -mt-3">
          <div>
            <p className="font-semibold text-[#16a34a]">Best negotiated</p>
            <p className="font-mono">{fmtUnit(marketRates.low, unitType)}</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-[#808080]">Market median</p>
            <p className="font-mono">{fmtUnit(marketRates.median, unitType)}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-[#dc2626]">List / high</p>
            <p className="font-mono">{fmtUnit(marketRates.high, unitType)}</p>
          </div>
        </div>

        {/* Your rate callout */}
        <div
          className="flex items-center justify-between rounded-[6px] px-4 py-3"
          style={{ backgroundColor: contractColor + "12", boxShadow: `${contractColor}30 0px 0px 0px 1px` }}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: contractColor }}>Your rate</p>
            <p className="text-[20px] font-semibold font-mono tracking-tight" style={{ color: contractColor }}>
              {fmtUnit(contractUnitRate, unitType)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#808080] font-medium">vs market median</p>
            <p className="text-[14px] font-semibold" style={{ color: contractColor }}>
              {isOver ? "+" : ""}{Math.round(((contractUnitRate - marketRates.median) / marketRates.median) * 100)}%
            </p>
            <p className="text-[10px] text-[#808080]">{data.percentile}th percentile</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PercentileGauge({ percentile }: { percentile: number }) {
  const color = percentile >= 70 ? "#dc2626" : percentile >= 45 ? "#d97706" : "#16a34a";
  const label = percentile >= 70 ? "Expensive" : percentile >= 45 ? "Near market" : "Good deal";
  const circumference = 2 * Math.PI * 36;
  const strokeDash = (percentile / 100) * circumference;

  return (
    <div className="shadow-card rounded-lg bg-white p-4 flex flex-col items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#808080]">Market Percentile</span>
      <div className="relative h-20 w-20">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#ebebeb" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke={color} strokeWidth="6"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[18px] font-semibold leading-none font-mono" style={{ color }}>{percentile}</span>
          <span className="text-[9px] text-[#808080]">/ 100</span>
        </div>
      </div>
      <span className="text-[11px] font-semibold" style={{ color }}>{label}</span>
      <p className="text-[10px] text-[#808080] text-center leading-relaxed">
        {percentile}% of comparable contracts pay <span className="font-medium">less</span> than this rate
      </p>
    </div>
  );
}

function SavingsCard({ data }: { data: BenchmarkData }) {
  const isOverspend = data.annualOverspend > 0;
  const color = isOverspend ? "#dc2626" : "#16a34a";
  const bg = isOverspend ? "#fef2f2" : "#f0fdf4";

  return (
    <div className="shadow-card rounded-lg bg-white overflow-hidden">
      <div className="px-4 py-3" style={{ boxShadow: "rgba(0,0,0,0.06) 0px -1px 0px 0px inset" }}>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#808080]">
          {isOverspend ? "Estimated Overspend" : "Savings vs Market"}
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[6px] p-3" style={{ backgroundColor: bg }}>
            <p className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color }}>Annual</p>
            <p className="text-[18px] font-semibold font-mono" style={{ color }}>
              {isOverspend ? "+" : "-"}{fmt(Math.abs(data.annualOverspend))}
            </p>
            <p className="text-[10px]" style={{ color: color + "99" }}>vs market median</p>
          </div>
          <div className="rounded-[6px] p-3" style={{ backgroundColor: bg }}>
            <p className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color }}>Full Term</p>
            <p className="text-[18px] font-semibold font-mono" style={{ color }}>
              {isOverspend ? "+" : "-"}{fmt(Math.abs(data.totalTermOverspend))}
            </p>
            <p className="text-[10px]" style={{ color: color + "99" }}>over {data.termMonths}mo term</p>
          </div>
        </div>

        {/* Negotiation target */}
        <div className="rounded-[6px] bg-[#fafafa] p-3" style={{ boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#808080]">Negotiation Target</p>
            <span className="rounded-full bg-[#f0fdf4] px-2 py-0.5 text-[10px] font-medium text-[#16a34a]">
              Save {fmt(data.targetSavingsAnnual)}/yr
            </span>
          </div>
          <p className="text-[13px] font-semibold text-[#171717]">{fmtUnit(data.negotiationTarget, data.unitType)}</p>
          <p className="text-[10px] text-[#808080] mt-0.5">Realistic target based on best-negotiated market rates</p>
        </div>
      </div>
    </div>
  );
}

function RateHistoryChart({ history, unitType }: { history: RatePoint[]; unitType: string }) {
  if (!history || history.length === 0) return null;
  const max = Math.max(...history.map((h) => h.rate)) * 1.15;

  return (
    <div className="shadow-card rounded-lg bg-white overflow-hidden">
      <div className="px-4 py-3" style={{ boxShadow: "rgba(0,0,0,0.06) 0px -1px 0px 0px inset" }}>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#808080]">Rate Trend vs Market</span>
      </div>
      <div className="p-4">
        <div className="flex items-end gap-3" style={{ height: "80px" }}>
          {history.map((pt, i) => {
            const heightPct = (pt.rate / max) * 100;
            const isContract = pt.type === "contract";
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#171717] text-white text-[10px] px-1.5 py-0.5 z-10">
                  {fmtUnit(pt.rate, unitType)}
                </span>
                <div className="w-full flex items-end" style={{ height: "60px" }}>
                  <div
                    className="w-full rounded-t-sm"
                    style={{
                      height: `${Math.max(heightPct * 0.6, 4)}px`,
                      backgroundColor: isContract ? "#171717" : "#ebebeb",
                      border: isContract ? "none" : "1px solid #d1d5db",
                    }}
                  />
                </div>
                <span className="text-[9px] text-[#808080] text-center leading-tight">{pt.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-[#f5f5f5]">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-[#ebebeb] border border-[#d1d5db]" />
            <span className="text-[10px] text-[#808080]">Market rate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-[#171717]" />
            <span className="text-[10px] text-[#808080]">Your contract</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BenchmarkSources({ sources, unitType }: { sources: BenchmarkSource[]; unitType: string }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="shadow-card rounded-lg bg-white overflow-hidden">
      <div className="px-4 py-3" style={{ boxShadow: "rgba(0,0,0,0.06) 0px -1px 0px 0px inset" }}>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#808080]">Benchmark Sources</span>
      </div>
      <div className="divide-y divide-[#f5f5f5]">
        {sources.map((s, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[10px] font-semibold text-[#666666]">{s.source}</span>
              <span className="text-[11px] text-[#808080]">{s.year}</span>
            </div>
            <span className="text-[12px] font-semibold font-mono text-[#171717]">{fmtUnit(s.rate, unitType)}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 bg-[#fafafa]" style={{ boxShadow: "rgba(0,0,0,0.04) 0px 1px 0px 0px inset" }}>
        <p className="text-[10px] text-[#808080] leading-relaxed">
          AI-estimated benchmarks based on Claude&apos;s knowledge of enterprise software pricing. Treat as directional guidance, not audited data.
        </p>
      </div>
    </div>
  );
}

const CONFIDENCE_META = {
  high:   { label: "High confidence", color: "#16a34a", bg: "#f0fdf4" },
  medium: { label: "Medium confidence", color: "#d97706", bg: "#fffbeb" },
  low:    { label: "Low confidence",    color: "#dc2626", bg: "#fef2f2" },
};

export function RateBenchmarkPanel({ data }: { data: BenchmarkData }) {
  const conf = CONFIDENCE_META[data.confidence] ?? CONFIDENCE_META.medium;

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#171717] tracking-[-0.3px]">Rate Benchmarking</h2>
          <p className="text-[12px] text-[#808080] mt-0.5">
            Unit rate analysis for <span className="font-medium text-[#4d4d4d]">{data.vendorName}</span> · {data.category}
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-medium"
          style={{ backgroundColor: conf.bg, color: conf.color }}
        >
          {conf.label}
        </span>
      </div>

      {/* Commitment summary */}
      <CommitmentSummary data={data} />

      {/* Rate range + percentile side by side */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_180px]">
        <RateRangeBar data={data} />
        <PercentileGauge percentile={data.percentile} />
      </div>

      {/* Overspend / savings + rate history */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <SavingsCard data={data} />
        <RateHistoryChart history={data.rateHistory} unitType={data.unitType} />
      </div>

      {/* Insight */}
      <div className="shadow-card rounded-lg bg-white p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#808080] mb-2">AI Insight</p>
        <p className="text-[13px] text-[#4d4d4d] leading-relaxed">{data.insight}</p>
      </div>

      {/* Benchmark sources */}
      <BenchmarkSources sources={data.benchmarkSources} unitType={data.unitType} />
    </div>
  );
}
