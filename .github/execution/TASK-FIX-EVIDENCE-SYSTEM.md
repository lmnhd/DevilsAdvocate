# Execution Task: Fix Evidence System Issues

## Objective
Fix three critical evidence display bugs that make the system appear broken despite evidence tracking working correctly.

## Current Problems Identified

### Problem 1: Academic Sources Showing Low Credibility (52% for .edu domains)
- `stanford.edu` → 52% (should be 90-95%)
- `chicagobooth.edu` → 52% (should be 90-95%)
- `forbes.com` → 23% (should be 70-80%)
- Makes the system look unreliable when prestigious sources score poorly

### Problem 2: Skeptic's Evidence Not Being Tracked
- Believer cites 21 sources ✓
- Skeptic mentions "Microsoft's 2023 Work Trend Index," "Goldman Sachs data," "Yang et al. (2022)"
- But ALL evidence shows "✓ Believer" attribution
- Skeptic's sources aren't appearing in the evidence panel

### Problem 3: Malformed Evidence URL
- One entry shows: `remote%20work%20is%20more%20productive%20than%20office%20work`
- This is the raw search query, not a URL
- Should be filtered out during evidence extraction

---

## TASK 1: Fix Credibility Scoring Algorithm (30 minutes)

**File**: `src/lib/evidence/tracker.ts`

### Current Implementation (Lines 76-115)
```typescript
private calculateReputationScore(domain: string): number {
  // Current scores are TOO CONSERVATIVE
  const academicDomains = ['.edu', '.ac.uk', /* ... */];
  if (academicDomains.some((known) => domain.includes(known))) {
    return 60; // ← TOO LOW for .edu!
  }
  // ... more conservative scoring
}
```

### Required Changes

**Step 1.1**: Replace the `calculateReputationScore` method (lines 76-115):

```typescript
private calculateReputationScore(domain: string): number {
  // TIER 1: Academic & Government (85-95%)
  const tier1Domains = [
    '.edu', '.ac.uk', '.ac.jp', '.gov', '.gov.uk',
    'scholar.google', 'ieee.org', 'arxiv.org', 'nih.gov',
    'cdc.gov', 'nasa.gov', 'universityconsortium.edu'
  ];
  if (tier1Domains.some(d => domain.includes(d))) {
    return 90; // High credibility for academic/government
  }

  // TIER 2: Major News Organizations (75-85%)
  const tier2Domains = [
    'nytimes.com', 'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk',
    'wsj.com', 'economist.com', 'ft.com', 'theguardian.com',
    'washingtonpost.com', 'npr.org', 'pbs.org'
  ];
  if (tier2Domains.some(d => domain.includes(d))) {
    return 80; // High-quality journalism
  }

  // TIER 3: Business & Tech Publications (65-75%)
  const tier3Domains = [
    'forbes.com', 'bloomberg.com', 'techcrunch.com', 'wired.com',
    'arstechnica.com', 'technologyreview.com', 'scientificamerican.com',
    'nature.com', 'science.org', 'pnas.org'
  ];
  if (tier3Domains.some(d => domain.includes(d))) {
    return 70; // Reputable business/tech sources
  }

  // TIER 4: Known Databases & Reference Sites (60-70%)
  const tier4Domains = [
    'wikipedia.org', 'britannica.com', 'jstor.org', 'pubmed.gov',
    'researchgate.net', 'academia.edu', 'sciencedirect.com'
  ];
  if (tier4Domains.some(d => domain.includes(d))) {
    return 65; // Reference materials
  }

  // TIER 5: Established Web Publishers (50-60%)
  const tier5Domains = [
    'medium.com', 'substack.com', 'stackoverflow.com', 'github.com',
    'youtube.com', 'vimeo.com', 'ted.com'
  ];
  if (tier5Domains.some(d => domain.includes(d))) {
    return 55; // User-generated but established platforms
  }

  // TIER 6: Social Media & Low Credibility (20-40%)
  const tier6Domains = [
    'reddit.com', 'twitter.com', 'x.com', 'facebook.com',
    'instagram.com', 'tiktok.com', 'quora.com', 'yahoo.com'
  ];
  if (tier6Domains.some(d => domain.includes(d))) {
    return 30; // Social media - low baseline credibility
  }

  // DEFAULT: Unknown domains (40-50%)
  return 45;
}
```

