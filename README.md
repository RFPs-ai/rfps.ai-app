# RFPs.ai - AI-Powered RFP Qualification Platform

**Version 1.0** | December 2025

RFPs.ai is an AI-driven qualification engine that eliminates the noise from government procurement discovery. Legacy tender aggregators bury business development teams in irrelevant notices; RFPs.ai routes only the bids they can actually win—fast, explainable, and tied to real capabilities.

## 🎯 Key Features

- **AI-Powered Search**: Natural language search with semantic understanding
- **Multi-Factor Matching**: 100-point qualification scoring across 7 factors
- **Explainability**: Clear match/ineligibility reasons for every RFP
- **Smart Deduplication**: SHA-256 fingerprinting eliminates duplicates across sources
- **Real-time Updates**: 2-hour freshness SLA from source publication
- **Multi-Provider AI**: Support for Anthropic, OpenAI, xAI, Google, and Groq

## 🏗️ Architecture

Built as a **single Next.js 15 application** using the App Router, matching the architecture of the open-source Scira AI search engine.

### Tech Stack

- **Framework**: Next.js 15 with App Router and Server Actions
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: PostgreSQL via Supabase with Drizzle ORM
- **Authentication**: Better Auth (email/password, OAuth)
- **AI SDK**: Vercel AI SDK with streaming responses
- **Deployment**: Vercel with Edge Functions

### Directory Structure

```
rfps.ai-app/
├── ai/                 # AI/LLM integration layer
│   ├── providers.ts    # Multi-provider configuration
│   ├── prompts/        # System prompts
│   └── tools/          # AI tools (search, crawl, matching)
├── app/
│   ├── (app)/          # Authenticated app routes
│   │   ├── dashboard/  # Main dashboard
│   │   ├── search/     # AI search interface
│   │   └── profile/    # Company profile
│   └── api/
│       ├── auth/       # Better Auth routes
│       └── chat/       # AI chat endpoint
├── components/
│   └── ui/             # shadcn/ui components
├── lib/
│   ├── db/             # Drizzle ORM schema
│   ├── auth.ts         # Better Auth config
│   └── utils.ts        # Utilities
└── env/                # Environment validation
```

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20.0.0
- pnpm ≥ 8.0.0
- PostgreSQL database (Supabase recommended)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/rfps.ai-app.git
   cd rfps.ai-app
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:
   - `DATABASE_URL`: PostgreSQL connection string
   - `BETTER_AUTH_SECRET`: Min 32 characters for session encryption
   - `ANTHROPIC_API_KEY`: Claude API key (primary)
   - `OPENAI_API_KEY`: OpenAI API key (optional)
   - `EXA_API_KEY`: Exa.AI search API key (optional)
   - `TAVILY_API_KEY`: Tavily search API key (optional)
   - `FIRECRAWL_API_KEY`: Firecrawl web scraping (optional)

4. **Push database schema**:
   ```bash
   pnpm db:push
   ```

5. **Start development server**:
   ```bash
   pnpm dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

### Core Tables

- **users**: User accounts with Better Auth support
- **companies**: Company profiles with NAICS, certifications, preferences
- **rfps**: RFP listings with full metadata and fingerprinting
- **userRfps**: User-RFP junction with scoring and workflow
- **notifications**: User notifications for matches and deadlines
- **dataSources**: Crawler status and monitoring

### Key Features

- SHA-256 fingerprint deduplication
- Multi-factor scoring (0-100 points)
- Explainability with match/ineligibility reasons
- Full-text search ready with indexes

## 🤖 AI Integration

### Supported Providers

| Provider   | Model                     | Use Case                    |
|------------|---------------------------|-----------------------------|
| Anthropic  | claude-sonnet-4           | Primary reasoning & analysis|
| OpenAI     | gpt-4o / gpt-4o-mini      | Fallback & embeddings       |
| xAI        | grok-3                    | Real-time search grounding  |
| Google     | gemini-2.5-flash          | Fast classification         |
| Groq       | llama-3.3-70b-versatile   | High-throughput batch jobs  |

### AI Tools

1. **rfp-search**: Semantic RFP search with Exa.AI/Tavily
2. **web-crawl**: JS-rendered page scraping with Firecrawl
3. **memory**: Persistent user preferences with Mem0
4. **matching**: Multi-factor qualification scoring

### Matching Algorithm

The matching tool evaluates 7 factors:

1. **NAICS/UNSPSC Match** (20 points)
2. **Region Match** (15 points)
3. **Certifications** (15 points)
4. **Language Match** (10 points)
5. **Budget Fit** (10 points)
6. **Keyword Relevance** (20 points)
7. **Deadline Runway** (10 points)

Returns:
- Score (0-100)
- Match reasons
- Ineligibility reasons
- Recommendation (pursue/skip/review)

## 📈 Project Timeline

### Phase 1 (Weeks 1-4) - ✅ Complete

- ✅ Core infrastructure setup
- ✅ Authentication with Better Auth
- ✅ Database schema with Drizzle ORM
- ✅ AI integration layer with multi-provider support
- ✅ Basic search UI with streaming responses
- ✅ Company profile management

### Phase 2 (Weeks 5-8) - Pending

- [ ] Data source crawlers (CanadaBuys, Ontario, bids&tenders)
- [ ] Deduplication pipeline
- [ ] Matching algorithm refinement
- [ ] Triage inbox with thumbs feedback
- [ ] Eligibility guardrails

### Phase 3 (Weeks 9-12) - Pending

- [ ] Deadline Radar with calendar integration
- [ ] Email/Slack notifications
- [ ] Quality dashboard (Precision@10 tracking)
- [ ] Admin panel
- [ ] Performance optimization
- [ ] Production deployment

## 🎯 Success Metrics

| Metric              | Target | Status      |
|---------------------|--------|-------------|
| Precision@10        | ≥ 0.80 | Pending     |
| Dedupe Rate         | ≥ 95%  | Pending     |
| Alert Latency       | ≤ 2h   | Pending     |
| Time Reduction      | 10x    | Pending     |

## 🔐 Environment Variables

### Required

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=min-32-chars-random-string
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### Optional

```env
OPENAI_API_KEY=sk-xxxxx
XAI_API_KEY=xai-xxxxx
GOOGLE_GENERATIVE_AI_API_KEY=xxxxx
GROQ_API_KEY=gsk_xxxxx
EXA_API_KEY=xxxxx
TAVILY_API_KEY=tvly-xxxxx
FIRECRAWL_API_KEY=fc-xxxxx
MEM0_API_KEY=xxxxx
RESEND_API_KEY=re_xxxxx
```

## 📚 Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Drizzle Studio
pnpm db:generate  # Generate migrations
```

## 🤝 Contributing

This project follows the 12-week development plan outlined in the Statement of Work. We're currently in Phase 1.

## 📝 License

Proprietary - Nimblox Inc. (trading as RFPs.ai)

## 🙏 Acknowledgments

- Architecture inspired by [Scira AI Search Engine](https://github.com/example/scira)
- Built with [Next.js 15](https://nextjs.org), [Vercel AI SDK](https://sdk.vercel.ai), and [shadcn/ui](https://ui.shadcn.com)

---

**Status**: Phase 1 Complete ✅ | Next: Data Source Crawlers (Phase 2)

For questions or support, contact: team@rfps.ai
