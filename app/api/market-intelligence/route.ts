import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

// Product/edition words that should be stripped before searching EDGAR
// e.g. "Snowflake Data Cloud" → "Snowflake", "CrowdStrike Falcon" → "CrowdStrike"
const STRIP_WORDS = new Set([
  "data", "cloud", "suite", "enterprise", "platform", "services", "service",
  "identity", "falcon", "hcm", "itsm", "crm", "erp", "ai", "pro", "plus",
  "one", "hub", "360", "365", "studio", "online", "web", "app", "apps",
  "software", "solutions", "solution", "technologies", "technology", "systems",
  "system", "group", "inc", "corp", "llc", "ltd", "co",
]);

function normalizeVendorName(name: string): string {
  // Remove common product/edition suffixes to get the core company name
  const words = name.toLowerCase().trim().split(/\s+/);
  // Keep leading words until we hit a pure strip-word
  const coreWords: string[] = [];
  for (const w of words) {
    if (STRIP_WORDS.has(w) && coreWords.length > 0) break;
    if (!STRIP_WORDS.has(w)) coreWords.push(w);
  }
  return (coreWords.length > 0 ? coreWords : words).join(" ");
}

// Search SEC EDGAR for a company using the company tickers JSON (most reliable)
async function searchEdgarCompany(query: string) {
  const headers = { "User-Agent": "ContractAI procurement-ai-app@demo.com" };
  const queryLower = query.toLowerCase().trim();
  // Also try with product words stripped (e.g. "Snowflake Data Cloud" → "snowflake")
  const normalizedQuery = normalizeVendorName(query);

  // Fetch SEC's full company tickers index (~1MB, has every public company)
  const res = await fetch("https://www.sec.gov/files/company_tickers.json", { headers });
  if (!res.ok) throw new Error("Failed to fetch SEC company list");
  const data: Record<string, { cik_str: number; ticker: string; title: string }> =
    await res.json();

  const entries = Object.values(data);

  // 1. Exact name match (original or normalized)
  let match = entries.find((e) => e.title.toLowerCase() === queryLower)
    ?? entries.find((e) => e.title.toLowerCase() === normalizedQuery);

  // 2. Exact ticker match
  if (!match) match = entries.find((e) => e.ticker.toLowerCase() === queryLower)
    ?? entries.find((e) => e.ticker.toLowerCase() === normalizedQuery);

  // 3. Name starts-with (normalized first — more precise)
  if (!match) match = entries.find((e) => e.title.toLowerCase().startsWith(normalizedQuery))
    ?? entries.find((e) => e.title.toLowerCase().startsWith(queryLower));

  // 4. Name contains all words in query
  if (!match) {
    const words = normalizedQuery.split(/\s+/).filter(Boolean);
    match = entries.find((e) => words.every((w) => e.title.toLowerCase().includes(w)));
  }

  // 5. Try each significant word longest-first so "snowflake" (9) wins over "data" (4)
  if (!match) {
    const words = normalizedQuery.split(/\s+/)
      .filter((w) => w.length >= 4)
      .sort((a, b) => b.length - a.length);
    for (const word of words) {
      const found = entries.find((e) => e.title.toLowerCase().includes(word));
      if (found) { match = found; break; }
    }
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

function parseFiscalYearEnd(mmdd: string | undefined): string {
  if (!mmdd || mmdd.length !== 4) return "";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = parseInt(mmdd.slice(0, 2), 10);
  const day = parseInt(mmdd.slice(2, 4), 10);
  if (month < 1 || month > 12) return "";
  return `${months[month - 1]} ${day}`;
}

// ── Shared JSON parse + repair ────────────────────────────────
function parseClaudeJSON(rawText: string): Record<string, unknown> {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude returned invalid JSON");
  let jsonStr = jsonMatch[0];
  try {
    return JSON.parse(jsonStr);
  } catch {
    const opens = (jsonStr.match(/\[/g) || []).length;
    const closes = (jsonStr.match(/\]/g) || []).length;
    const objOpens = (jsonStr.match(/\{/g) || []).length;
    const objCloses = (jsonStr.match(/\}/g) || []).length;
    jsonStr = jsonStr.replace(/,\s*$/, "").replace(/,\s*\{[^}]*$/, "");
    jsonStr += "]".repeat(Math.max(0, opens - closes));
    jsonStr += "}".repeat(Math.max(0, objOpens - objCloses));
    return JSON.parse(jsonStr);
  }
}

// ── Yahoo Finance data fetch ──────────────────────────────────
async function fetchYahooData(ticker: string): Promise<{
  eps: { period: string; actual: number }[];
  analyst: { consensus: string; mean: number; count: number } | null;
} | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=earningsHistory%2CfinancialData`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.quoteSummary?.result?.[0];
    if (!result) return null;

    const eps = (result.earningsHistory?.history ?? [])
      .slice(0, 4)
      .map((h: any) => ({ period: h.quarter?.fmt ?? "", actual: h.epsActual?.raw ?? null }))
      .filter((h: any) => h.actual !== null)
      .reverse(); // chronological order

    const fd = result.financialData;
    const analyst = fd?.recommendationKey ? {
      consensus: fd.recommendationKey as string,
      mean: fd.recommendationMean?.raw ?? null,
      count: fd.numberOfAnalystOpinions?.raw ?? 0,
    } : null;

    return { eps, analyst };
  } catch {
    return null;
  }
}

// ── Shared Claude JSON schema ─────────────────────────────────
function buildIntelligenceSchema(opts: { hasYahoo: boolean; isPrivate: boolean }) {
  const base = `{
  "companyOverview": "<2-3 sentences on what the company does, value prop, and customer base>",
  "products": ["<product/platform name>"],
  "segments": [{ "name": "<segment name>", "revenueShare": <integer 0-100> }],
  "executives": [{ "name": "<full name>", "title": "<title>" }],
  "posture": "low" | "moderate" | "high",
  "postureScore": <0-100>,
  "postureLabel": "<2-4 word label>",
  "narrative": "<2-3 sentences on negotiation dynamic>",
  "topAction": "<1 tactical action before renewal>",
  "levers": [{ "priority": "high"|"medium"|"low", "title": "<title>", "detail": "<1-2 sentences>", "action": "<action>" }],
  "risks": [{ "priority": "high"|"medium"|"low", "title": "<title>", "detail": "<1-2 sentences>", "action": "<mitigation>" }],
  "opportunities": [{ "priority": "high"|"medium"|"low", "title": "<title>", "detail": "<1-2 sentences>", "action": "<how to capture>" }]`;

  const epsAnalyst = !opts.hasYahoo && !opts.isPrivate ? `,
  "epsEstimates": [{ "period": "<YYYY-MM-DD>", "actual": <number> }],
  "analystRating": { "consensus": "strongBuy"|"buy"|"hold"|"underperform"|"sell", "mean": <1.0-5.0>, "count": <integer>, "source": "ai" }` : "";

  const funding = opts.isPrivate ? `,
  "fundingInfo": { "estimatedValuation": "<string or null>", "lastRound": "<e.g. Series D - $400M (2021) or null>", "totalFunding": "<string or null>", "notableInvestors": ["<name>"], "note": "<1 sentence on reliability of this data>" }` : "";

  return base + epsAnalyst + funding + "\n}";
}

const SCHEMA_RULES = `Rules:
- products: 4-6 main product lines (short names)
- segments: 3-5 BUs with revenueShare summing to 100
- executives: exactly 4 — CEO, CFO, and 2 others (CTO/CPO/COO/President)
- exactly 3 items each in levers, risks, opportunities
- Respond with ONLY the JSON object, no other text`;

// ── AI-only fallback (private/unlisted company) ───────────────
async function generateAIOnlyIntelligence(company: string) {
  const schema = buildIntelligenceSchema({ hasYahoo: false, isPrivate: true });
  const prompt = `You are an expert enterprise procurement strategist. A procurement professional needs negotiation intelligence for a vendor contract with "${company}".

This company is not publicly traded or not found in SEC EDGAR. Use your training knowledge to generate the most useful negotiation intelligence you can.

Respond ONLY in valid JSON matching this exact structure:
${schema}

${SCHEMA_RULES}
- For fundingInfo: include known funding rounds, valuation, and investors if the company is a known startup/private company; set fields to null if unknown
- Base posture/narrative on known market position, competitive alternatives, and switching costs
- Be honest in the narrative that this is AI-generated, not from audited financials`;

  const aiResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";
  return parseClaudeJSON(rawText);
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

    // ── Try SEC EDGAR path ──────────────────────────────────────
    let responseData: Record<string, unknown>;

    try {
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
      const fiscalYearEnd = parseFiscalYearEnd(meta.fiscalYearEnd);

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

      // 4. Build financial summary for Claude
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
Recent quarterly revenues: ${revenues.slice(0, 4).map((r) => `$${(r.value / 1e6).toFixed(0)}M (${r.end})`).join(", ")}`.trim();

      // 5. Run Yahoo Finance + Claude in parallel
      // Claude schema always includes epsEstimates/analystRating as AI fallback;
      // if Yahoo succeeds those Claude fields are overridden by real data.
      const secSchema = buildIntelligenceSchema({ hasYahoo: false, isPrivate: false });
      const claudePrompt = `You are an expert enterprise procurement strategist with deep expertise in vendor negotiations and enterprise software.

A procurement professional is preparing to negotiate or renew a contract with this vendor. Based on the SEC EDGAR financial data below and your knowledge of this company, produce a comprehensive intelligence report.

${financialSummary}

Respond ONLY in valid JSON matching this exact structure:
${secSchema}

${SCHEMA_RULES}
- Base financials analysis on the actual SEC data; use your knowledge for products/segments/executives
- For epsEstimates: provide actual/estimated quarterly EPS for last 4 quarters in chronological order (oldest first), period as YYYY-MM-DD
- For analystRating: provide your best estimate based on financial health, growth, and market position`;

      const [yahooData, aiResponse] = await Promise.all([
        fetchYahooData(ticker),
        anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          messages: [{ role: "user", content: claudePrompt }],
        }),
      ]);

      const rawText = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";
      const intelligence = parseClaudeJSON(rawText);

      // Build marketMetrics: prefer live Yahoo data, fall back to Claude's AI estimates
      const marketMetrics = yahooData
        ? {
            eps: yahooData.eps,
            analystRating: yahooData.analyst
              ? { ...yahooData.analyst, source: "yahoo" as const }
              : null,
            source: "yahoo" as const,
          }
        : (intelligence.epsEstimates || intelligence.analystRating)
        ? {
            eps: (intelligence.epsEstimates as any[]) ?? [],
            analystRating: intelligence.analystRating
              ? { ...(intelligence.analystRating as object), source: "ai" as const }
              : null,
            source: "ai" as const,
          }
        : null;

      responseData = {
        source: "sec",
        company: { name: companyName, ticker, cik, industry: sicDesc, stateOfInc, fiscalYearEnd },
        financials,
        intelligence,
        marketMetrics,
      };

    } catch (edgarError) {
      // ── EDGAR failed → fall back to AI-only analysis ──────────
      console.log(`EDGAR lookup failed for "${company}", falling back to AI analysis:`, edgarError instanceof Error ? edgarError.message : edgarError);

      const intelligence = await generateAIOnlyIntelligence(company);

      responseData = {
        source: "ai",
        company: { name: company, ticker: null, cik: null, industry: null, stateOfInc: null, fiscalYearEnd: null },
        financials: null,
        intelligence,
      };
    }

    // Write to cache
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
