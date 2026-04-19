import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateBenchmark } from "@/app/api/contracts/[id]/benchmark/route";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const supabase = getAdminClient();
  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "true";

  try {
    // 1. Fetch all contracts
    const { data: contracts, error } = await supabase
      .from("contracts")
      .select("id, vendor_name, category, contract_value, start_date, end_date, payment_terms, key_obligations")
      .order("contract_value", { ascending: false });

    if (error) throw error;
    if (!contracts || contracts.length === 0) return NextResponse.json([]);

    // 2. Fetch all cached benchmarks
    const { data: cached } = await supabase
      .from("benchmark_cache")
      .select("contract_id, data, cached_at");

    const cacheMap = new Map<string, { data: Record<string, unknown>; cached_at: string }>();
    for (const row of cached ?? []) {
      cacheMap.set(row.contract_id, { data: row.data, cached_at: row.cached_at });
    }

    // 3. For contracts without cache, generate in parallel (max 5 concurrent)
    const uncached = forceRefresh
      ? contracts
      : contracts.filter((c) => !cacheMap.has(c.id));

    if (uncached.length > 0) {
      const BATCH = 5;
      for (let i = 0; i < uncached.length; i += BATCH) {
        const chunk = uncached.slice(i, i + BATCH);
        const results = await Promise.allSettled(
          chunk.map((c) => generateBenchmark(c.id, c))
        );
        // Save successful results to cache
        const toUpsert = results
          .map((r, idx) => r.status === "fulfilled" ? { contract_id: chunk[idx].id, data: r.value, cached_at: new Date().toISOString() } : null)
          .filter(Boolean) as { contract_id: string; data: Record<string, unknown>; cached_at: string }[];

        if (toUpsert.length > 0) {
          await supabase.from("benchmark_cache").upsert(toUpsert, { onConflict: "contract_id" });
        }

        // Update local map
        results.forEach((r, idx) => {
          if (r.status === "fulfilled") {
            cacheMap.set(chunk[idx].id, { data: r.value, cached_at: new Date().toISOString() });
          }
        });
      }
    }

    // 4. Assemble response: one entry per contract, with benchmark data where available
    const response = contracts.map((c) => {
      const entry = cacheMap.get(c.id);
      if (!entry) {
        return {
          contractId: c.id,
          vendorName: c.vendor_name,
          category: c.category,
          contractValue: c.contract_value,
          benchmarked: false,
        };
      }
      return { ...entry.data, benchmarked: true, cachedAt: entry.cached_at };
    });

    return NextResponse.json(response);
  } catch (err) {
    console.error("Benchmarking dashboard error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
