import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const mockContracts = [
  {
    vendor_name: "CloudTech Solutions",
    category: "Cloud Infrastructure",
    contract_value: 450000,
    start_date: "2022-01-15",
    end_date: "2025-01-15",
    payment_terms: "Net 30",
    auto_renewal_clause: true,
    key_obligations: "99.9% uptime SLA, 24/7 support",
    usage_data: {
      utilization_percentage: 85,
      usage_trend: "increasing",
    },
    market_analysis: {
      market_rate_comparison: "below",
      vendor_financial_health: "strong",
      price_index: -5,
    },
    sentiment: {
      satisfaction_score: 88,
      stakeholder_comments: "Excellent performance, would like to expand",
    },
  },
  {
    vendor_name: "DataVault Pro",
    category: "Cloud Infrastructure",
    contract_value: 320000,
    start_date: "2021-06-01",
    end_date: "2025-06-01",
    payment_terms: "Net 45",
    auto_renewal_clause: false,
    key_obligations: "Data encryption, compliance reporting",
    usage_data: {
      utilization_percentage: 45,
      usage_trend: "declining",
    },
    market_analysis: {
      market_rate_comparison: "above",
      vendor_financial_health: "stable",
      price_index: 12,
    },
    sentiment: {
      satisfaction_score: 62,
      stakeholder_comments: "Functional but overpriced for our current usage",
    },
  },
  {
    vendor_name: "Slack Enterprise",
    category: "SaaS",
    contract_value: 85000,
    start_date: "2023-03-01",
    end_date: "2026-03-01",
    payment_terms: "Annual",
    auto_renewal_clause: true,
    key_obligations: "Workspace administration, user management",
    usage_data: {
      utilization_percentage: 92,
      usage_trend: "increasing",
    },
    market_analysis: {
      market_rate_comparison: "at",
      vendor_financial_health: "strong",
      price_index: 0,
    },
    sentiment: {
      satisfaction_score: 95,
      stakeholder_comments: "Critical for team collaboration, highly satisfied",
    },
  },
  {
    vendor_name: "Figma Design Suite",
    category: "SaaS",
    contract_value: 120000,
    start_date: "2022-09-01",
    end_date: "2025-09-01",
    payment_terms: "Annual",
    auto_renewal_clause: true,
    key_obligations: "Team collaboration, unlimited projects",
    usage_data: {
      utilization_percentage: 78,
      usage_trend: "stable",
    },
    market_analysis: {
      market_rate_comparison: "below",
      vendor_financial_health: "strong",
      price_index: -3,
    },
    sentiment: {
      satisfaction_score: 85,
      stakeholder_comments: "Great tool, design team loves it",
    },
  },
  {
    vendor_name: "Salesforce CRM",
    category: "SaaS",
    contract_value: 500000,
    start_date: "2020-01-01",
    end_date: "2025-01-01",
    payment_terms: "Quarterly",
    auto_renewal_clause: true,
    key_obligations: "Custom development support, training",
    usage_data: {
      utilization_percentage: 65,
      usage_trend: "declining",
    },
    market_analysis: {
      market_rate_comparison: "above",
      vendor_financial_health: "strong",
      price_index: 8,
    },
    sentiment: {
      satisfaction_score: 70,
      stakeholder_comments: "Legacy system, considering alternatives",
    },
  },
  {
    vendor_name: "AWS Infrastructure",
    category: "Cloud Infrastructure",
    contract_value: 1200000,
    start_date: "2021-01-01",
    end_date: "2025-01-01",
    payment_terms: "Monthly",
    auto_renewal_clause: false,
    key_obligations: "Reserved instances, support package",
    usage_data: {
      utilization_percentage: 88,
      usage_trend: "increasing",
    },
    market_analysis: {
      market_rate_comparison: "at",
      vendor_financial_health: "strong",
      price_index: 2,
    },
    sentiment: {
      satisfaction_score: 82,
      stakeholder_comments: "Solid platform, complex pricing model",
    },
  },
  {
    vendor_name: "Deloitte Consulting",
    category: "Professional Services",
    contract_value: 750000,
    start_date: "2023-01-01",
    end_date: "2025-12-31",
    payment_terms: "Monthly billing",
    auto_renewal_clause: false,
    key_obligations: "Digital transformation project, 3-year engagement",
    usage_data: {
      utilization_percentage: 72,
      usage_trend: "stable",
    },
    market_analysis: {
      market_rate_comparison: "at",
      vendor_financial_health: "strong",
      price_index: 0,
    },
    sentiment: {
      satisfaction_score: 78,
      stakeholder_comments: "Good project delivery, high rates",
    },
  },
  {
    vendor_name: "Dell Hardware",
    category: "Hardware",
    contract_value: 280000,
    start_date: "2023-06-01",
    end_date: "2026-06-01",
    payment_terms: "Net 60",
    auto_renewal_clause: false,
    key_obligations: "Equipment supply, warranty, support",
    usage_data: {
      utilization_percentage: 95,
      usage_trend: "increasing",
    },
    market_analysis: {
      market_rate_comparison: "below",
      vendor_financial_health: "strong",
      price_index: -7,
    },
    sentiment: {
      satisfaction_score: 80,
      stakeholder_comments: "Reliable vendor, good pricing",
    },
  },
  {
    vendor_name: "Zoom Video Platform",
    category: "SaaS",
    contract_value: 95000,
    start_date: "2022-01-01",
    end_date: "2025-01-01",
    payment_terms: "Annual",
    auto_renewal_clause: true,
    key_obligations: "Unlimited meetings, user management",
    usage_data: {
      utilization_percentage: 88,
      usage_trend: "increasing",
    },
    market_analysis: {
      market_rate_comparison: "below",
      vendor_financial_health: "strong",
      price_index: -4,
    },
    sentiment: {
      satisfaction_score: 92,
      stakeholder_comments: "Essential tool post-pandemic, great value",
    },
  },
  {
    vendor_name: "Microsoft 365",
    category: "SaaS",
    contract_value: 180000,
    start_date: "2020-01-01",
    end_date: "2025-12-31",
    payment_terms: "Annual",
    auto_renewal_clause: true,
    key_obligations: "Enterprise license, cloud storage",
    usage_data: {
      utilization_percentage: 72,
      usage_trend: "stable",
    },
    market_analysis: {
      market_rate_comparison: "at",
      vendor_financial_health: "strong",
      price_index: 1,
    },
    sentiment: {
      satisfaction_score: 75,
      stakeholder_comments: "Standard for enterprise, some adoption challenges",
    },
  },
  {
    vendor_name: "BCG Digital Ventures",
    category: "Professional Services",
    contract_value: 500000,
    start_date: "2023-06-01",
    end_date: "2026-06-01",
    payment_terms: "Quarterly",
    auto_renewal_clause: false,
    key_obligations: "Innovation consulting, prototyping",
    usage_data: {
      utilization_percentage: 55,
      usage_trend: "declining",
    },
    market_analysis: {
      market_rate_comparison: "above",
      vendor_financial_health: "strong",
      price_index: 15,
    },
    sentiment: {
      satisfaction_score: 65,
      stakeholder_comments: "Good insights but expensive for outcomes",
    },
  },
  {
    vendor_name: "GCP Storage Solutions",
    category: "Cloud Infrastructure",
    contract_value: 380000,
    start_date: "2022-03-01",
    end_date: "2025-03-01",
    payment_terms: "Monthly",
    auto_renewal_clause: false,
    key_obligations: "Data analytics platform, AI/ML tools",
    usage_data: {
      utilization_percentage: 82,
      usage_trend: "increasing",
    },
    market_analysis: {
      market_rate_comparison: "below",
      vendor_financial_health: "strong",
      price_index: -6,
    },
    sentiment: {
      satisfaction_score: 86,
      stakeholder_comments: "Excellent analytics capabilities, competitive pricing",
    },
  },
  {
    vendor_name: "HP Office Equipment",
    category: "Hardware",
    contract_value: 150000,
    start_date: "2021-09-01",
    end_date: "2025-09-01",
    payment_terms: "Net 45",
    auto_renewal_clause: true,
    key_obligations: "Printer/copier supply, maintenance",
    usage_data: {
      utilization_percentage: 68,
      usage_trend: "declining",
    },
    market_analysis: {
      market_rate_comparison: "above",
      vendor_financial_health: "stable",
      price_index: 10,
    },
    sentiment: {
      satisfaction_score: 60,
      stakeholder_comments: "Reliable but becoming redundant with hybrid work",
    },
  },
  {
    vendor_name: "PwC Audit Services",
    category: "Professional Services",
    contract_value: 280000,
    start_date: "2022-01-01",
    end_date: "2025-12-31",
    payment_terms: "Monthly",
    auto_renewal_clause: false,
    key_obligations: "Annual audit, compliance review",
    usage_data: {
      utilization_percentage: 40,
      usage_trend: "stable",
    },
    market_analysis: {
      market_rate_comparison: "at",
      vendor_financial_health: "strong",
      price_index: 2,
    },
    sentiment: {
      satisfaction_score: 82,
      stakeholder_comments: "Competent and trustworthy for regulatory needs",
    },
  },
  {
    vendor_name: "Lenovo Devices",
    category: "Hardware",
    contract_value: 320000,
    start_date: "2023-01-01",
    end_date: "2025-12-31",
    payment_terms: "Net 30",
    auto_renewal_clause: false,
    key_obligations: "Laptop distribution, warranty",
    usage_data: {
      utilization_percentage: 90,
      usage_trend: "increasing",
    },
    market_analysis: {
      market_rate_comparison: "below",
      vendor_financial_health: "strong",
      price_index: -8,
    },
    sentiment: {
      satisfaction_score: 85,
      stakeholder_comments: "Great for employee refresh cycles",
    },
  },
  {
    vendor_name: "Tableau Analytics",
    category: "SaaS",
    contract_value: 210000,
    start_date: "2021-06-01",
    end_date: "2025-06-01",
    payment_terms: "Annual",
    auto_renewal_clause: true,
    key_obligations: "Dashboard creation, user licenses",
    usage_data: {
      utilization_percentage: 58,
      usage_trend: "stable",
    },
    market_analysis: {
      market_rate_comparison: "above",
      vendor_financial_health: "strong",
      price_index: 9,
    },
    sentiment: {
      satisfaction_score: 73,
      stakeholder_comments: "Powerful tool but adoption is slower than expected",
    },
  },
];

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    for (const mockContract of mockContracts) {
      console.log(`Creating contract for ${mockContract.vendor_name}...`);

      // Create contract
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .insert([
          {
            vendor_name: mockContract.vendor_name,
            category: mockContract.category,
            contract_value: mockContract.contract_value,
            start_date: mockContract.start_date,
            end_date: mockContract.end_date,
            payment_terms: mockContract.payment_terms,
            auto_renewal_clause: mockContract.auto_renewal_clause,
            key_obligations: mockContract.key_obligations,
          },
        ])
        .select()
        .single();

      if (contractError) {
        console.error(
          `Error creating contract for ${mockContract.vendor_name}:`,
          contractError
        );
        continue;
      }

      const contractId = contract.id;

      // Create usage data
      const { error: usageError } = await supabase
        .from("usage_data")
        .insert([
          {
            contract_id: contractId,
            ...mockContract.usage_data,
          },
        ]);

      if (usageError) {
        console.error("Error creating usage data:", usageError);
      }

      // Create market analysis
      const { error: marketError } = await supabase
        .from("market_analysis")
        .insert([
          {
            contract_id: contractId,
            ...mockContract.market_analysis,
          },
        ]);

      if (marketError) {
        console.error("Error creating market analysis:", marketError);
      }

      // Create sentiment
      const { error: sentimentError } = await supabase
        .from("sentiment")
        .insert([
          {
            contract_id: contractId,
            ...mockContract.sentiment,
          },
        ]);

      if (sentimentError) {
        console.error("Error creating sentiment:", sentimentError);
      }
    }

    console.log("✅ Database seed completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  }
}

seed();
