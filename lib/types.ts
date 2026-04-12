export type ContractCategory =
  | "SaaS"
  | "Cloud Infrastructure"
  | "Professional Services"
  | "Hardware";

export interface Contract {
  id: string;
  vendor_name: string;
  category: ContractCategory;
  contract_value: number;
  start_date: string;
  end_date: string;
  payment_terms: string;
  auto_renewal_clause: boolean;
  key_obligations: string;
  created_at: string;
  updated_at: string;
}

export interface UsageData {
  id: string;
  contract_id: string;
  utilization_percentage: number;
  usage_trend: "increasing" | "stable" | "declining";
  updated_at: string;
}

export interface MarketAnalysis {
  id: string;
  contract_id: string;
  market_rate_comparison: "below" | "at" | "above";
  vendor_financial_health: "stable" | "at-risk" | "strong";
  price_index: number;
  updated_at: string;
}

export interface Sentiment {
  id: string;
  contract_id: string;
  satisfaction_score: number;
  stakeholder_comments: string;
  updated_at: string;
}

export interface AIRecommendation {
  id: string;
  contract_id: string;
  score: number;
  narrative: string;
  risk_flags: string[];
  created_at: string;
}

export interface ContractWithSignals extends Contract {
  usage_data?: UsageData;
  market_analysis?: MarketAnalysis;
  sentiment?: Sentiment;
  ai_recommendation?: AIRecommendation;
}