**Step 1.2**: Update the `calculateAgeScore` method to return 0 (we're using reputation-only now):

```typescript
private calculateAgeScore(domain: string): number {
  // Age scoring removed - reputation is more reliable
  return 0;
}
```

**Step 1.3**: Update the `scoreCredibility` method (line 58):

```typescript
private async scoreCredibility(domain: string, url: string): Promise<number> {
  if (this.credibilityCache.has(domain)) {
    return this.credibilityCache.get(domain)!;
  }

  // Use reputation score only (age scoring was unreliable)
  const reputationScore = this.calculateReputationScore(domain);
  const totalScore = Math.min(100, Math.round(reputationScore));
  
  this.credibilityCache.set(domain, totalScore);
  return totalScore;
}
```

**Expected Result**: 
- `stanford.edu` → 90%
- `forbes.com` → 70%
- `reddit.com` → 30%

---

## TASK 2: Fix Skeptic Evidence Tracking (45 minutes)

**Problem**: Skeptic's cited sources aren't being extracted and tracked.

**Root Cause Investigation**:

**File**: `app/api/debate/stream/route.ts` (lines 80-100)

Current code extracts evidence from Believer but may not properly handle Skeptic's response.

### Step 2.1: Check Skeptic Evidence Extraction

Read lines 100-140 in `app/api/debate/stream/route.ts` - verify the skeptic evidence extraction logic.

**Look for**:
```typescript
} else if (event.type === 'skeptic_complete') {
  const fullContent = event.data.content;
  const allEvidence = extractEvidenceFromToken(fullContent); // ← Is this working?
}
```

### Step 2.2: Check Evidence Extraction Function

**File**: `src/lib/streaming/sse-handler.ts`

Find the `extractEvidenceFromToken` function. It needs to extract URLs from text like:
- "Microsoft's 2023 Work Trend Index"
- "Yang et al. (2022)"
- "According to stanford.edu"

**Current regex may be too simple**. Update it to handle:
1. Inline citations (e.g., "study by Stanford (stanford.edu)")
2. Reference-style citations (e.g., "[1] Yang et al., 2022")
3. Domain mentions (e.g., "Microsoft's data")

### Step 2.3: Add Citation Pattern Matching

Add to `src/lib/streaming/sse-handler.ts`:

```typescript
export function extractEvidenceFromToken(text: string): Array<{ url: string; snippet: string }> {
  const evidence: Array<{ url: string; snippet: string }> = [];
  
  // Pattern 1: Standard URLs (http/https)
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const urls = text.match(urlRegex) || [];
  
  for (const url of urls) {
    // Skip malformed URLs (query strings, etc.)
    if (url.includes('%20') || url.length < 10) continue;
    if (!url.includes('.')) continue; // Must have a TLD
    
    // Extract snippet around URL (50 chars before/after)
    const urlIndex = text.indexOf(url);
    const start = Math.max(0, urlIndex - 50);
    const end = Math.min(text.length, urlIndex + url.length + 50);
    const snippet = text.substring(start, end).trim();
    
    evidence.push({ url, snippet });
  }
  
  // Pattern 2: Domain mentions (for when LLM cites sources without full URL)
  const domainMentionRegex = /(?:according to|study by|research from|data from|report by)\s+([a-z0-9-]+(?:\.[a-z]+)+)/gi;
  let match;
  while ((match = domainMentionRegex.exec(text)) !== null) {
    const domain = match[1];
    const fullMatch = match[0];
    
    // Convert domain mention to a searchable URL
    const url = `https://${domain}`;
    const snippet = fullMatch;
    
    // Only add if not already present
    if (!evidence.some(e => e.url.includes(domain))) {
      evidence.push({ url, snippet });
    }
  }
  
  // Pattern 3: Academic citations (Author et al., Year)
  const citationRegex = /([A-Z][a-z]+(?:\s+(?:et al\.|& [A-Z][a-z]+))?,?\s+(?:19|20)\d{2})/g;
  const citations = text.match(citationRegex) || [];
  
  for (const citation of citations) {
    // Create a pseudo-URL for academic citations
    const normalizedCitation = citation.replace(/\s+/g, '_').replace(/[.,]/g, '');
    const url = `https://scholar.google.com/scholar?q=${encodeURIComponent(citation)}`;
    evidence.push({ 
      url, 
      snippet: `Academic citation: ${citation}` 
    });
  }
  
  return evidence;
}
```

### Step 2.4: Verify Skeptic Agent Evidence Return

**File**: `src/lib/agents/skeptic.ts` (line 180-200)

Ensure the agent returns evidence properly:

```typescript
return {
  role: 'skeptic',
  content,
  evidence: extractedEvidence, // ← Make sure this array is populated
  provider_used: result.provider,
  tokens_used: result.result.usage?.total_tokens || 0,
};
```

**Test Command**:
```powershell
# Watch console logs during debate
npm run dev
# Look for: [SKEPTIC] Evidence items from agent: X
```

---

## TASK 3: Filter Malformed Evidence URLs (20 minutes)

**File**: `src/lib/evidence/tracker.ts` (line 20-30)

### Step 3.1: Add URL Validation

In the `trackEvidence` method, add validation BEFORE creating evidence entry:

```typescript
async trackEvidence(
  url: string,
  snippet: string,
  role: 'believer' | 'skeptic'
): Promise<TrackedEvidence> {
  // VALIDATE URL FORMAT
  if (!this.isValidUrl(url)) {
    console.warn(`[EVIDENCE] Skipping invalid URL: ${url.substring(0, 50)}`);
    throw new Error('Invalid URL format');
  }

  const existing = this.evidenceMap.get(url);
  // ... rest of method
}

