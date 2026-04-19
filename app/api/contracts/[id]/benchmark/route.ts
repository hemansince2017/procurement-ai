import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

function termMonths(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round(
    (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  );
}

function parseClaudeJSON(raw: string): Record<string, unknown> {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in Claude response");
  let str = match[0];
  try {
    return JSON.parse(str);
  } catch {
    const oBal = (str.match(/\{/g) ?? []).length - (str.match(/\}/g) ?? []).length;
    const aBal = (str.match(/\[/g) ?? []).length - (str.match(/\]/g) ?? []).length;
    str = str.replace(/,\s*$/, "");
    str += "]".repeat(Math.max(0, aBal));
    str += "}".repeat(Math.max(0, oBal));
    return JSON.parse(str);
  }
}

export async function generateBenchmark(
  id: string,
  contract: {
    vendor_name: string; category: string; contract_value: number;
    start_date: string; end_date: string; payment_terms: string; key_obligations: string;
  }
): Promise<Record<string, unknown>> {
  const months = termMonths(contract.start_date, contract.end_date);
  const annualValue = months > 0 ? (contract.contract_value / months) * 12 : contract.contract_value;
  const monthlyValue = months > 0 ? contract.contract_value / months : contract.contract_value;

  const prompt = `You are an enterprise procurement pricing analyst. Analyze this software contract and provide rate benchmarking data.

Contract details:
- Vendor: ${contract.vendor_name}
- Category: ${contract.category}
- Total contract value: $${contract.contract_value.toLocaleString()}
- Term: ${months} months (${contract.start_date} to ${contract.end_date})
- Annual value: $${Math.round(annualValue).toLocaleString()}
- Monthly value: $${Math.round(monthlyValue).toLocaleString()}
- Payment terms: ${contract.payment_terms}
- Key obligations: ${contract.key_obligations}

Based on your knowledge of enterprise software pricing in the ${contract.category} category for ${contract.vendor_name}, provide rate benchmarking analysis.

Respond ONLY with valid JSON matching this exact structure:
{
  "unitType": "<the natural pricing unit for this software, e.g. 'per seat/month', 'per TB/month', 'per user/year', 'per API call', 'flat/year'>",
  "estimatedUnitCount": <estimated number of units based on contract value and typical pricing — integer>,
  "contractUnitRate": <derived unit rate = contract_value / term / units, rounded to 2 decimal places>,
  "marketRates": {
    "low": <market low unit rate — best negotiated rate, 2dp>,
    "median": <market median unit rate, 2dp>,
    "high": <market high/list price unit rate, 2dp>,
    "currency": "USD"
  },
  "percentile": <integer 0-100, where this contract sits in the market — 50=median, 80=expensive, 20=great deal>,
  "annualOverspend": <estimated annual dollar amount overpaid vs median — negative means savings vs median>,
  "totalTermOverspend": <annualOverspend * (months/12), 2dp>,
  "benchmarkSources": [
    { "source": "<e.g. Gartner, G2 Crowd, Peer data, IDC>", "rate": <rate>, "unit": "<unit>", "year": <year integer> }
  ],
  "rateHistory": [
    { "label": "<e.g. 'Market 2022', 'Market 2023', 'Market 2024'>", "rate": <rate>, "type": "market" },
    { "label": "<e.g. 'Your Rate'>", "rate": <contractUnitRate>, "type": "contract" }
  ],
  "negotiationTarget": <realistic target unit rate if negotiated well — between low and median>,
  "targetSavingsAnnual": <annual savings if rate reduced to negotiationTarget>,
  "insight": "<2-3 sentences: how this rate compares to market, key drivers of over/under-pricing, and the single most impactful negotiation lever>",
  "confidence": "high" | "medium" | "low"
}

Rules:
- benchmarkSources: 3-4 realistic sources with rates and years
- rateHistory: 3-4 data points showing market trend + contract rate
- If category is well-known (Salesforce, AWS, Snowflake, etc.) use precise market knowledge; otherwise estimate conservatively
- confidence: "high" if you have strong pricing knowledge for this vendor/category, "medium" if approximate, "low" if speculative`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = response.content[0].type === "text" ? response.content[0].text : "";
  const benchmark = parseClaudeJSON(rawText);

  return {
    contractId: id,
    vendorName: contract.vendor_name,
    category: contract.category,
    contractValue: contract.contract_value,
    termMonths: months,
    annualValue: Math.round(annualValue),
    monthlyValue: Math.round(monthlyValue),
    startDate: contract.start_date,
    endDate: contract.end_date,
    ...benchmark,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getAdminClient();
  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "true";

  try {
    // 1. Check cache
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from("benchmark_cache")
        .select("data")
        .eq("contract_id", id)
        .single();
      if (cached) return NextResponse.json({ ...cached.data, cached: true });
    }

    // 2. Fetch contract
    const { data: contract, error } = await supabase
      .from("contracts")
      .select("vendor_name, category, contract_value, start_date, end_date, payment_terms, key_obligations")
      .eq("id", id)
      .single();

    if (error || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // 3. Generate benchmark
    const result = await generateBenchmark(id, contract);

    // 4. Save to cache
    await supabase.from("benchmark_cache").upsert(
      { contract_id: id, data: result, cached_at: new Date().toISOString() },
      { onConflict: "contract_id" }
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Benchmark error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate benchmark" },
      { status: 500 }
    );
  }
}
