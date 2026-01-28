# Master Plan: DevilsAdvocate Multi-Agent Debate System

**Project**: DevilsAdvocate
**Framework**: Next.js
**Total Phases**: 7
**Estimated Timeline**: 18 days (3.5 weeks)

---

## Phase 1: Foundation Setup
**Duration**: 1 day
**Files**: ~15 files
**Focus**: Dependencies, types, provider rotation

### Deliverables
- Install dependencies: drizzle-orm, drizzle-kit, @libsql/client, openai, @anthropic-ai/sdk, @google/generative-ai, zod
- Verify `.env.local` keys present
- Create Cloudflare D1 database via `wrangler d1 create devilsadvocate-db`
- Type definitions in `src/lib/types/`: debate.ts, agent.ts, evidence.ts, mcp.ts
- Provider rotation service with exponential backoff in `src/lib/utils/ai-provider.ts`

### Key Requirements
- Provider rotation fallback: OpenAI → Anthropic → Gemini
- Exponential backoff: 1s, 2s, 4s, 8s with 3 retry attempts per provider
- All TypeScript interfaces matching PDR.md specifications

---

## Phase 2: Database Layer
**Duration**: 2 days
**Files**: ~10 files
**Focus**: Drizzle ORM, D1 integration, CRUD services
**Sandbox**: app/tests/db/page.tsx

### Deliverables
- `src/lib/db/schema.ts` with debates, users, evidence_cache tables
- `src/lib/db/client.ts` with D1 connection handling
- Data services: DebateService, EvidenceCacheService, UserService
- Test page at `/tests/db` with interactive CRUD demo

### Key Requirements
- Drizzle ORM SQLite dialect for D1 compatibility
- Migration files in `drizzle/` directory
- Test page shows: create, query, list, update, delete operations

---

## Phase 3: Core MCP Tools
**Duration**: 3 days
**Files**: ~8 files
**Focus**: External API wrappers, rate limiting, caching
**Sandbox**: app/tests/mcp/page.tsx

### Deliverables
- `src/lib/mcp/brave-search.ts` - Web search with result ranking
- `src/lib/mcp/fact-check.ts` - Google Fact Check API wrapper
- `src/lib/mcp/archive.ts` - Wayback Machine historical snapshots
- `src/lib/mcp/whois.ts` - Domain credibility checking
- `src/lib/mcp/types.ts` - Unified VerificationTools interface
- `src/lib/mcp/rate-limiter.ts` - Per-tool rate limiting
- Test page at `/tests/mcp` with parallel tool execution demo

### Key Requirements
- Rate limits: Brave (2000/month), Fact Check (10k/day)
- 5-minute memory cache for duplicate calls
- Graceful API error handling with fallback responses
- Test page accepts claim input, shows all 4 tools running in parallel

---

## Phase 4: Agent System
**Duration**: 4 days
**Files**: ~12 files
**Focus**: Believer, Skeptic, Judge agents with role-specific prompts
**Sandbox**: app/tests/agents/page.tsx

### Deliverables
- `src/lib/agents/believer.ts` - Evidence-gathering agent
- `src/lib/agents/skeptic.ts` - Fact-checking agent
- `src/lib/agents/judge.ts` - Verdict synthesis agent
- `src/lib/agents/orchestrator.ts` - Parallel debate coordinator
- `src/lib/prompts/believer.ts` - Confirming evidence prompts
- `src/lib/prompts/skeptic.ts` - Debunking prompts with anti-convergence rules
- `src/lib/prompts/judge.ts` - Neutral evaluation prompts
- Test page at `/tests/agents` with static claim debate demo

### Key Requirements
- **CRITICAL**: Prompts prevent agent agreement - skeptic argues opposite view
- Believer uses: Brave Search (future: Google Scholar)
- Skeptic uses: Fact Check, WHOIS, Archive.org
- Orchestrator runs both in parallel, then invokes judge
- Temperature settings: Believer (0.7), Skeptic (0.8), Judge (0.3)

---

## Phase 5: Streaming API
**Duration**: 3 days
**Files**: ~6 files
**Focus**: Server-Sent Events, real-time debate streaming
**Sandbox**: app/tests/stream/page.tsx