private isValidUrl(url: string): boolean {
  try {
    // Must be valid URL
    const urlObj = new URL(url);
    
    // Must have http/https protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // Must have valid hostname with TLD
    if (!urlObj.hostname.includes('.')) {
      return false;
    }
    
    // Must not be URL-encoded query string
    if (url.includes('%20') || url.includes('%2F')) {
      return false;
    }
    
    // Must be reasonable length
    if (url.length < 10 || url.length > 500) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}
```

### Step 3.2: Add Try-Catch in Streaming Route

**File**: `app/api/debate/stream/route.ts`

Wrap evidence tracking in try-catch (lines 60-70 and 115-125):

```typescript
for (const ev of allEvidence) {
  try {
    const tracked = await tracker.trackEvidence(ev.url, ev.snippet, 'believer');
    // ... send to client
  } catch (evErr) {
    // Skip invalid evidence silently
    console.warn(`[STREAM] Skipped invalid evidence:`, evErr instanceof Error ? evErr.message : 'unknown');
  }
}
```

---

## Testing Checklist

### Test 1: Verify Credibility Scores
Run debate with claim: "vaccines cause autism"

**Expected Results**:
- [ ] `cdc.gov` → 85-95%
- [ ] `stanford.edu` → 85-95%
- [ ] `forbes.com` → 65-75%
- [ ] `reddit.com` → 20-35%

### Test 2: Verify Skeptic Evidence Appears
Run debate and check Evidence Sources panel:

**Expected Results**:
- [ ] At least 3-5 sources labeled "✗ Skeptic"
- [ ] Sources match what Skeptic mentioned in argument
- [ ] No duplicate URLs between Believer/Skeptic

### Test 3: Verify No Malformed URLs
**Expected Results**:
- [ ] No URLs containing `%20` or `%2F`
- [ ] No raw search queries appearing as evidence
- [ ] All evidence has valid domains (contains `.com`, `.edu`, etc.)

---

## Success Criteria
- [ ] Academic sources score 85-95%
- [ ] News sources score 70-85%
- [ ] Social media scores 20-35%
- [ ] Skeptic's evidence appears in panel
- [ ] No malformed URLs in evidence list
- [ ] At least 10 total evidence sources per debate (5 Believer + 5 Skeptic)

---

## Files to Modify
1. ✏️ `src/lib/evidence/tracker.ts` - Fix credibility scoring + add URL validation
2. ✏️ `src/lib/streaming/sse-handler.ts` - Improve evidence extraction regex
3. ✏️ `src/lib/agents/skeptic.ts` - Verify evidence return structure
4. ✏️ `app/api/debate/stream/route.ts` - Add try-catch for invalid evidence

---

## Expected Time
**Total**: 95 minutes (1.5 hours)
- Task 1: 30 min (credibility scoring)
- Task 2: 45 min (skeptic evidence tracking)
- Task 3: 20 min (URL validation)

---

## Rollback Plan
If changes break the system:
```bash
git stash
git checkout HEAD -- src/lib/evidence/tracker.ts
npm run dev
```

Then fix issues one task at a time.