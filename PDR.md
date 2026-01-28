# Project Design Record - DevilsAdvocate

## 1. Project Overview

**Description**: Multi-agent debate framework for fact-checking and bias detection with real-time streaming dual-perspective analysis

**Created**: January 28, 2026  
**Framework**: next-js  
**Status**: Initialization complete, ready for development

---

## 2. Core Objectives

- Demonstrate **Multi-Agent Orchestration**: Build a dual-agent debate system that exposes cognitive friction and logical conflicts rather than hiding them
- Implement **Streaming Architecture**: Create side-by-side streaming UI where two competing perspectives unfold in real-time
- Showcase **Prompt Engineering Mastery**: Engineer agent behaviors to consistently argue opposing viewpoints without convergence or contradiction loops
- Deliver **User Value**: Provide a unique fact-checking experience that goes beyond single-perspective summaries (Perplexity-style)
- Prove **Agentic Workflow Patterns**: Demonstrate Planning → Action (Debate) → Reflection (Judging) → Synthesized Output

---

## 3. Technical Stack

- **Framework**: next-js
- **Language**: TypeScript
- **Database**: Cloudflare D1 (SQLite-based, serverless, ultra-low-cost)
- **Key Services**: openai, anthropic, gemini
- **Verification Tools**: MCP (Model Context Protocol) tools, Brave Search API, fact-checking APIs
- **Edge Runtime**: Cloudflare Workers (optional) or Vercel Edge Functions

---

## 4. Architecture

### System Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    User Input (Text/URL)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
      ┌──────────────┴──────────────┐
      ▼                             ▼
┌──────────────┐            ┌──────────────┐
│  Agent A     │            │  Agent B     │
│ (Believer)   │            │  (Skeptic)   │
│              │◄───────────┤              │
│ Tools:       │            │ Tools:       │
│ • Web Search │            │ • Fact Check │
│ • Citation   │            │ • Snopes API │
│ • Scholar DB │            │ • WHOIS      │
│ • News APIs  │            │ • Reverse Img│
└──────┬───────┘            └──────┬───────┘
       │                           │
       │ Evidence Gathering        │ Verification & Rebuttal
       │ (Parallel Streaming)      │ (Parallel Streaming)
       │                           │
       └──────────────┬────────────┘
                      │
       ┌──────────────▼──────────────┐
       │  Real-Time MCP Tools         │
       │  • Brave Search API          │
       │  • Google Fact Check API     │
       │  • Archive.org Wayback       │
       │  • News API                  │
       │  • PubMed/Scholar APIs       │
       └──────────────┬──────────────┘
                      │
               ┌──────▼──────┐
               │ Judge Agent  │
               │              │
               │ Analyzes:    │
               │ - Source     │
               │ - Evidence   │
               │ - Logic      │
               │ - Confidence │
               └──────┬───────┘
                      │
         ┌────────────▼────────────┐
         │  Synthesized Result     │
         │  - Truth Spectrum       │
         │  - Evidence Map         │
         │  - Risk Heatmap         │
         └─────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│   Cloudflare D1 Storage       │
│   - Debate transcripts        │
│   - Evidence citations        │
│   - User history              │
└───────────────────────────────┘
```

### Key Components

#### 1. **Dual-Agent Engine** (`src/lib/agents/`)
- **BelieversAgent**: Configured to find confirming evidence and supportive arguments
  - **MCP Tools**: Web search, news aggregation, citation databases
  - **Strategy**: Gather supporting sources, statistical evidence, expert quotes
- **SkepticAgent**: Configured to find logical fallacies, counterarguments, and disproving evidence
  - **MCP Tools**: Fact-check APIs (Snopes, PolitiFact), reverse image search, WHOIS, Archive.org
  - **Strategy**: Verify claims, identify bias, expose logical flaws, check source credibility
- **JudgeAgent**: Lightweight evaluator that synthesizes debate results into a confidence score
  - **Strategy**: Weight evidence quality, assess argument strength, calculate truth probability

#### 2. **Streaming API** (`app/api/debate/stream/`)
- Accepts user input (text excerpt or URL)
- Orchestrates parallel streaming from both agents
- Streams two columns of text to frontend in real-time
- Collects final scores from JudgeAgent

#### 3. **Truth Spectrum UI** (`src/components/DebateViewer/`)
- **Left Column**: Believer's arguments (scrollable, auto-streams)
- **Right Column**: Skeptic's arguments (scrollable, auto-streams)
- **Center Gauge**: Dynamic confidence slider (0% skeptical → 100% believed)
- **Summary Panel**: Final risk assessment and key points

#### 4. **Prompt System** (`src/lib/prompts/`)
- Carefully tuned prompts to prevent agent agreement
- Built-in "Devil's Advocate" instruction set for consistency
- Temperature and constraints managed per agent role

---

## 4.5. Agent Verification Architecture

### Real-Time Information Verification Flow

```typescript
interface VerificationTools {
  // Web Search & Discovery
  braveSearch: (query: string) => Promise<SearchResult[]>;
  newsAPI: (topic: string, timeRange: string) => Promise<Article[]>;
  
