"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const FEATURES = [
  {
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    text: "AI-powered 0–100 renewal scores across your portfolio",
  },
  {
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    text: "Risk flags for auto-renewals, underutilization, and pricing",
  },
  {
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    text: "Live SEC EDGAR financials and negotiation intelligence",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg("Account created. Check your email to confirm, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left panel — Vercel Black */}
      <div className="hidden lg:flex lg:w-[44%] flex-col justify-between bg-[#171717] p-10 text-white">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[14px] font-semibold tracking-[-0.01em]">ContractAI</span>
        </div>

        {/* Hero copy */}
        <div>
          <h1 className="text-[32px] font-semibold leading-tight tracking-[-1.5px] mb-3 text-white">
            Smarter contract<br />decisions, powered<br />by AI
          </h1>
          <p className="text-[13px] text-[#808080] leading-relaxed mb-8 max-w-xs">
            Combine usage data, market analysis, and stakeholder sentiment to know exactly which contracts to renegotiate — and when.
          </p>
          <div className="space-y-3">
            {FEATURES.map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[6px] bg-white/10 text-[#808080]">
                  {icon}
                </div>
                <span className="text-[13px] text-[#666666] leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-[#4d4d4d] font-mono">Contract Intelligence Platform · Powered by Claude AI</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[340px]">
          {/* Mobile logo */}
          <div className="mb-7 flex items-center gap-2 lg:hidden">
            <svg className="h-5 w-5 text-[#171717]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[14px] font-semibold text-[#171717]">ContractAI</span>
          </div>

          <h2 className="text-[20px] font-semibold text-[#171717] tracking-[-0.5px] mb-1">
            {isSignUp ? "Create your account" : "Sign in"}
          </h2>
          <p className="text-[13px] text-[#666666] mb-6">
            {isSignUp ? "Start managing your contract portfolio." : "Access your contract portfolio."}
          </p>

          <form onSubmit={handleAuth} className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-[#171717] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full rounded-[6px] bg-white px-3.5 py-2.5 text-[13px] text-[#171717] placeholder-[#808080] transition-shadow focus:outline-none"
                style={{ boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px" }}
                onFocus={(e) => e.currentTarget.style.boxShadow = "hsla(212,100%,48%,1) 0px 0px 0px 2px"}
                onBlur={(e) => e.currentTarget.style.boxShadow = "rgba(0,0,0,0.08) 0px 0px 0px 1px"}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#171717] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-[6px] bg-white px-3.5 py-2.5 text-[13px] text-[#171717] placeholder-[#808080] transition-shadow focus:outline-none"
                style={{ boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px" }}
                onFocus={(e) => e.currentTarget.style.boxShadow = "hsla(212,100%,48%,1) 0px 0px 0px 2px"}
                onBlur={(e) => e.currentTarget.style.boxShadow = "rgba(0,0,0,0.08) 0px 0px 0px 1px"}
              />
            </div>

            {error && (
              <div
                className="rounded-[6px] bg-[#fef2f2] px-3.5 py-2.5 text-[12px] text-[#dc2626]"
                style={{ boxShadow: "rgba(220,38,38,0.15) 0px 0px 0px 1px" }}
              >
                {error}
              </div>
            )}
            {successMsg && (
              <div
                className="rounded-[6px] bg-[#f0fdf4] px-3.5 py-2.5 text-[12px] text-[#16a34a]"
                style={{ boxShadow: "rgba(22,163,74,0.15) 0px 0px 0px 1px" }}
              >
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[6px] bg-[#171717] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
            >
              {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {loading ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-[12px] text-[#666666]">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(""); setSuccessMsg(""); }}
              className="font-semibold text-[#0072f5] hover:text-[#0068d6] transition-colors"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
