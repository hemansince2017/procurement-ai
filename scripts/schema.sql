-- Create contracts table
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('SaaS', 'Cloud Infrastructure', 'Professional Services', 'Hardware')),
  contract_value DECIMAL(15,2) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  payment_terms TEXT NOT NULL,
  auto_renewal_clause BOOLEAN NOT NULL DEFAULT false,
  key_obligations TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create usage_data table
CREATE TABLE usage_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  utilization_percentage DECIMAL(5,2) NOT NULL CHECK (utilization_percentage >= 0 AND utilization_percentage <= 100),
  usage_trend TEXT NOT NULL CHECK (usage_trend IN ('increasing', 'stable', 'declining')),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create market_analysis table
CREATE TABLE market_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  market_rate_comparison TEXT NOT NULL CHECK (market_rate_comparison IN ('below', 'at', 'above')),
  vendor_financial_health TEXT NOT NULL CHECK (vendor_financial_health IN ('stable', 'at-risk', 'strong')),
  price_index DECIMAL(5,2) NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create sentiment table
CREATE TABLE sentiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  satisfaction_score DECIMAL(5,2) NOT NULL CHECK (satisfaction_score >= 0 AND satisfaction_score <= 100),
  stakeholder_comments TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create ai_recommendations table
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  narrative TEXT NOT NULL,
  risk_flags JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_contracts_category ON contracts(category);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
CREATE INDEX idx_usage_data_contract_id ON usage_data(contract_id);
CREATE INDEX idx_market_analysis_contract_id ON market_analysis(contract_id);
CREATE INDEX idx_sentiment_contract_id ON sentiment(contract_id);
CREATE INDEX idx_ai_recommendations_contract_id ON ai_recommendations(contract_id);

-- Enable Row Level Security (optional, but recommended for multi-tenant apps)
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