  // Fact-Checking Services
  googleFactCheck: (claim: string) => Promise<FactCheckResult[]>;
  snopesAPI: (claim: string) => Promise<FactCheckRating>;
  politifactCheck: (statement: string) => Promise<TruthRating>;
  
  // Source Verification
  whoisLookup: (domain: string) => Promise<DomainInfo>;
  waybackMachine: (url: string) => Promise<ArchiveHistory>;
  reverseImageSearch: (imageUrl: string) => Promise<ImageOrigin[]>;
  
  // Academic & Research
  pubmedSearch: (query: string) => Promise<ResearchPaper[]>;
  googleScholar: (query: string) => Promise<Citation[]>;
  
  // Media Bias Detection
  mediaBiasFactCheck: (source: string) => Promise<BiasRating>;
}
```

### MCP Tool Integration Strategy

**BelieverAgent Tools Priority:**
1. **Brave Search** → Find supporting articles and statistics
2. **News API** → Recent news coverage supporting the claim
3. **Google Scholar** → Academic papers and research
4. **Citation Tools** → Properly sourced quotes and data

**SkepticAgent Tools Priority:**
1. **Google Fact Check API** → Known false/misleading claims
2. **Snopes/PolitiFact** → Myth-busting databases
3. **WHOIS + Archive.org** → Source credibility and history
4. **Reverse Image Search** → Detect manipulated/misattributed images
5. **Media Bias Check** → Expose source political leanings

**Implementation Pattern:**
```typescript
// Each agent streams results as tools complete
async function* believerStream(claim: string) {
  yield "Searching for supporting evidence...";
  const webResults = await mcp.braveSearch(claim);
  yield `Found ${webResults.length} supporting articles:\n`;
  
  for (const result of webResults) {
    yield `- ${result.title} (${result.source})\n`;
  }
  
  yield "Checking academic sources...";
  const papers = await mcp.googleScholar(claim);
  // ...continue streaming
}
```

---

## 5. Database Architecture

### Selected Solution: **Cloudflare D1**

**Rationale:**
- **Cost**: Completely free up to 5GB storage + 5M reads/day (perfect for portfolio project)
- **Speed**: SQLite-based, ultra-low latency (<50ms queries)
- **Integration**: Native Cloudflare Workers integration (if we migrate from Vercel)
- **Simplicity**: No connection pooling, no cold starts, SQL-based
- **Backup**: Built-in snapshots and replication

**Alternative Considered:**
- ~~Supabase Free Tier~~ → 500MB limit too small for debate transcripts
- ~~AWS DynamoDB~~ → Complex pricing, overkill for this use case
- ~~Azure Cosmos DB~~ → Expensive beyond free tier
- ~~Vercel Postgres~~ → Only 256MB on Hobby plan

### Schema Design

```sql
-- Debates table
CREATE TABLE debates (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  input_text TEXT NOT NULL,
  input_url TEXT,
  debate_length TEXT CHECK(debate_length IN ('short', 'medium', 'long')),
  
  -- Agent outputs
  believer_arguments TEXT,
  skeptic_arguments TEXT,
  judge_verdict TEXT,
  
  -- Scores
  believer_score INTEGER,
  skeptic_score INTEGER,
  truth_confidence INTEGER,
  risk_assessment TEXT,
  
  -- Evidence citations (JSON array)
  believer_sources TEXT, -- JSON array of URLs
  skeptic_sources TEXT,  -- JSON array of URLs
  
  -- Metadata
  created_at INTEGER DEFAULT (unixepoch()),
  time_elapsed_ms INTEGER,
  tokens_used INTEGER,
  ai_providers TEXT, -- JSON: {believer, skeptic, judge}
  
  -- Indexing
  is_public INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0
);

-- User sessions (optional, for history tracking)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  created_at INTEGER DEFAULT (unixepoch()),
  total_debates INTEGER DEFAULT 0
);

-- Evidence cache (avoid re-fetching same claims)
CREATE TABLE evidence_cache (
  claim_hash TEXT PRIMARY KEY,
  fact_check_results TEXT, -- JSON
  cached_at INTEGER DEFAULT (unixepoch()),
  expiry_at INTEGER -- Expire after 7 days
);

