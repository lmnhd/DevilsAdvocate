# Phase 3 of 7: Core MCP Tools

## Objective
Build MCP tool wrappers for real-time verification (Brave Search, Google Fact Check, Archive.org, WHOIS) with rate limiting, caching, and parallel execution testing.

## Files to Create

1. **src/lib/mcp/types.ts** - MCP type definitions and interfaces
2. **src/lib/mcp/rate-limiter.ts** - Per-tool rate limiting class
3. **src/lib/mcp/brave-search.ts** - Brave Search API wrapper
4. **src/lib/mcp/fact-check.ts** - Google Fact Check API wrapper
5. **src/lib/mcp/archive.ts** - Archive.org Wayback Machine wrapper
6. **src/lib/mcp/whois.ts** - WHOIS domain lookup wrapper
7. **src/lib/mcp/index.ts** - Unified exports
8. **app/tests/mcp/page.tsx** - Interactive test page at `/tests/mcp`
9. **app/api/test/mcp/route.ts** - API route for parallel tool execution

---

## Implementation Details

### Requirements from Plan
- Each tool wrapper must handle API errors gracefully with fallback responses
- Implement per-tool rate limiting: Brave (2000/month), Fact Check (10k/day), Archive (100/hour), WHOIS (1000/day)
- Cache results in memory for 5 minutes to avoid duplicate API calls
- Test page should accept claim input and show all 4 tools running in parallel
- Display: API call status, rate limit remaining, cached vs fresh results

### Environment Variables Required
Add to `.env.local`:
```
BRAVE_API_KEY=your_brave_api_key_here
GOOGLE_FACT_CHECK_API_KEY=your_google_api_key_here
WHOIS_API_KEY=your_whois_api_key_here
```

---

## Verification Criteria

After implementation, verify:
- [ ] All 9 source files created
- [ ] Test page at `/tests/mcp` loads without errors
- [ ] Can input claim and click "Run All Tools"
- [ ] All 4 tools execute in parallel (not sequential)
- [ ] Rate limiting works (shows remaining quota)
- [ ] Cache works (second identical request shows "Cached: Yes")
- [ ] Error handling works (graceful degradation if API key missing)
- [ ] TypeScript compiles: `npm run build` succeeds
- [ ] No `any` types used in implementation

---

## STOP CONDITIONS

⛔ **DO NOT proceed to Phase 4 (Agent System)**  
⛔ **DO NOT modify files outside `src/lib/mcp/` and `app/tests/mcp/` and `app/api/test/mcp/`**  
⛔ **If API keys are missing, create placeholder implementations that return mock data**  
⛔ **If unclear about API endpoints, document in phase-result.md and STOP**

---

## Success Output

Write to `.plan-delegator/phase-result.md`:

```markdown
# Phase 3 Execution Result

**Status**: SUCCESS | FAILED | BLOCKED

## Files Created
- [ ] src/lib/mcp/types.ts
- [ ] src/lib/mcp/rate-limiter.ts
- [ ] src/lib/mcp/brave-search.ts
- [ ] src/lib/mcp/fact-check.ts
- [ ] src/lib/mcp/archive.ts
- [ ] src/lib/mcp/whois.ts
- [ ] src/lib/mcp/index.ts
- [ ] app/tests/mcp/page.tsx
- [ ] app/api/test/mcp/route.ts

## Build Status
`npm run build` output: SUCCESS / FAILED

## Test Results
- Navigated to `/tests/mcp`: YES / NO
- Test input: "[your test claim]"
- Brave Search: SUCCESS / FAILED (X results, cached: Y)
- Fact Check: SUCCESS / FAILED (X results, cached: Y)
- Archive: SUCCESS / FAILED (available: Y)
- WHOIS: SUCCESS / FAILED (credibility: X)

## Issues Encountered
[List any blockers or warnings]

## Time Spent
[Actual hours/days spent]
```

---

## Estimated Time: 3 days
