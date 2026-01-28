# Phase 4 of 7: Agent System

## EXECUTE THIS PHASE NOW

Implement the three-agent debate system with role-specific prompts and orchestrator for parallel execution.

---

## Deliverables (8 Files)

1. `src/lib/agents/believer.ts` - Evidence-gathering agent
2. `src/lib/agents/skeptic.ts` - Fact-checking agent  
3. `src/lib/agents/judge.ts` - Verdict synthesis agent
4. `src/lib/agents/orchestrator.ts` - Parallel debate coordinator
5. `src/lib/prompts/believer.ts` - Confirming evidence prompts
6. `src/lib/prompts/skeptic.ts` - Debunking prompts with anti-convergence rules
7. `src/lib/prompts/judge.ts` - Neutral evaluation prompts
8. `app/tests/agents/page.tsx` - Static claim debate demo

---

## Key Requirements

### Agent Configuration
- **Believer**: OpenAI GPT-4 (comprehensive search synthesis)
- **Skeptic**: Anthropic Claude (critical reasoning, skepticism)
- **Judge**: Gemini 2.0 Flash (neutral evaluation, fast inference)
- Temperature: Believer (0.7), Skeptic (0.8), Judge (0.3)

### Critical Constraint
**Prompts must prevent agent agreement** - Skeptic must argue the opposite view consistently without converging

### MCP Tool Integration
- **Believer**: Brave Search from Phase 3
- **Skeptic**: Fact Check + WHOIS + Archive from Phase 3
- **Orchestrator**: Runs both agents in parallel, collects results, then invokes judge

### Debate Lengths (will be implemented in Phase 5)
- **Short** (30s): 1000 tokens, 2 tools max
- **Medium** (60s): 2500 tokens, 4 tools max
- **Long** (120s): 5000 tokens, all tools

## Files to Create

### 1. src/lib/prompts/believer.ts
System prompt for believer agent that focuses on finding confirming evidence

### 2. src/lib/prompts/skeptic.ts
System prompt for skeptic agent that:
- Argues opposite viewpoint
- Uses critical thinking
- Includes anti-convergence rules to prevent agent agreement
- Focuses on logical fallacies and counterarguments

### 3. src/lib/prompts/judge.ts
System prompt for neutral judge agent that:
- Evaluates both arguments objectively
- Weighs evidence quality
- Assesses argument strength
- Provides confidence score (0-100)

### 4. src/lib/agents/believer.ts
Agent class that:
- Uses OpenAI provider
- Temperature 0.7
- Uses Brave Search tool
- Returns evidence and arguments

### 5. src/lib/agents/skeptic.ts
Agent class that:
- Uses Anthropic provider
- Temperature 0.8 (higher randomness for diverse skepticism)
- Uses Fact Check, WHOIS, Archive tools
- Returns counter-evidence and rebuttals

### 6. src/lib/agents/judge.ts
Agent class that:
- Uses Gemini provider
- Temperature 0.3 (low for consistency)
- No MCP tools (just analysis)
- Returns verdict with confidence 0-100

### 7. src/lib/agents/orchestrator.ts
Orchestrator that:
- Runs Believer and Skeptic in parallel using Promise.all()
- Collects both results
- Invokes Judge with both arguments
- Returns combined debate result with verdict

### 8. app/tests/agents/page.tsx
Test page that:
- Displays input claim
- Shows loading state
- Displays believer argument in left column
- Displays skeptic argument in right column
- Shows judge verdict with risk assessment
- Includes evidence citations from both

## Success Criteria

- ✅ All 8 files created
- ✅ All files under 500 lines
- ✅ TypeScript compiles without errors
- ✅ No `any` types used
- ✅ Test page functional at `/tests/agents`
- ✅ Demo claim shows dual arguments + verdict
- ✅ Agents use MCP tools from Phase 3
- ✅ Provider rotation works (fallback if primary fails)
- ✅ Skeptic consistently argues opposite of believer

## Estimated Time: 4 days

---

Ready when user invokes Execute Phase agent for Phase 4.
