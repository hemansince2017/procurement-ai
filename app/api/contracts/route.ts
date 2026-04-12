import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function GET() {
  const supabase = getAdminClient();
  try {
    const { data, error } = await supabase
      .from("contracts")
      .select("*, usage_data(*), market_analysis(*), sentiment(*), ai_recommendations(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = getAdminClient();
  try {
    const body = await request.json();
    const { usage_data, market_analysis, sentiment, ...contractData } = body;

    // Insert contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert([contractData])
      .select()
      .single();

    if (contractError) throw contractError;

    // Insert related data if provided
    if (usage_data) {
      await supabase.from("usage_data").insert([{ contract_id: contract.id, ...usage_data }]);
    }
    if (market_analysis) {
      await supabase.from("market_analysis").insert([{ contract_id: contract.id, ...market_analysis }]);
    }
    if (sentiment) {
      await supabase.from("sentiment").insert([{ contract_id: contract.id, ...sentiment }]);
    }

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create contract" },
      { status: 400 }
    );
  }
}
