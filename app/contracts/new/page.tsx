"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";

const CATEGORIES = ["SaaS", "Cloud Infrastructure", "Professional Services", "Hardware"] as const;
const PAYMENT_TERMS = ["Annual", "Quarterly", "Monthly", "Net 30", "Net 45", "Net 60"];

export default function NewContractPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    vendor_name: "",
    category: "SaaS",
    contract_value: "",
    start_date: "",
    end_date: "",
    payment_terms: "Annual",
    auto_renewal_clause: false,
    key_obligations: "",
    utilization_percentage: 70,
    usage_trend: "stable",
    market_rate_comparison: "at",
    vendor_financial_health: "stable",
    price_index: 0,
    satisfaction_score: 75,
    stakeholder_comments: "",
  });

  const set = (field: string, value: unknown) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_name: form.vendor_name,
          category: form.category,
          contract_value: parseFloat(form.contract_value),
          start_date: form.start_date,
          end_date: form.end_date,
          payment_terms: form.payment_terms,
          auto_renewal_clause: form.auto_renewal_clause,
          key_obligations: form.key_obligations,
          usage_data: {
            utilization_percentage: form.utilization_percentage,
            usage_trend: form.usage_trend,
          },
          market_analysis: {
            market_rate_comparison: form.market_rate_comparison,
            vendor_financial_health: form.vendor_financial_health,
            price_index: form.price_index,
          },
          sentiment: {
            satisfaction_score: form.satisfaction_score,
            stakeholder_comments: form.stakeholder_comments,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const contract = await res.json();
      router.push(`/contracts/${contract.id}`);
    } catch {
      alert("Failed to create contract. Please check all fields.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <AppShell>
      <main className="mx-auto max-w-2xl w-full px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Contract</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fill in contract details and signals — AI will generate a recommendation score automatically.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-3">
          {[
            { n: 1, label: "Contract Details" },
            { n: 2, label: "Usage & Market" },
            { n: 3, label: "Stakeholder" },
          ].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(n)}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  step === n ? "bg-blue-600 text-white" : step > n ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {step > n ? "✓" : n}
              </button>
              <span className={`text-xs font-medium hidden sm:inline ${step === n ? "text-blue-600" : "text-gray-400"}`}>
                {label}
              </span>
              {n < 3 && <div className="hidden sm:block h-px w-8 bg-gray-200" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="p-6">
              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-base font-semibold text-gray-900">Contract Details</h2>
                  <div>
                    <label className={labelClass}>Vendor Name *</label>
                    <input
                      className={inputClass}
                      value={form.vendor_name}
                      onChange={(e) => set("vendor_name", e.target.value)}
                      placeholder="e.g. Salesforce, AWS, Deloitte"
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Category *</label>
                      <select
                        className={inputClass}
                        value={form.category}
                        onChange={(e) => set("category", e.target.value)}
                      >
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Contract Value ($) *</label>
                      <input
                        className={inputClass}
                        type="number"
                        value={form.contract_value}
                        onChange={(e) => set("contract_value", e.target.value)}
                        placeholder="500000"
                        min="0"
                        step="1000"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Start Date *</label>
                      <input className={inputClass} type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} required />
                    </div>
                    <div>
                      <label className={labelClass}>End Date *</label>
                      <input className={inputClass} type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} required />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Payment Terms</label>
                      <select className={inputClass} value={form.payment_terms} onChange={(e) => set("payment_terms", e.target.value)}>
                        {PAYMENT_TERMS.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Auto-Renewal Clause</label>
                      <div className="flex gap-3 pt-1.5">
                        {[true, false].map((v) => (
                          <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={form.auto_renewal_clause === v}
                              onChange={() => set("auto_renewal_clause", v)}
                              className="text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{v ? "Yes" : "No"}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Key Obligations</label>
                    <textarea
                      className={inputClass}
                      rows={2}
                      value={form.key_obligations}
                      onChange={(e) => set("key_obligations", e.target.value)}
                      placeholder="e.g. 99.9% uptime SLA, 24/7 support, compliance reporting"
                    />
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Usage Analysis</h2>
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <label className={labelClass.replace("mb-1.5", "mb-0")}>Utilization</label>
                        <span className={`text-sm font-semibold ${
                          form.utilization_percentage >= 80 ? "text-emerald-600" :
                          form.utilization_percentage >= 50 ? "text-amber-600" : "text-red-600"
                        }`}>{form.utilization_percentage}%</span>
                      </div>
                      <input
                        type="range" min="0" max="100"
                        value={form.utilization_percentage}
                        onChange={(e) => set("utilization_percentage", parseInt(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>0%</span><span>50%</span><span>100%</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className={labelClass}>Usage Trend</label>
                      <div className="flex gap-3">
                        {["increasing", "stable", "declining"].map((t) => (
                          <label key={t} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={form.usage_trend === t}
                              onChange={() => set("usage_trend", t)}
                              className="text-blue-600"
                            />
                            <span className="text-sm capitalize text-gray-700">{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Market Analysis</h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className={labelClass}>vs Market Rate</label>
                        <select className={inputClass} value={form.market_rate_comparison} onChange={(e) => set("market_rate_comparison", e.target.value)}>
                          <option value="below">Below market</option>
                          <option value="at">At market</option>
                          <option value="above">Above market</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Vendor Health</label>
                        <select className={inputClass} value={form.vendor_financial_health} onChange={(e) => set("vendor_financial_health", e.target.value)}>
                          <option value="strong">Strong</option>
                          <option value="stable">Stable</option>
                          <option value="at-risk">At-Risk</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Price Index (%)</label>
                        <input
                          className={inputClass}
                          type="number"
                          value={form.price_index}
                          onChange={(e) => set("price_index", parseFloat(e.target.value))}
                          placeholder="+12 or -5"
                          step="0.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-base font-semibold text-gray-900">Stakeholder Sentiment</h2>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className={labelClass.replace("mb-1.5", "mb-0")}>Satisfaction Score</label>
                      <span className={`text-sm font-semibold ${
                        form.satisfaction_score >= 80 ? "text-emerald-600" :
                        form.satisfaction_score >= 65 ? "text-amber-600" : "text-red-600"
                      }`}>{form.satisfaction_score}/100</span>
                    </div>
                    <input
                      type="range" min="0" max="100"
                      value={form.satisfaction_score}
                      onChange={(e) => set("satisfaction_score", parseInt(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>Dissatisfied</span><span>Neutral</span><span>Highly satisfied</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Stakeholder Comments</label>
                    <textarea
                      className={inputClass}
                      rows={3}
                      value={form.stakeholder_comments}
                      onChange={(e) => set("stakeholder_comments", e.target.value)}
                      placeholder="Qualitative feedback from internal stakeholders about this vendor…"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex justify-between items-center rounded-b-xl">
              <div>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    ← Back
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <Link href="/">
                  <button type="button" className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                    Cancel
                  </button>
                </Link>
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center gap-2"
                  >
                    {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                    {loading ? "Creating…" : "Create Contract"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </main>
    </AppShell>
  );
}
