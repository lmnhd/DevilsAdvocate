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
- **Database**: TBD
- **Key Services**: openai,anthropic

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
│              │            │              │
│ Prompt:      │            │ Prompt:      │
│ "Find strong │            │ "Find logical│
│  supporting  │            │  flaws and   │
│  evidence"   │            │  disproofs"  │
└──────────────┘            └──────────────┘
      │                             │
      │ Stream Response A           │ Stream Response B
      │                             │
      └──────────────┬──────────────┘
                     │
              ┌──────▼──────┐
              │  Judge Agent │
              │              │
              │ Analyzes:    │
              │ - Strength   │
              │ - Logic      │
              │ - Evidence   │
              └──────┬───────┘
                     │
        ┌────────────▼────────────┐
        │  Synthesized Result     │
        │  - Truth Confidence     │
        │  - Risk Assessment      │
        │  - Visual Gauge (UI)    │
        └────────────────────────┘
```

### Key Components

#### 1. **Dual-Agent Engine** (`src/lib/agents/`)
- **BelieversAgent**: Configured to find confirming evidence and supportive arguments
- **SkepticAgent**: Configured to find logical fallacies, counterarguments, and disproving evidence
- **JudgeAgent**: Lightweight evaluator that synthesizes debate results into a confidence score

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

## 5. Data Models

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
  debateMetadata: {
    timeElapsed: number;
    tokensUsed: number;
    modelVersions: string[];
  };
}
```

---

## 6. API Structure

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

## 7. Key Milestones

- [x] Project initialization and setup ✅
- [ ] Dual-agent orchestration engine (BelieversAgent + SkepticAgent + JudgeAgent)
- [ ] Real-time streaming API with SSE
- [ ] Truth spectrum UI with dynamic gauge
- [ ] Prompt system tuning and testing
- [ ] Optional: Vector search for evidence retrieval
- [ ] Deployment to Vercel
- [ ] Portfolio documentation + blog post

---

## 8. Known Constraints & Considerations

- [Any known constraints]

*(To be filled by development agent)*

---

## 9. Next Steps

1. Development agent assumes the project
2. Run package installation: ``npm install``
3. Update PDR.md with final architectural decisions
4. Begin feature implementation

---

**Last Updated**: January 28, 2026
