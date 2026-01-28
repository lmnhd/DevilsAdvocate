# Plan: Phased Component Development for DevilsAdvocate (Revised)

Build the multi-agent debate system incrementally with isolated sandbox testing, focusing on 2D UI first and core verification tools. Each phase delivers a testable component before integration.

## Steps

### Phase 1: Foundation Setup

Install dependencies (`npm install drizzle-orm drizzle-kit @libsql/client openai @anthropic-ai/sdk @google/generative-ai zod`), verify `.env.local` keys present, create Cloudflare D1 database via `wrangler d1 create devilsadvocate-db`, establish type definitions in [src/lib/types/](src/lib/types/) for all interfaces, and implement provider rotation service with exponential backoff logic in [src/lib/utils/ai-provider.ts](src/lib/utils/ai-provider.ts)

**Deliverables:**
- All dependencies installed
- Cloudflare D1 database created
- Type definitions: `debate.ts`, `agent.ts`, `evidence.ts`, `mcp.ts`
- AI provider rotation service with exponential backoff

**Agent Instructions:**
- Verify environment variables in `.env.local` for all AI providers and MCP tools
- Create comprehensive TypeScript interfaces matching PDR.md specifications
- Implement provider rotation with fallback chain: OpenAI → Anthropic → Gemini
- Add exponential backoff: 1s, 2s, 4s, 8s delays with 3 retry attempts per provider

---

### Phase 2: Database Layer (Sandbox: [app/tests/db/page.tsx](app/tests/db/page.tsx))

Create [src/lib/db/schema.ts](src/lib/db/schema.ts) with `debates`, `users`, `evidence_cache` tables using Drizzle, build [src/lib/db/client.ts](src/lib/db/client.ts) with D1 connection, implement data access services in [src/lib/db/services/](src/lib/db/services/), add test page with CRUD operations showing insert/query/update flows

**Deliverables:**
- Drizzle schema matching PDR.md SQL schema
- D1 client with connection handling
- Data services: `DebateService`, `EvidenceCacheService`, `UserService`
- Test page at `/tests/db` with interactive CRUD demo

**Agent Instructions:**
- Use Drizzle ORM SQLite dialect for D1 compatibility
- Implement proper error handling and connection pooling
- Create migration files in `drizzle/` directory
- Test page should show: create debate, query by ID, list all, update scores, delete

---

### Phase 3: Core MCP Tools (Sandbox: [app/tests/mcp/page.tsx](app/tests/mcp/page.tsx))

Build wrappers for Brave Search, Google Fact Check, Archive.org Wayback, and WHOIS in [src/lib/mcp/](src/lib/mcp/), implement rate limiting and caching per tool, create unified `VerificationTools` interface, add test page demonstrating parallel tool invocation with sample claims

**Deliverables:**
- `src/lib/mcp/brave-search.ts` - Web search with result ranking
- `src/lib/mcp/fact-check.ts` - Google Fact Check API wrapper
- `src/lib/mcp/archive.ts` - Wayback Machine historical snapshots
- `src/lib/mcp/whois.ts` - Domain credibility checking
- `src/lib/mcp/types.ts` - Unified VerificationTools interface
- `src/lib/mcp/rate-limiter.ts` - Per-tool rate limiting
- Test page at `/tests/mcp` with parallel tool execution demo

**Agent Instructions:**
- Each tool wrapper must handle API errors gracefully with fallback responses
- Implement per-tool rate limiting: Brave (2000/month), Fact Check (10k/day)
- Cache results in memory for 5 minutes to avoid duplicate API calls
- Test page should accept claim input and show all 4 tools running in parallel
- Display: API call status, rate limit remaining, cached vs fresh results

---

### Phase 4: Agent System (Sandbox: [app/tests/agents/page.tsx](app/tests/agents/page.tsx))

Implement agent classes in [src/lib/agents/](src/lib/agents/) with role-specific prompts in [src/lib/prompts/](src/lib/prompts/), build [src/lib/agents/orchestrator.ts](src/lib/agents/orchestrator.ts) coordinating parallel execution with MCP tool integration, create test page showing believer vs skeptic arguments with judge scoring on static claims

