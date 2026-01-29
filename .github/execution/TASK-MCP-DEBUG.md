# Execution Task: Debug and Fix MCP Tools Integration

## Objective
Fix the failing Brave Search MCP integration that's preventing evidence from appearing in debates. The screenshot shows "No evidence tracked (error: status)" and console logs indicate graceful fallbacks but no actual data retrieval.

## Current Problem
- MCP tools are failing silently despite API keys being configured
- Evidence system returns empty arrays
- Brave Search API calls are not working as expected

## Context from Code Review
- **Location**: [src/lib/mcp/brave-search.ts](../../src/lib/mcp/brave-search.ts)
- **API Key**: Present in `.env.local` (BSA45_VgR96UHGibi2E85WJUXtkAqY5)
- **Endpoint**: `https://api.search.brave.com/res/v1/web/search`
- **Current Behavior**: Returns `{ data: [], error: ... }` instead of search results

## Tasks

### 1. Add Debug Logging (15 minutes)
Add comprehensive debug output to understand what's happening:

**File**: `src/lib/mcp/brave-search.ts`

Add after line 56 (inside the try block):
```typescript
const response = await fetch(/* existing fetch */);
const json = await response.json();

// ADD DEBUG LOGGING:
console.log('═══════════════════════════════════════════');
console.log('[BRAVE DEBUG] API Call Details:');
console.log('[BRAVE DEBUG]   Query:', query);
console.log('[BRAVE DEBUG]   Status:', response.status);
console.log('[BRAVE DEBUG]   Status Text:', response.statusText);
console.log('[BRAVE DEBUG]   Headers:', Object.fromEntries(response.headers.entries()));
console.log('[BRAVE DEBUG] Raw Response:', JSON.stringify(json, null, 2));
console.log('[BRAVE DEBUG]   Has web key?', 'web' in json);
console.log('[BRAVE DEBUG]   Has results?', json.web?.results ? 'YES' : 'NO');
console.log('[BRAVE DEBUG]   Result count:', json.web?.results?.length || 0);
console.log('═══════════════════════════════════════════');

const results: SearchResult[] = (response.web?.results || []).map(/* existing map */);
```

### 2. Test the API Directly (10 minutes)
Run this PowerShell command to verify the Brave API works:

```powershell
cd C:\Users\cclem\Dropbox\Source\Projects-26\DevilsAdvocate

# Test Brave Search API
$apiKey = "BSA45_VgR96UHGibi2E85WJUXtkAqY5"
$query = "vaccines autism"
$uri = "https://api.search.brave.com/res/v1/web/search?q=$([System.Web.HttpUtility]::UrlEncode($query))"

$response = Invoke-RestMethod -Uri $uri -Method Get -Headers @{
    "Accept" = "application/json"
    "X-Subscription-Token" = $apiKey
}

Write-Host "Response Keys:" $response.PSObject.Properties.Name
Write-Host "Result Count:" $response.web.results.Count
$response.web.results[0..2] | Format-Table title, url -AutoSize
```

**Expected Output**: Should return 10+ search results with titles/URLs

### 3. Add Mock Fallback Data (30 minutes)
Create a mock data system so the app works for demos even if API fails.

**File**: `src/lib/mcp/mock-data.ts` (NEW FILE)
```typescript
import type { SearchResult } from './types';

export const MOCK_SEARCH_RESULTS: Record<string, SearchResult[]> = {
  'vaccines autism': [
    {
      title: 'CDC: Vaccine Safety - Autism',
      url: 'https://www.cdc.gov/vaccinesafety/concerns/autism.html',
      snippet: 'Studies have shown that there is no link between vaccines and autism.',
      source: 'cdc.gov',
      relevanceScore: 95,
      publishedDate: '2024-01-15',
    },
    {
      title: 'The Lancet MMR-Autism Study Retraction',
      url: 'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(10)60175-4/fulltext',
      snippet: 'The 1998 Lancet paper claiming MMR vaccine caused autism has been retracted due to fraudulent data.',
      source: 'thelancet.com',
      relevanceScore: 92,
      publishedDate: '2010-02-02',
    },
    {
      title: 'Autism Speaks: Vaccine Safety',
      url: 'https://www.autismspeaks.org/vaccine-safety',
      snippet: 'Multiple large-scale studies have found no association between vaccines and autism spectrum disorder.',
      source: 'autismspeaks.org',
      relevanceScore: 88,
      publishedDate: '2023-11-20',
    },
  ],
  'earth flat': [
    {
      title: 'NASA: Earth is Round',
      url: 'https://www.nasa.gov/audience/forstudents/5-8/features/nasa-knows/what-is-earth-58.html',
      snippet: 'Satellite images and centuries of scientific observation confirm Earth is an oblate spheroid.',
      source: 'nasa.gov',
      relevanceScore: 98,
      publishedDate: '2023-05-10',
    },
    {
      title: 'Live Science: Why Earth Is Not Flat',
      url: 'https://www.livescience.com/earth-round-not-flat.html',
      snippet: 'From ship hulls disappearing over the horizon to Eratosthenes measuring Earth\'s circumference in 240 BC, evidence is overwhelming.',
      source: 'livescience.com',
      relevanceScore: 94,
      publishedDate: '2024-01-08',
    },
  ],
  'climate change hoax': [
    {
      title: 'IPCC Climate Change Report 2023',
      url: 'https://www.ipcc.ch/report/ar6/wg1/',
      snippet: 'It is unequivocal that human influence has warmed the atmosphere, ocean and land.',
      source: 'ipcc.ch',
      relevanceScore: 97,
      publishedDate: '2023-08-09',
    },
  ],
};

export function getMockResults(query: string): SearchResult[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Try exact match first
  if (MOCK_SEARCH_RESULTS[normalizedQuery]) {
    return MOCK_SEARCH_RESULTS[normalizedQuery];
  }
  
  // Try partial match
  for (const [key, results] of Object.entries(MOCK_SEARCH_RESULTS)) {
    if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
      return results;
    }
  }
  
  // Default generic results
  return [
    {
      title: `Search results for: ${query}`,
      url: 'https://example.com',
      snippet: 'Mock data - API integration pending.',
      source: 'example.com',
      relevanceScore: 50,
      publishedDate: new Date().toISOString().split('T')[0],
    },
  ];
}
```

