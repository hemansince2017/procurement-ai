"use client";

import { useState } from "react";
import { MarketIntelligencePanel } from "@/components/market-intelligence/MarketIntelligencePanel";
import { AppShell } from "@/components/shared/AppShell";

const EXAMPLES = [
  "Salesforce", "Microsoft", "Amazon Web Services", "ServiceNow",
  "Workday", "Zoom Video Communications", "Cloudflare", "CrowdStrike",
];

export default function MarketIntelligencePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const analyze = async (company: string, refresh = false) => {
    if (!company.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const params = new URLSearchParams({ company: company.trim() });
      if (refresh) params.set("refresh", "true");
      const res = await fetch(`/api/market-intelligence?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Analysis failed");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl w-full px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-[22px] font-semibold text-[#171717] tracking-[-0.5px]">Market Intelligence</h1>
            <span className="rounded-full bg-[#ebf5ff] px-2.5 py-0.5 text-[11px] font-medium text-[#0068d6]">SEC EDGAR + Claude AI</span>
          </div>
          <p className="text-[13px] text-[#666666]">
            Search any publicly traded vendor to pull live SEC EDGAR financials and generate AI-powered negotiation intelligence.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={(e) => { e.preventDefault(); analyze(query); }} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#808080]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search vendor (e.g. Salesforce, Microsoft, Workday…)"
                className="w-full rounded-[6px] bg-white py-2.5 pl-9 pr-4 text-[13px] text-[#171717] placeholder-[#808080] focus:outline-none transition-shadow"
                style={{ boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px" }}
                onFocus={(e) => e.currentTarget.style.boxShadow = "hsla(212,100%,48%,1) 0px 0px 0px 2px"}
                onBlur={(e) => e.currentTarget.style.boxShadow = "rgba(0,0,0,0.08) 0px 0px 0px 1px"}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex items-center gap-1.5 rounded-[6px] bg-[#171717] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              {loading ? "Analyzing…" : "Analyze"}
            </button>
          </div>
        </form>

        {/* Quick examples */}
        {!data && !loading && (
          <div className="mb-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#808080]">Quick examples</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => { setQuery(ex); analyze(ex); }}
                  className="rounded-full px-3 py-1 text-[12px] font-medium text-[#4d4d4d] hover:bg-[#fafafa] hover:text-[#171717] transition-colors"
                  style={{ boxShadow: "rgb(235,235,235) 0px 0px 0px 1px" }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="shadow-card rounded-lg bg-white p-10 text-center">
            <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#171717] border-t-transparent" />
            <p className="text-[13px] font-semibold text-[#171717]">Fetching SEC EDGAR data…</p>
            <p className="mt-1 text-[12px] text-[#808080]">Pulling latest 10-Q and generating negotiation intelligence with Claude</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="shadow-card rounded-lg bg-[#fef2f2] p-4">
            <p className="text-[13px] font-semibold text-[#dc2626]">{error}</p>
            <p className="mt-1 text-[11px] text-[#ef4444]">
              Try the full legal company name as it appears in SEC filings (e.g. &quot;Salesforce Inc&quot;).
            </p>
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <MarketIntelligencePanel
            data={data}
            onRefresh={() => analyze(query || data.company.name, true)}
            loading={loading}
          />
        )}

        {/* Empty state */}
        {!data && !loading && !error && (
          <div className="shadow-border rounded-lg bg-white p-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[#fafafa]" style={{ boxShadow: "rgb(235,235,235) 0px 0px 0px 1px" }}>
              <svg className="h-6 w-6 text-[#808080]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-[#171717]">Search a vendor to get started</p>
            <p className="mt-1 text-[12px] text-[#808080]">Any publicly traded company with SEC EDGAR filings</p>
          </div>
        )}
      </main>
    </AppShell>
  );
}