-- Indexes
CREATE INDEX idx_debates_user ON debates(user_id);
CREATE INDEX idx_debates_created ON debates(created_at);
CREATE INDEX idx_debates_public ON debates(is_public, upvotes);
```

### Migration from Vercel to Cloudflare (Optional)

If we want to maximize cost efficiency:
- **Deploy API**: Cloudflare Workers (free 100k requests/day)
- **Deploy Frontend**: Cloudflare Pages (unlimited static hosting)
- **Database**: Cloudflare D1 (free 5GB)
- **Total Cost**: $0/month for 100k+ users

---

## 6. Revolutionary UI Concept: "Cognitive Arena"

### Vision: Debate as Physical Combat

**Core Metaphor**: Visualize the debate as two gladiators fighting in an arena, where:
- **Arguments = Weapons** (swords, shields, arrows)
- **Evidence = Armor strength** (weak sources = paper armor, strong sources = steel)
- **Logic flaws = Hits landed** (skeptic damages believer's armor)
- **Truth confidence = Arena terrain** (tilts toward winning side)

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    COGNITIVE ARENA                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         🏛️ TRUTH SPECTRUM GAUGE 🏛️                   │   │
│  │  [Myth]━━━━━━━━━━●━━━━━━━━━━[Fact]                   │   │
│  │         35% ← Confidence → 65%                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐       │
│  │   BELIEVER ARENA     │  │   SKEPTIC ARENA       │       │
│  │                      │  │                       │       │
│  │   🛡️ Armor: ████░░   │  │   🛡️ Armor: ██████    │       │
│  │   ⚔️ Attacks: 12      │  │   ⚔️ Attacks: 18      │       │
│  │                      │  │                       │       │
│  │   [Live Stream]      │  │   [Live Stream]       │       │
│  │   "Studies show..."  │  │   "That study was..." │       │
│  │   ┏━ Evidence ━┓     │  │   ┏━ Evidence ━┓      │       │
│  │   ┃ 🔗 CNN     ┃     │  │   ┃ ⚠️ Retracted┃     │       │
│  │   ┃ 🔗 Harvard ┃     │  │   ┃ 🔗 Snopes   ┃     │       │
│  │   ┗━━━━━━━━━━━┛     │  │   ┗━━━━━━━━━━━━┛     │       │
│  └──────────────────────┘  └──────────────────────┘       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          ⚖️ JUDGE'S VERDICT ⚖️                        │   │
│  │  "Skeptic presented stronger evidence from fact-     │   │
│  │   checking sources. Believer relied on outdated     │   │
│  │   studies with methodology concerns."                │   │
│  │                                                       │   │
│  │  🏆 Winner: SKEPTIC                                   │   │
│  │  🎯 Risk Level: HIGH - Likely Misinformation         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Interactive Elements

1. **Evidence Weapons Drop-In Animation**
   - As agents find sources, they "throw" evidence into the arena
   - Strong sources = glowing golden weapons
   - Weak sources = rusty, cracked weapons
   - Debunked sources = shattered on impact

2. **Armor Degradation Visual**
   - Health bars above each agent avatar
   - When skeptic finds a flaw, believer's armor cracks (animated)
   - Critical hits = sparks and screen shake

3. **Arena Floor Tilts**
   - Physical 3D tilt effect based on truth confidence
   - If skeptic winning → arena tilts right, believer "slides"
   - Dynamic gradient color: red (myth) ↔ green (fact)

4. **Real-Time Combat Log**
   - Scrolling "attack history" below each arena
   - "Believer cited Harvard study → +15 credibility"
   - "Skeptic found study retraction → -30 credibility, CRITICAL HIT"

5. **Particle Effects**
   - Weak arguments = dust clouds
   - Strong evidence = lightning strikes
   - Judge decision = gavel slam with screen flash

### Technical Implementation (Three.js + React)

```typescript
interface ArenaState {
  believerHealth: number; // 0-100
  skepticHealth: number;  // 0-100
  arenaTilt: number;      // -45° to +45°
  attackLog: Attack[];
  evidenceWeapons: {
    believer: Weapon[];
    skeptic: Weapon[];
  };
}