### 4. Update brave-search.ts to Use Mock Fallback (15 minutes)

**File**: `src/lib/mcp/brave-search.ts`

Add at top:
```typescript
import { getMockResults } from './mock-data';

const USE_MOCK_DATA = process.env.USE_MOCK_EVIDENCE === 'true';
```

Inside the `braveSearch` function, add BEFORE the try block:
```typescript
export async function braveSearch(query: string): Promise<ToolResponse<SearchResult[]>> {
  const toolName = 'brave';

  // MOCK DATA FALLBACK (for demos)
  if (USE_MOCK_DATA) {
    console.log('[BRAVE] Using mock data (USE_MOCK_EVIDENCE=true)');
    return {
      data: getMockResults(query),
      cached: false,
      rateLimit: {
        toolName,
        remaining: 100,
        resetAt: new Date(Date.now() + 60000),
        limited: false,
      },
    };
  }

  // ... existing cache check code ...
```

### 5. Add Environment Variable (5 minutes)

**File**: `.env.local`

Add this line:
```bash
# Set to 'true' to use mock evidence data instead of real API calls (for demos)
USE_MOCK_EVIDENCE=false
```

### 6. Verify Fix (20 minutes)

**Steps**:
1. Restart dev server: `npm run dev`
2. Open browser console
3. Test claim: "vaccines cause autism"
4. Watch console for `[BRAVE DEBUG]` logs
5. Verify evidence appears in UI

**If API still fails**:
- Change `USE_MOCK_EVIDENCE=true` in `.env.local`
- Restart server
- Verify mock data appears

**If API works**:
- Document the correct response format
- Remove debug logs (or comment them out)
- Keep mock fallback for future demos

## Success Criteria
- [ ] Debug logs show Brave API response structure
- [ ] Evidence appears in the UI (either from API or mock)
- [ ] No more "No evidence tracked (error: status)" messages
- [ ] Mock fallback system works when `USE_MOCK_EVIDENCE=true`
- [ ] At least 3 evidence sources show up during debate

## Files to Modify
1. ✏️ `src/lib/mcp/brave-search.ts` - Add debug logs + mock fallback integration
2. ✏️ `src/lib/mcp/mock-data.ts` - CREATE NEW - Mock evidence data
3. ✏️ `.env.local` - Add USE_MOCK_EVIDENCE flag

## Expected Time
90 minutes total

## Testing Commands
```powershell
# Terminal 1: Start dev server
cd C:\Users\cclem\Dropbox\Source\Projects-26\DevilsAdvocate
npm run dev

# Terminal 2: Watch logs
# (Browser console will show [BRAVE DEBUG] output)

# Test with mock data
$env:USE_MOCK_EVIDENCE="true"; npm run dev

# Test with real API (once fixed)
$env:USE_MOCK_EVIDENCE="false"; npm run dev
```

## Related Files for Context
- Evidence tracker: `src/lib/evidence/tracker.ts`
- Believer agent (uses braveSearch): `src/lib/agents/believer.ts`
- Streaming API: `app/api/debate/stream/route.ts`

## Notes
- Keep debug logs commented out (not deleted) for future troubleshooting
- Mock data should cover at least 5 controversial claims
- Brave API docs: https://api.search.brave.com/app/documentation/web-search/get-started