**Deliverables:**
- `src/lib/agents/believer.ts` - Evidence-gathering agent
- `src/lib/agents/skeptic.ts` - Fact-checking agent
- `src/lib/agents/judge.ts` - Verdict synthesis agent
- `src/lib/agents/orchestrator.ts` - Parallel debate coordinator
- `src/lib/prompts/believer.ts` - Confirming evidence prompts
- `src/lib/prompts/skeptic.ts` - Debunking prompts with anti-convergence rules
- `src/lib/prompts/judge.ts` - Neutral evaluation prompts
- Test page at `/tests/agents` with static claim debate demo

**Agent Instructions:**
- **Critical**: Prompts must prevent agent agreement - skeptic must argue opposite view
- Believer uses MCP tools: Brave Search, Google Scholar (when added)
- Skeptic uses MCP tools: Fact Check, WHOIS, Archive.org
- Orchestrator runs both agents in parallel, collects results, then invokes judge
- Test page should show: input claim → dual arguments → judge verdict with scores
- Temperature settings: Believer (0.7), Skeptic (0.8), Judge (0.3)

---

### Phase 5: Streaming API (Sandbox: [app/tests/stream/page.tsx](app/tests/stream/page.tsx))

Create [app/api/debate/stream/route.ts](app/api/debate/stream/route.ts) with Server-Sent Events, integrate agent orchestrator with evidence tracking, implement provider rotation on failures, build test page with side-by-side live streaming columns and real-time evidence display

**Deliverables:**
- `app/api/debate/stream/route.ts` - SSE endpoint with parallel agent streaming
- `src/lib/streaming/sse-handler.ts` - Server-Sent Events utility
- `src/lib/evidence/tracker.ts` - Evidence collection and scoring
- Test page at `/tests/stream` with dual-column real-time debate viewer

**Agent Instructions:**
- Use Next.js Edge Runtime for streaming support
- SSE events: `believer_token`, `skeptic_token`, `believer_evidence`, `skeptic_evidence`, `judge_complete`
- Stream both agents simultaneously (not sequentially)
- Implement provider rotation: if OpenAI fails, retry with Anthropic within same request
- Track evidence sources as they're mentioned, extract URLs, score credibility
- Test page should use `EventSource` API, display tokens as they arrive
- Show evidence sidebar with real-time source list and credibility scores

---

### Phase 6: 2D Debate Viewer UI (Sandbox: [app/tests/ui/page.tsx](app/tests/ui/page.tsx))

Build components in [src/components/DebateViewer/](src/components/DebateViewer/) including input form, split-screen argument columns, truth spectrum gauge, judge verdict panel, and evidence citation lists; test complete user flow from input to final verdict

**Deliverables:**
- `src/components/DebateViewer/DebateInput.tsx` - Text/URL input form with debate length selector
- `src/components/DebateViewer/ArgumentColumn.tsx` - Scrollable argument display with streaming support
- `src/components/DebateViewer/TruthGauge.tsx` - Visual confidence spectrum (0-100%)
- `src/components/DebateViewer/JudgeVerdict.tsx` - Final verdict with risk assessment
- `src/components/DebateViewer/EvidencePanel.tsx` - Collapsible citation list with credibility badges
- Test page at `/tests/ui` with full debate flow

**Agent Instructions:**
- Use Tailwind CSS for styling (no custom CSS files)
- Reference brand identity skill for colors and design tokens
- Implement auto-scroll for argument columns as new tokens arrive
- Truth gauge should animate smoothly as confidence updates
- Mobile-responsive: stack columns vertically on screens <768px
- Show loading states during debate initialization
- Add "Copy Debate Link" button to share results

---

### Phase 7: Integration & Polish

Merge sandbox components into [app/page.tsx](app/page.tsx), implement [app/api/debate/history/route.ts](app/api/debate/history/route.ts) for past debates, add mobile-responsive layouts, configure Vercel/Cloudflare deployment with D1 bindings, conduct end-to-end testing with real claims

**Deliverables:**
- Production homepage at `/` with integrated debate viewer
- `/api/debate/history` - Retrieve past debates from D1
- `/api/debate/save` - Persist debate results
- Mobile-optimized layouts
- Deployment configuration for Vercel with D1
- End-to-end test suite with real-world claims

