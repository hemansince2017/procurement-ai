import Anthropic from "@anthropic-ai/sdk";
import { ContractWithSignals } from "./types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface RecommendationResult {
  score: number;
  narrative: string;
  risk_flags: string[];
}

export async function generateRecommendation(
  contract: ContractWithSignals
): Promise<RecommendationResult> {
  const daysUntilRenewal = Math.ceil(
    (new Date(contract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const prompt = `You are an expert procurement analyst evaluating contract renewal opportunities. Analyze the following contract based on 4 key signals and provide a renewal recommendation score (0-100) where higher scores indicate a stronger case to negotiate an early renewal.

CONTRACT DETAILS:
- Vendor: ${contract.vendor_name}
- Category: ${contract.category}
- Contract Value: $${contract.contract_value?.toLocaleString() || "N/A"}
- Start Date: ${contract.start_date}
- End Date: ${contract.end_date} (${daysUntilRenewal} days until renewal)
- Payment Terms: ${contract.payment_terms}
- Auto-Renewal Clause: ${contract.auto_renewal_clause ? "Yes" : "No"}
- Key Obligations: ${contract.key_obligations || "Not specified"}

SIGNAL 1 - USAGE ANALYSIS:
- Utilization: ${contract.usage_data?.utilization_percentage || 0}%
- Trend: ${contract.usage_data?.usage_trend || "unknown"}

SIGNAL 2 - MARKET ANALYSIS:
- Market Rate Comparison: ${contract.market_analysis?.market_rate_comparison || "unknown"}
- Vendor Financial Health: ${contract.market_analysis?.vendor_financial_health || "unknown"}
- Price Index (% vs market): ${contract.market_analysis?.price_index || 0}%

SIGNAL 3 - STAKEHOLDER SENTIMENT:
- Satisfaction Score: ${contract.sentiment?.satisfaction_score || 0}/100
- Comments: ${contract.sentiment?.stakeholder_comments || "No feedback"}

SIGNAL 4 - CONTRACT TERMS:
- Auto-renewal timing and obligations as noted above

Based on these 4 signals, provide your analysis in the following JSON format (and ONLY this format, no additional text):
{
  "score": <number between 0-100>,
  "narrative": "<2-3 sentence explanation of the recommendation>",
  "risk_flags": [<array of specific risk flags based on the data>]
}

Key considerations:
- High utilization (>80%) with positive sentiment = higher priority to negotiate
- Low utilization (<50%) = potential cost optimization opportunity
- Above-market pricing with good vendor health = opportunity to negotiate down
- At-risk vendor + high auto-renewal = urgent renewal needed
- Stakeholder dissatisfaction = prioritize renegotiation`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    const result = JSON.parse(content.text);
    return {
      score: Math.min(100, Math.max(0, result.score)),
      narrative: result.narrative,
      risk_flags: Array.isArray(result.risk_flags) ? result.risk_flags : [],
    };
  } catch {
    throw new Error(`Failed to parse Claude response: ${content.text}`);
  }
}
