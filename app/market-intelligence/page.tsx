"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketIntelligencePanel } from "@/components/market-intelligence/MarketIntelligencePanel";

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/" className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Dashboard
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-sm font-medium text-gray-900">Market Intelligence</span>
            </div>
            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
              SEC EDGAR + Claude AI
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6">
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-gray-900">Vendor Market Intelligence</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Search any publicly traded vendor to pull live SEC EDGAR financials and generate AI-powered negotiation intelligence.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={(e) => { e.preventDefault(); analyze(query); }} className="mb-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search vendor (e.g. Salesforce, Microsoft, Workday…)"
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
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
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Quick examples</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => { setQuery(ex); analyze(ex); }}
                  className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-lg border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm font-medium text-gray-700">Fetching SEC EDGAR data…</p>
            <p className="mt-1 text-xs text-gray-400">Pulling latest 10-Q and generating negotiation intelligence with Claude</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            <strong>Error:</strong> {error}
            <p className="mt-1 text-xs text-red-400">
              Try the full legal company name as it appears in SEC filings (e.g. "Salesforce Inc").
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
          <div className="rounded-lg border border-dashed border-gray-200 bg-white p-14 text-center shadow-sm">
            <svg className="mx-auto mb-3 h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-sm font-medium text-gray-500">Search a vendor to get started</p>
            <p className="mt-1 text-xs text-gray-400">Any publicly traded company with SEC EDGAR filings</p>
          </div>
        )}
      </main>
    </div>
  );
}
