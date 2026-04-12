import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

// Search SEC EDGAR for a company using the company tickers JSON (most reliable)
async function searchEdgarCompany(query: string) {
  const headers = { "User-Agent": "ContractAI procurement-ai-app@demo.com" };
  const queryLower = query.toLowerCase().trim();

  // Fetch SEC's full company tickers index (~1MB, has every public company)
  const res = await fetch("https://www.sec.gov/files/company_tickers.json", { headers });
  if (!res.ok) throw new Error("Failed to fetch SEC company list");
  const data: Record<string, { cik_str: number; ticker: string; title: string }> =
    await res.json();

  const entries = Object.values(data);

  // 1. Exact name match
  let match = entries.find((e) => e.title.toLowerCase() === queryLower);

  // 2. Exact ticker match
  if (!match) match = entries.find((e) => e.ticker.toLowerCase() === queryLower);

  // 3. Name starts-with match
  if (!match) match = entries.find((e) => e.title.toLowerCase().startsWith(queryLower));

  // 4. Name contains all words in query
  if (!match) {
    const words = queryLower.split(/\s+/).filter(Boolean);
    match = entries.find((e) => words.every((w) => e.title.toLowerCase().includes(w)));
  }

  // 5. Name contains any significant word (>= 4 chars)
  if (!match) {
    const words = queryLower.split(/\s+/).filter((w) => w.length >= 4);
    match = entries.find((e) => words.some((w) => e.title.toLowerCase().includes(w)));
  }

  if (!match) throw new Error(`"${query}" not found in SEC EDGAR. Try the full legal name (e.g. "Akamai Technologies" or ticker "AKAM").`);

  const cik = String(match.cik_str).padStart(10, "0");
  return { cik, name: match.title, ticker: match.ticker };
}

// Fetch company submission metadata (name, tickers, SIC, etc.)
async function getCompanyMeta(cik: string) {
  const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ContractAI procurement-ai-app@demo.com" },
  });
  if (!res.ok) throw new Error(`EDGAR submissions failed: ${res.status}`);
  return res.json();
}

// Fetch XBRL company facts (all financial data)
async function getCompanyFacts(cik: string) {
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ContractAI procurement-ai-app@demo.com" },
  });
  if (!res.ok) throw new Error(`EDGAR facts failed: ${res.status}`);
  return res.json();
}

// Extract the latest N quarterly values for a given XBRL concept
function extractLatestQuarterly(
  facts: Record<string, unknown>,
  concept: string,
  n = 5
): { value: number; end: string; form: string; filed: string }[] {
  // EDGAR companyfacts API wraps data under a "facts" key: { cik, entityName, facts: { "us-gaap": {...} } }
  const gaap = (facts as any)?.facts?.["us-gaap"] ?? (facts as any)?.["us-gaap"];
  if (!gaap) return [];
  const entry = gaap[concept];
  if (!entry?.units?.USD) return [];

  const quarterly = entry.units.USD
    .filter((d: any) => d.form === "10-Q" || d.form === "10-K")
    .filter((d: any) => d.end && d.val !== undefined)
    .sort((a: any, b: any) => new Date(b.end).getTime() - new Date(a.end).getTime());

  // Deduplicate by period end date
  const seen = new Set<string>();
  const deduped = quarterly.filter((d: any) => {
    if (seen.has(d.end)) return false;
    seen.add(d.end);
    return true;
  });

  return deduped.slice(0, n).map((d: any) => ({
    value: d.val,
    end: d.end,
    form: d.form,
    filed: d.filed,
  }));
}

// Try all concept names and return whichever has the most recent period end date.
// This handles companies that switched XBRL concepts over time (e.g. ASC 606 adoption).
function extractBestConcept(
  facts: Record<string, unknown>,
  concepts: string[]
): { value: number; end: string; form: string; filed: string }[] {
  const candidates = concepts
    .map((c) => extractLatestQuarterly(facts, c))
    .filter((r) => r.length > 0);

  if (candidates.length === 0) return [];

  // Pick the candidate whose most-recent entry is the latest
  return candidates.reduce((best, current) =>
    new Date(current[0].end) > new Date(best[0].end) ? current : best
  );
}

