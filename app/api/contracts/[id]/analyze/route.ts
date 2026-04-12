import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { generateRecommendation } from "@/lib/claude";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getAdminClient();

  try {
    const { data: contract, error } = await supabase
      .from("contracts")
      .select("*, usage_data(*), market_analysis(*), sentiment(*), ai_recommendations(*)")
      .eq("id", id)
      .single();

    if (error || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // Flatten array relations to single objects
    const contractWithSignals = {
      ...contract,
      usage_data: contract.usage_data?.[0],
      market_analysis: contract.market_analysis?.[0],
      sentiment: contract.sentiment?.[0],
      ai_recommendation: contract.ai_recommendations?.[0],
    };

    const recommendation = await generateRecommendation(contractWithSignals);

    // Upsert recommendation
    const { error: saveError } = await supabase
      .from("ai_recommendations")
      .upsert(
        {
          contract_id: id,
          score: recommendation.score,
          narrative: recommendation.narrative,
          risk_flags: recommendation.risk_flags,
        },
        { onConflict: "contract_id" }
      );

    if (saveError) throw saveError;

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze" },
      { status: 500 }
    );
  }
}