**Agent Instructions:**
- Move all working sandbox components to production routes
- Implement debate history pagination (10 debates per page)
- Add "Share Debate" feature with unique URL slugs
- Configure Cloudflare D1 bindings in `wrangler.toml` and `next.config.ts`
- Test with controversial claims: "Vaccines cause autism", "Climate change is a hoax"
- Verify all evidence sources are real, verifiable URLs (no hallucinations)
- Add analytics: debate count, average confidence scores, most debated topics

---

## Further Considerations

### 1. Evidence Caching Strategy
**Decision**: Use D1 `evidence_cache` table with 7-day expiry for cross-request persistence. Implement in Phase 3.

**Rationale**: Next.js cache utilities are per-deployment; D1 provides persistent caching across users and requests, reducing API costs significantly.

---

### 2. Debate Length Implementation
**Decision**: Control both token limits AND tool depth:
- **Short** (30s): 1000 tokens, 2 tools max per agent, single-round debate
- **Medium** (60s): 2500 tokens, 4 tools max per agent, two-round debate with rebuttals
- **Long** (120s): 5000 tokens, all available tools, three rounds with deep fact-checking

**Implementation**: Pass `debateLength` to orchestrator, which sets `max_tokens` and `max_tool_calls` per agent.

---

### 3. Agent Provider Distribution
**Decision**: Mix providers by default to minimize bias correlation:
- **Believer**: OpenAI GPT-4 (strengths: comprehensive search synthesis)
- **Skeptic**: Anthropic Claude (strengths: critical reasoning, skepticism)
- **Judge**: Gemini 2.0 Flash (strengths: neutral evaluation, fast inference)

**Fallback Chain**: If primary provider fails, rotate to next in chain with exponential backoff.

**User Override**: Allow manual provider selection via `aiProviders` parameter in `DebateRequest`.

---

### 4. Future: 3D Cognitive Arena
**Status**: Deferred to Phase 8 (post-MVP)

**Plan**: After stable 2D release with positive user feedback:
1. Add Three.js + React Three Fiber dependencies
2. Implement arena in `/tests/arena` sandbox
3. Build weapon animation system (2 weeks)
4. Add physics engine for arena tilt (1 week)
5. Optimize for 60fps on modern devices (1 week)
6. Feature flag toggle: Users can switch between 2D and 3D modes
7. Default to 2D on mobile, offer 3D on desktop

**Estimated Timeline**: +4 weeks after MVP launch

---

## Success Criteria

Each phase is complete when:
1. ✅ All deliverables are implemented and functional
2. ✅ Test page demonstrates core functionality with real data
3. ✅ No TypeScript errors (`npm run build` succeeds)
4. ✅ Code follows project standards (no `any` types, <500 lines per file)
5. ✅ Agent can demonstrate the feature to user via test page

## Timeline Estimate

- **Phase 1**: 1 day (dependency setup, types, provider rotation)
- **Phase 2**: 2 days (database layer + test page)
- **Phase 3**: 3 days (4 MCP tools + rate limiting + test page)
- **Phase 4**: 4 days (3 agents + prompts + orchestrator + test page)
- **Phase 5**: 3 days (streaming API + evidence tracking + test page)
- **Phase 6**: 3 days (UI components + test page)
- **Phase 7**: 2 days (integration + deployment)

**Total MVP**: ~18 days (3.5 weeks)

---

## Agent Delegation Notes

Each phase should be assigned to a specialized agent:
- **Phase 1-2**: Backend infrastructure agent (database expertise)
- **Phase 3**: API integration agent (external services expertise)
- **Phase 4**: AI/ML agent (prompt engineering expertise)
- **Phase 5**: Streaming/real-time agent (SSE, WebSocket expertise)
- **Phase 6**: Frontend/UI agent (React, Tailwind expertise)
- **Phase 7**: DevOps agent (deployment, integration testing)

Each agent should:
1. Read this plan thoroughly before starting
2. Reference PDR.md for technical specifications
3. Work autonomously within their phase
4. Create comprehensive test pages for validation
5. Document any deviations or blockers
6. Hand off clean, tested code to next phase agent