function calcYoY(current: number, prior: number) {
  if (!prior) return null;
  return Math.round(((current - prior) / Math.abs(prior)) * 1000) / 10;
}

export async function GET(request: NextRequest) {
  const company = request.nextUrl.searchParams.get("company");
  if (!company) {
    return NextResponse.json({ error: "company query param required" }, { status: 400 });
  }

  try {
    // 0. Check cache (skip if ?refresh=true)
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";
    const queryKey = company.trim().toLowerCase();

    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from("market_intelligence_cache")
        .select("data")
        .eq("query_key", queryKey)
        .single();

      if (cached) {
        return NextResponse.json({ ...cached.data, cached: true });
      }
    }

    // 1. Find company in EDGAR
    const { cik, name: edgarName, ticker: edgarTicker } = await searchEdgarCompany(company);

    // 2. Fetch meta + facts in parallel
    const [meta, facts] = await Promise.all([
      getCompanyMeta(cik),
      getCompanyFacts(cik),
    ]);

    const companyName = meta.name || edgarName;
    const ticker = meta.tickers?.[0] || edgarTicker || "";
    const sic = meta.sic || "";
    const sicDesc = meta.sicDescription || "";
    const stateOfInc = meta.stateOfIncorporation || "";

    // 3. Extract financials
    const revenues = extractBestConcept(facts, [
      "Revenues",
      "RevenueFromContractWithCustomerExcludingAssessedTax",
      "SalesRevenueNet",
      "RevenueFromContractWithCustomerIncludingAssessedTax",
    ]);
    const grossProfit = extractBestConcept(facts, ["GrossProfit"]);
    const operatingIncome = extractBestConcept(facts, [
      "OperatingIncomeLoss",
      "IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest",
    ]);
    const cash = extractBestConcept(facts, [
      "CashAndCashEquivalentsAtCarryingValue",
      "CashCashEquivalentsAndShortTermInvestments",
      "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
    ]);
    const netIncome = extractBestConcept(facts, ["NetIncomeLoss"]);

    const latestRevenue = revenues[0];
    const priorRevenue = revenues[4] || revenues[3] || revenues[1];
    const latestGross = grossProfit[0];
    const latestOpInc = operatingIncome[0];
    const latestCash = cash[0];

    const revenueYoY = latestRevenue && priorRevenue
      ? calcYoY(latestRevenue.value, priorRevenue.value)
      : null;

    const grossMarginPct = latestRevenue && latestGross
      ? Math.round((latestGross.value / latestRevenue.value) * 1000) / 10
      : null;

    // Annualize quarterly revenue if needed
    const isQuarterly = latestRevenue?.form === "10-Q";
    const annualRevenue = isQuarterly ? latestRevenue.value * 4 : latestRevenue?.value;

    const financials = {
      revenue: annualRevenue,
      revenueRaw: latestRevenue?.value,
      revenueYoY,
      grossMarginPct,
      operatingIncome: latestOpInc?.value,
      cash: latestCash?.value,
      netIncome: netIncome[0]?.value,
      latestPeriod: latestRevenue?.end,
      latestFiled: latestRevenue?.filed,
      latestForm: latestRevenue?.form,
      isQuarterly,
    };

    // 4. Build financial summary string for Claude
    const financialSummary = `
Company: ${companyName} (${ticker})
Industry/SIC: ${sicDesc} (${sic})
State of Incorporation: ${stateOfInc}

Latest ${financials.latestForm} period ending ${financials.latestPeriod} (filed ${financials.latestFiled}):
- Revenue (${isQuarterly ? "quarterly" : "annual"}): $${((financials.revenueRaw || 0) / 1e6).toFixed(0)}M ${revenueYoY !== null ? `(YoY: ${revenueYoY > 0 ? "+" : ""}${revenueYoY}%)` : ""}
- Annualized Revenue Run Rate: $${((annualRevenue || 0) / 1e9).toFixed(2)}B
- Gross Margin: ${grossMarginPct !== null ? `${grossMarginPct}%` : "N/A"}
- Operating Income: ${latestOpInc ? `$${(latestOpInc.value / 1e6).toFixed(0)}M` : "N/A"}
- Cash & Equivalents: ${latestCash ? `$${(latestCash.value / 1e6).toFixed(0)}M` : "N/A"}

Recent quarterly revenues: ${revenues.slice(0, 4).map((r) => `$${(r.value / 1e6).toFixed(0)}M (${r.end})`).join(", ")}
    `.trim();

    // 5. Claude analysis for negotiation intelligence
    const claudePrompt = `You are an expert enterprise procurement strategist with deep expertise in vendor negotiations.

A procurement professional is preparing to negotiate or renew a contract with this vendor. Based on the SEC EDGAR financial data below, produce a structured negotiation intelligence report.

${financialSummary}

Respond ONLY in valid JSON matching this exact structure:
{
  "posture": "low" | "moderate" | "high",
  "postureScore": <0-100, where 0=seller has all power, 100=buyer has all power>,
  "postureLabel": "<2-4 word label like 'Moderate Leverage' or 'Strong Buyer Position'>",
  "narrative": "<2-3 sentences explaining the overall negotiation dynamic based on the financials>",
  "topAction": "<1 specific, tactical action the buyer should take before entering renewal negotiations>",
  "levers": [
    { "priority": "high" | "medium" | "low", "title": "<lever title>", "detail": "<2-3 sentences explaining the lever and how to use it>", "action": "<specific action to take>" }
  ],
  "risks": [
    { "priority": "high" | "medium" | "low", "title": "<risk title>", "detail": "<2-3 sentences explaining the risk>", "action": "<how to mitigate>" }
  ],
  "opportunities": [
    { "priority": "high" | "medium" | "low", "title": "<opportunity title>", "detail": "<2-3 sentences explaining the opportunity>", "action": "<how to capture it>" }
  ]
}

Include exactly 3 items in each of levers, risks, and opportunities. Keep each "detail" field to 1-2 sentences max and "action" to 1 sentence. Base everything on the actual financial data. Do not invent facts not supported by the data. Respond with ONLY the JSON object, no other text.`;

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: claudePrompt }],
    });

    const rawText = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Claude returned invalid JSON");

    // Attempt to repair truncated JSON by closing open arrays/objects
    let jsonStr = jsonMatch[0];
    let intelligence: Record<string, unknown>;
    try {
      intelligence = JSON.parse(jsonStr);
    } catch {
      // Count unclosed brackets and close them
      const opens = (jsonStr.match(/\[/g) || []).length;
      const closes = (jsonStr.match(/\]/g) || []).length;
      const objOpens = (jsonStr.match(/\{/g) || []).length;
      const objCloses = (jsonStr.match(/\}/g) || []).length;
      // Strip trailing comma/incomplete entry then close
      jsonStr = jsonStr.replace(/,\s*$/, "").replace(/,\s*\{[^}]*$/, "");
      jsonStr += "]".repeat(Math.max(0, opens - closes));
      jsonStr += "}".repeat(Math.max(0, objOpens - objCloses));
      intelligence = JSON.parse(jsonStr);
    }

    const responseData = {
      company: {
        name: companyName,
        ticker,
        cik,
        industry: sicDesc,
        stateOfInc,
      },
      financials,
      intelligence,
    };

    // Write to cache (upsert so Refresh button overwrites stale entry)
    await supabase.from("market_intelligence_cache").upsert(
      { query_key: queryKey, data: responseData, cached_at: new Date().toISOString() },
      { onConflict: "query_key" }
    );

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Market intelligence error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch market intelligence" },
      { status: 500 }
    );
  }
}
