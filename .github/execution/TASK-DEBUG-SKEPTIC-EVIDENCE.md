# Execution Task: Debug Skeptic Evidence Attribution

## Objective
Fix the missing Skeptic evidence attribution in the UI. Currently ALL 20 evidence sources show "✓ Believer" attribution, even though the Skeptic explicitly cites multiple sources in their argument.

## Problem Analysis

**What's Working:**
- ✅ Credibility scoring (90% for .edu, 80% for news, 70% for business, etc.)
- ✅ URL validation (no malformed URLs)
- ✅ MCP tools gathering evidence successfully
- ✅ Skeptic agent producing arguments with inline citations

**What's Broken:**
- ❌ Skeptic's evidence NOT appearing in UI evidence panel
- ❌ All evidence showing "✓ Believer" attribution
- ❌ Zero sources tagged with "✗ Skeptic"

**Skeptic's Citations (from user's output):**
- "Microsoft's 61,000-Employee Study"
- "Stanford economist Nicholas Bloom's updated research"  
- "MIT's analysis of 50,000 software development teams"
- Patent filing data
- Corporate return-to-office policies (Amazon, Google, Meta, Apple)

## Root Cause Hypothesis

The issue is in **ONE OF TWO PLACES**:

### Hypothesis 1: Evidence Array Structure Issue
The Skeptic agent's `evidence` array (in `src/lib/agents/skeptic.ts` lines 183-225) may not be formatted correctly, or the array might be empty when it reaches the streaming route.

**Check:**
- Is `event.data.evidence` populated for Skeptic events?
- Does the evidence array have valid `source_url` values?
- Are the evidence items structured correctly (matching the TrackedEvidence interface)?

### Hypothesis 2: Evidence Not Extracted from Content
The Skeptic might be citing sources INLINE in their text content (like "Microsoft's study shows...") without adding them to the evidence array. The streaming route may need to parse citations from the text itself.

**Check:**
- Are sources mentioned in `event.data.content` but NOT in `event.data.evidence[]`?
- Should we be using `extractEvidenceFromToken()` function to parse inline citations?

---

## Task 1: Add Debug Logging (ALREADY DONE)

I've already added comprehensive debug logging to `app/api/debate/stream/route.ts`:
- Lines 69-80 (Believer evidence processing)
- Lines 116-127 (Skeptic evidence processing)

These logs will show:
- `event.data` structure
- Evidence array contents
- Each evidence item's properties (source_url, domain, mentioned_by, snippet)
- Tracking results

**Your Action:** None needed - logging already in place.

---

## Task 2: Run Debate & Capture Console Output

**Steps:**
1. Start dev server: `npm run dev`
2. Open browser to `http://localhost:3000`
3. Enter the same claim: "Remote work is more productive than office work"
4. Click "Start Debate"
5. **Watch the terminal console** for debug output

**Look For These Specific Lines:**
```
[STREAM]   Evidence items from agent: X
[STREAM]   🔍 DEBUG: Event.data structure: {...}
[STREAM]   🔍 Processing evidence item: {...}
```

**Success Criteria:**
- Copy the **full console output** showing evidence processing
- Note if Skeptic shows `Evidence items from agent: 0` or a different number
- Check if `firstItem` in DEBUG output is populated or undefined

**Time Estimate:** 5 minutes

---

## Task 3: Investigate Based on Console Output

### IF Console Shows: `Evidence items from agent: 0` for Skeptic

**Problem:** Skeptic agent not populating evidence array.

**Fix Location:** `src/lib/agents/skeptic.ts` lines 183-225

**What to Check:**
1. Are the MCP tool results (`factCheckResults`, `domainInfo`, `archiveResults`) empty?
2. Is the `.map()` logic correctly filtering valid evidence items?
3. Add console.log BEFORE the evidence array is created:
   ```typescript
   console.log('[SKEPTIC] Building evidence array...');
   console.log('[SKEPTIC]   Fact check results:', factCheckResults.data?.length || 0);
   console.log('[SKEPTIC]   Archive results:', archiveResults.data?.length || 0);
   console.log('[SKEPTIC]   Domain info:', domainInfo.data?.domain || 'none');
   ```

**Likely Fix:**
The evidence array construction might have issues with MCP tool response format. The tools ARE working (you confirmed 21 sources found), but the data might not be mapped correctly into the evidence structure.

### IF Console Shows: `Evidence items from agent: 5+` for Skeptic but UI still shows Believer

**Problem:** Evidence is being created but not properly streamed to client or frontend is misinterpreting the event type.

**Fix Location:** Check event type in frontend (`app/page.tsx`)

**What to Check:**
1. Search for `skeptic_evidence` event handler in `app/page.tsx`
2. Verify the event is being received by the client
3. Add browser console.log in the EventSource handler:
   ```typescript
   if (eventType === 'skeptic_evidence') {
     console.log('📥 Received skeptic evidence:', parsedData);
   }
   ```

**Likely Fix:**
The frontend might only have a handler for `believer_evidence` and not `skeptic_evidence`, causing it to ignore Skeptic's evidence events.

### IF Console Shows: Evidence items but they have invalid source_url

**Problem:** URL validation rejecting Skeptic's evidence sources.

**Fix Location:** `src/lib/evidence/tracker.ts` line 24 (`isValidUrl()`)

**What to Check:**
1. Print rejected URLs to console in `trackEvidence()`:
   ```typescript
   if (!this.isValidUrl(url)) {
     console.warn(`[EVIDENCE] ❌ REJECTED URL: "${url}" - reason: ${this.getInvalidReason(url)}`);
     throw new Error('Invalid URL format');
   }
   ```

**Likely Fix:**
Add a helper method to show WHY a URL is rejected, then adjust validation rules if they're too strict for Skeptic's evidence format.

---

## Task 4: Implement the Fix

Based on what you discover in Task 3, apply the appropriate fix:

### Fix Option A: Populate Skeptic Evidence Array
If evidence array is empty, ensure MCP tool results are correctly mapped.

### Fix Option B: Add Frontend Handler
If backend is working but frontend isn't receiving, add `skeptic_evidence` event handler.

### Fix Option C: Adjust URL Validation
If URLs are being rejected incorrectly, refine `isValidUrl()` logic.

**Time Estimate:** 30-45 minutes

---

## Success Criteria

After the fix, run another debate and verify:
- [ ] Skeptic evidence appears in the Evidence Sources panel
- [ ] Sources show "✗ Skeptic" attribution (not "✓ Believer")
- [ ] Skeptic's cited sources (Microsoft study, MIT analysis, etc.) appear with proper credibility scores
- [ ] Total evidence count increases (should be 20-30+ sources, not just 20 from Believer)

---

## Files to Review

**Primary Files:**
- `app/api/debate/stream/route.ts` (lines 95-145) - Skeptic evidence streaming
- `src/lib/agents/skeptic.ts` (lines 183-225) - Evidence array construction
- `app/page.tsx` - Frontend EventSource handler for `skeptic_evidence` events

**Supporting Files:**
- `src/lib/evidence/tracker.ts` - Evidence tracking and URL validation
- `src/lib/streaming/sse-handler.ts` - SSE formatting utilities

---

## Notes

- The debug logging I added will show you EXACTLY where the evidence is getting lost
- The Skeptic agent IS running and producing content (you can see their argument in the UI)
- The MCP tools ARE working (21 sources found in previous test)
- This is purely a data flow issue - evidence exists but isn't reaching the UI with correct attribution

**Start with Task 2** - run the debate and capture console output. That will tell you immediately which fix to apply.