interface Weapon {
  type: 'citation' | 'statistic' | 'expert-quote';
  strength: number; // Based on source credibility
  source: string;
  animation: 'sword-slash' | 'arrow-fire' | 'shield-block';
}
```

### Mobile-Responsive Version

- **Vertical split** instead of side-by-side
- **Swipe between agents** (like Tinder for facts!)
- **Tap evidence weapons** to see full citations
- **Shake phone** to trigger judge verdict (fun Easter egg)

---

## 7. Data Models

### Input
```typescript
interface DebateRequest {
  text: string;          // User-submitted text to analyze
  url?: string;          // Optional source URL
  debateLength: 'short' | 'medium' | 'long'; // Controls response length
  aiProviders?: {        // Optional provider selection
    believer: 'openai' | 'anthropic';
    skeptic: 'openai' | 'anthropic';
    judge: 'openai' | 'anthropic';
  };
}
```

### Output
```typescript
interface DebateResult {
  believerArguments: string;
  skepticArguments: string;
  believerScore: number;        // 0-100, weight of believer arguments
  skepticScore: number;         // 0-100, weight of skeptic arguments
  truthConfidence: number;      // 0-100, final confidence in text veracity
  riskAssessment: string;       // Human-readable risk summary
  
  // NEW: Evidence tracking
  believerSources: EvidenceSource[];
  skepticSources: EvidenceSource[];
  
  debateMetadata: {
    timeElapsed: number;
    tokensUsed: number;
    modelVersions: string[];
    mcpToolsCalled: string[];   // Track which verification tools used
  };
}

interface EvidenceSource {
  url: string;
  title: string;
  credibilityScore: number;     // 0-100, based on source reputation
  sourceType: 'news' | 'academic' | 'fact-check' | 'government' | 'social-media';
  biasRating?: 'left' | 'center' | 'right';
  publishDate?: string;
  verificationStatus: 'verified' | 'disputed' | 'debunked' | 'unverified';
}
```

---

## 8. API Structure

### POST `/api/debate/stream`
- **Purpose**: Initiate a debate with real-time streaming
- **Request Body**: `DebateRequest`
- **Response**: Server-sent events (SSE) with two parallel streams
  - Event: `believer_token` → believer argument text
  - Event: `skeptic_token` → skeptic argument text
  - Event: `judge_complete` → final verdict

### GET `/api/debate/history`
- **Purpose**: Retrieve past debates
- **Query Params**: `limit`, `offset`, `sortBy`
- **Response**: Array of stored `DebateResult`

### POST `/api/debate/save`
- **Purpose**: Persist debate to storage
- **Request Body**: `DebateResult`
- **Response**: Debate ID + metadata

---

## 9. Key Milestones

- [x] Project initialization and setup ✅
- [ ] **Database setup**: Cloudflare D1 schema + Drizzle ORM integration
- [ ] **MCP Tools integration**: Brave Search, Fact-Check APIs, Archive.org
- [ ] Dual-agent orchestration engine (BelieversAgent + SkepticAgent + JudgeAgent)
- [ ] Real-time streaming API with SSE + evidence tracking
- [ ] **Cognitive Arena UI**: Three.js combat visualization
- [ ] Evidence weapon animation system
- [ ] Arena tilt physics + particle effects
- [ ] Prompt system tuning and testing
- [ ] Mobile-responsive combat view
- [ ] Deployment to Vercel (or Cloudflare Workers)
- [ ] Portfolio documentation + blog post: "I Built AI Gladiators That Fight Over Facts"

---

## 10. Known Constraints & Considerations

### Rate Limits
- **Brave Search API**: 2,000 queries/month free tier → cache aggressively
- **Google Fact Check API**: 10,000 requests/day → should be sufficient
- **OpenAI/Anthropic**: Token costs → use streaming to show progress, abort if too expensive

### Cloudflare D1 Limits
- **5GB storage** → ~50,000 average debates (100KB each)
- **5M reads/day** → ~3,500 concurrent users/hour
- **100k writes/day** → ~4,000 debates/day
- **Mitigation**: Implement debate result caching, compress old transcripts

### Performance Targets
- **First token**: <2 seconds (perceived instant feedback)
- **Full debate**: <30 seconds for "short", <60 seconds for "medium"
- **Arena animation**: 60fps on modern devices (degrade gracefully to 30fps on mobile)

### Ethical Guardrails
- **No hallucinated sources**: All citations must be verifiable URLs
- **Bias transparency**: Show media bias ratings for all sources
- **Uncertainty display**: Judge must express confidence intervals, not false certainty

---

## 11. Next Steps

1. Development agent assumes the project
2. Run package installation: `npm install`
3. **Set up Cloudflare D1**: `npx wrangler d1 create devilsadvocate-db`
4. **Install Three.js + React Three Fiber**: `npm install three @react-three/fiber @react-three/drei`
5. **Install Drizzle ORM**: `npm install drizzle-orm drizzle-kit`
6. Update PDR.md with implementation learnings
7. Begin agent + MCP tools implementation
8. Build Cognitive Arena prototype

---

**Last Updated**: January 28, 2026  
**Major Revisions**: Added MCP verification architecture, Cloudflare D1 database, Cognitive Arena UI concept
