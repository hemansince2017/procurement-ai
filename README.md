# ProcurementAI — Contract Intelligence Platform

> AI-powered contract renewal & negotiation intelligence for procurement professionals.  
> Live demo → **[procurement-ai-app.vercel.app](https://procurement-ai-app.vercel.app)**

---

## What It Does

ProcurementAI turns raw contract data into actionable decisions. It combines four data signals — usage metrics, market pricing, stakeholder sentiment, and contract terms — into a single 0-100 renewal score powered by Claude AI. It also pulls **live SEC EDGAR financial data** on any publicly traded vendor to generate AI-driven negotiation intelligence.

Built as a senior procurement interview demo, the app showcases how AI can augment procurement workflows at scale.

---

## Key Features

### Contract Intelligence
- **Portfolio Dashboard** — Overview of all contracts with renewal priority scores, status filters, and category breakdown
- **4-Signal Analysis** — Each contract scores across Usage, Market, Sentiment, and Terms signals
- **AI Renewal Scoring** — Claude `claude-sonnet-4-6` synthesizes all signals into a 0–100 score with a written narrative and risk flags
- **Pre-seeded Mock Data** — 15 realistic contracts across SaaS, Cloud Infrastructure, Professional Services, and Hardware

### Market Intelligence *(New)*
- **Live SEC EDGAR Integration** — Pulls real 10-Q/10-K financial data (revenue, gross margin, operating income, cash) for any publicly traded vendor
- **AI Negotiation Intelligence** — Claude generates a negotiation posture score, levers, risks, and opportunities based on actual vendor financials
- **Smart Caching** — Results cached in Supabase; refreshes only when you explicitly click Refresh (no wasted API calls)
- **Standalone Page + Embedded Tab** — Available at `/market-intelligence` and embedded on every contract detail page

### Auth & Management
- **Supabase Auth** — Email/password login with sign-up for demo panellists
- **Add / Edit Contracts** — Full form with all signal fields
- **Responsive UI** — Clean, polished interface built for executive demos

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| AI Engine | Claude API (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| Financial Data | SEC EDGAR XBRL API |
| Deployment | Vercel |

---

## Screenshots

| Dashboard | Contract Detail | Market Intelligence |
|---|---|---|
| Portfolio overview with renewal scores | 4-signal breakdown + AI recommendation | Live EDGAR financials + negotiation posture |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [Anthropic API key](https://console.anthropic.com)

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/procurement-ai.git
cd procurement-ai
npm install
```

### 2. Environment variables

Create `.env.local` in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
ANTHROPIC_API_KEY=sk-ant-...
```

> Never commit `.env.local` — it's already in `.gitignore`.

### 3. Database setup

Open the **Supabase SQL Editor** and run [`scripts/schema.sql`](scripts/schema.sql).  
This creates all 6 tables with indexes and disables RLS for demo use.

Optionally seed 15 mock contracts:

```bash
npm run seed
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
procurement-ai/
├── app/
│   ├── page.tsx                          # Dashboard
│   ├── login/page.tsx                    # Login / Sign-up
│   ├── market-intelligence/page.tsx      # Standalone market intel page
│   ├── contracts/
│   │   ├── [id]/page.tsx                 # Contract detail + Market tab
│   │   └── new/page.tsx                  # Add contract form
│   └── api/
│       ├── contracts/route.ts            # GET list / POST create
│       ├── contracts/[id]/route.ts       # GET / PUT / DELETE
│       ├── contracts/[id]/analyze/       # POST → Claude renewal score
│       └── market-intelligence/route.ts  # GET → SEC EDGAR + Claude
├── components/
│   ├── market-intelligence/
│   │   └── MarketIntelligencePanel.tsx   # Posture gauge + accordion UI
│   └── ui/                               # Reusable UI primitives
├── lib/
│   ├── supabase.ts                       # Supabase client
│   ├── claude.ts                         # Claude renewal scoring
│   ├── types.ts                          # TypeScript types
│   └── utils.ts                          # Helpers (cn, formatters)
└── scripts/
    ├── schema.sql                        # Full DB schema
    └── seed.ts                           # Mock data
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `contracts` | Core contract fields (vendor, value, dates, category) |
| `usage_data` | Utilisation %, seat counts, trend |
| `market_analysis` | Competitor pricing, vendor health score |
| `sentiment` | Stakeholder satisfaction scores & comments |
| `ai_recommendations` | Cached Claude renewal scores + narratives |
| `market_intelligence_cache` | Cached SEC EDGAR + Claude negotiation results |

---

## API Endpoints

```
GET    /api/contracts                  List all contracts
POST   /api/contracts                  Create contract + signals
GET    /api/contracts/[id]             Get contract with all signals
PUT    /api/contracts/[id]             Update contract
DELETE /api/contracts/[id]             Delete contract
POST   /api/contracts/[id]/analyze     Generate Claude renewal recommendation
GET    /api/market-intelligence        Fetch EDGAR financials + Claude negotiation intel
                                       ?company=Salesforce
                                       &refresh=true  (bypass cache)
```

---

## How the AI Works

### Renewal Scoring
Claude receives a structured prompt containing all 4 signals and returns:
```json
{
  "score": 74,
  "narrative": "...",
  "risk_flags": ["Auto-renewal in 45 days", "17% underutilisation"]
}
```

Score bands:
- **75–100** → High priority — strong negotiation case
- **40–74** → Medium — monitor and consider renegotiating
- **0–39** → Low priority — not urgent

### Market Intelligence
1. Company name resolved to a CIK via SEC's `company_tickers.json` (5-tier fuzzy match: exact name → exact ticker → starts-with → all words → any significant word)
2. XBRL facts fetched from `data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json`
3. Most recent quarterly figures extracted per concept, picking whichever XBRL concept name has the latest period end date (handles companies that changed concepts after ASC 606)
4. Claude generates negotiation posture score (0–100), levers, risks, and opportunities

---

## Deployment

### Vercel (recommended)

```bash
npx vercel deploy --prod
```

Set environment variables in Vercel dashboard or via CLI:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_KEY
vercel env add ANTHROPIC_API_KEY
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Financials show N/A | Company may not be publicly traded, or EDGAR XBRL data is unavailable for that concept |
| "Company not found in SEC EDGAR" | Try the full legal name (e.g. `Salesforce Inc` instead of `Salesforce`) |
| Claude API errors | Check `ANTHROPIC_API_KEY` is valid and has quota |
| Auth emails not arriving | Disable email confirmation in Supabase → Auth → Settings for demo use |
| Build fails with env var errors | Ensure all 4 env vars are set in Vercel project settings |

---

## Security Notes

- `.env.local` is gitignored — never commit secrets
- `SUPABASE_SERVICE_KEY` is only used server-side (API routes)
- RLS is disabled for demo purposes — enable per-user policies for production multi-tenant use

---

Built with [Next.js](https://nextjs.org) · [Supabase](https://supabase.com) · [Claude AI](https://anthropic.com) · [SEC EDGAR](https://www.sec.gov/developer)