### Deliverables
- `app/api/debate/stream/route.ts` - SSE endpoint with parallel agent streaming
- `src/lib/streaming/sse-handler.ts` - Server-Sent Events utility
- `src/lib/evidence/tracker.ts` - Evidence collection and scoring
- Test page at `/tests/stream` with dual-column real-time debate viewer

### Key Requirements
- Next.js Edge Runtime for streaming support
- SSE events: believer_token, skeptic_token, believer_evidence, skeptic_evidence, judge_complete
- Stream both agents simultaneously (not sequentially)
- Provider rotation within same request on failures
- Test page uses EventSource API, displays tokens as they arrive

---

## Phase 6: 2D Debate Viewer UI
**Duration**: 3 days
**Files**: ~8 files
**Focus**: React components, Tailwind styling, user flow
**Sandbox**: app/tests/ui/page.tsx

### Deliverables
- `src/components/DebateViewer/DebateInput.tsx` - Text/URL input form with debate length selector
- `src/components/DebateViewer/ArgumentColumn.tsx` - Scrollable argument display with streaming support
- `src/components/DebateViewer/TruthGauge.tsx` - Visual confidence spectrum (0-100%)
- `src/components/DebateViewer/JudgeVerdict.tsx` - Final verdict with risk assessment
- `src/components/DebateViewer/EvidencePanel.tsx` - Collapsible citation list with credibility badges
- Test page at `/tests/ui` with full debate flow

### Key Requirements
- Tailwind CSS only (no custom CSS files)
- Reference brand identity skill for colors
- Auto-scroll for argument columns as tokens arrive
- Mobile-responsive: stack columns vertically on <768px screens
- "Copy Debate Link" button to share results

---

## Phase 7: Integration & Polish
**Duration**: 2 days
**Files**: ~10 files
**Focus**: Production integration, deployment, end-to-end testing

### Deliverables
- Production homepage at `/` with integrated debate viewer
- `/api/debate/history` - Retrieve past debates from D1
- `/api/debate/save` - Persist debate results
- Mobile-optimized layouts
- Deployment configuration for Vercel with D1
- End-to-end test suite with real-world claims

### Key Requirements
- Move working sandbox components to production routes
- Debate history pagination (10 debates per page)
- "Share Debate" feature with unique URL slugs
- Configure Cloudflare D1 bindings in wrangler.toml and next.config.ts
- Test with controversial claims
- Verify all evidence sources are real URLs (no hallucinations)
- Add analytics: debate count, average confidence, most debated topics

---

## Success Criteria (All Phases)
1. ✅ All deliverables implemented and functional
2. ✅ Test page demonstrates core functionality with real data
3. ✅ No TypeScript errors (npm run build succeeds)
4. ✅ Code follows project standards (no any types, <500 lines per file)
5. ✅ Agent can demonstrate feature via test page

---

## Key Technical Decisions

### Evidence Caching
- **Strategy**: D1 `evidence_cache` table with 7-day expiry
- **Rationale**: Persistent cross-user caching reduces API costs

### Debate Length Implementation
- **Short** (30s): 1000 tokens, 2 tools max, single-round
- **Medium** (60s): 2500 tokens, 4 tools max, two rounds with rebuttals
- **Long** (120s): 5000 tokens, all tools, three rounds with deep fact-checking

### Agent Provider Distribution
- **Believer**: OpenAI GPT-4 (comprehensive search synthesis)
- **Skeptic**: Anthropic Claude (critical reasoning, skepticism)
- **Judge**: Gemini 2.0 Flash (neutral evaluation, fast inference)
- **Fallback Chain**: OpenAI → Anthropic → Gemini with exponential backoff

### Future: 3D Cognitive Arena
- **Status**: Deferred to Phase 8 (post-MVP)
- **Timeline**: +4 weeks after MVP launch
- **Plan**: Three.js + React Three Fiber, weapon animations, physics engine

---

**Plan Status**: READY FOR EXECUTION
**First Phase**: Foundation Setup
**Agent Type Required**: Backend infrastructure agent (database expertise)
