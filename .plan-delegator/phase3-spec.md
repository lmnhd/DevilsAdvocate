# Phase 3 of 7: Core MCP Tools

## EXECUTE THIS PHASE NOW

Build MCP tool wrappers for real-time verification (Brave Search, Google Fact Check, Archive.org, WHOIS) with rate limiting, caching, and parallel execution testing.

---

## Files to Create (9 total)

### 1. src/lib/mcp/types.ts
TypeScript interface definitions for MCP tools

**Content**:
```typescript
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  relevanceScore?: number;
  publishedDate?: string;
}

export interface FactCheckResult {
  claim: string;
  claimant?: string;
  claimDate?: string;
  rating: string; // "True", "False", "Misleading", etc.
  ratingLevel?: number;
  url: string;
  publisher: string;
  textualRating?: string;
}

export interface ArchiveSnapshot {
  url: string;
  timestamp: string;
  status: number;
  available: boolean;
  archiveUrl?: string;
}

export interface DomainInfo {
  domain: string;
  registrar?: string;
  creationDate?: string;
  expirationDate?: string;
  ageInDays?: number;
  credibilityScore?: number;
  nameServers?: string[];
  error?: string;
}

export interface RateLimitInfo {
  toolName: string;
  remaining: number;
  resetAt: Date;
  limited: boolean;
}

export interface ToolResponse<T> {
  data: T;
  cached: boolean;
  rateLimit: RateLimitInfo;
  error?: string;
}

export interface VerificationTools {
  braveSearch: (query: string) => Promise<ToolResponse<SearchResult[]>>;
  factCheck: (claim: string) => Promise<ToolResponse<FactCheckResult[]>>;
  archive: (url: string, timestamp?: string) => Promise<ToolResponse<ArchiveSnapshot[]>>;
  whois: (domain: string) => Promise<ToolResponse<DomainInfo>>;
}
```

---

### 2. src/lib/mcp/rate-limiter.ts
Rate limiting per tool

**Content**:
```typescript
interface RateLimit {
  maxRequests: number;
  windowMs: number;
  requests: { timestamp: number }[];
}

export class RateLimiter {
  private limits: Map<string, RateLimit> = new Map();

  constructor() {
    this.setLimit('brave', 2000, 30 * 24 * 60 * 60 * 1000);
    this.setLimit('factcheck', 10000, 24 * 60 * 60 * 1000);
    this.setLimit('archive', 100, 60 * 60 * 1000);
    this.setLimit('whois', 1000, 24 * 60 * 60 * 1000);
  }

  private setLimit(tool: string, maxRequests: number, windowMs: number) {
    this.limits.set(tool, { maxRequests, windowMs, requests: [] });
  }

  canMakeRequest(tool: string): boolean {
    const limit = this.limits.get(tool);
    if (!limit) return true;
    const now = Date.now();
    limit.requests = limit.requests.filter(req => now - req.timestamp < limit.windowMs);
    return limit.requests.length < limit.maxRequests;
  }

  recordRequest(tool: string): void {
    const limit = this.limits.get(tool);
    if (!limit) return;
    limit.requests.push({ timestamp: Date.now() });
  }

  getRemainingQuota(tool: string): number {
    const limit = this.limits.get(tool);
    if (!limit) return Infinity;
    const now = Date.now();
    const validRequests = limit.requests.filter(req => now - req.timestamp < limit.windowMs);
    return Math.max(0, limit.maxRequests - validRequests.length);
  }

  getResetTime(tool: string): Date {
    const limit = this.limits.get(tool);
    if (!limit || limit.requests.length === 0) {
      return new Date(Date.now() + limit!.windowMs);
    }
    const oldestRequest = Math.min(...limit.requests.map(r => r.timestamp));
    return new Date(oldestRequest + limit.windowMs);
  }
}

export const rateLimiter = new RateLimiter();
```

---

### 3. src/lib/mcp/brave-search.ts
Brave Search API wrapper with caching

**Content**:
```typescript
import { rateLimiter } from './rate-limiter';
import type { ToolResponse, SearchResult } from './types';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: SearchResult[]; timestamp: number }>();

export async function braveSearch(query: string): Promise<ToolResponse<SearchResult[]>> {
  const toolName = 'brave';
  
  // Check cache
  const cached = cache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      data: cached.data,
      cached: true,
      rateLimit: {
        toolName,
        remaining: rateLimiter.getRemainingQuota(toolName),
        resetAt: rateLimiter.getResetTime(toolName),
        limited: !rateLimiter.canMakeRequest(toolName),
      },
    };
  }

  // Check rate limit
  if (!rateLimiter.canMakeRequest(toolName)) {
    return {
      data: [],
      cached: false,
      rateLimit: {
        toolName,
        remaining: 0,
        resetAt: rateLimiter.getResetTime(toolName),
        limited: true,
      },
      error: 'Rate limit exceeded',
    };
  }

  try {
    rateLimiter.recordRequest(toolName);
    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) {
      return {
        data: [],
        cached: false,
        rateLimit: {
          toolName,
          remaining: rateLimiter.getRemainingQuota(toolName),
          resetAt: rateLimiter.getResetTime(toolName),
          limited: false,
        },
        error: 'BRAVE_API_KEY not configured',
      };
    }

    const response = await fetch('https://api.search.brave.com/res/v1/web/search', {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey },
      cache: 'no-store',
    }).then(r => r.json() as Promise<any>);

    const results: SearchResult[] = (response.web || []).map((item: any, idx: number) => ({
      title: item.title,
      url: item.url,
      snippet: item.description,
      source: new URL(item.url).hostname,
      relevanceScore: 100 - (idx * 10),
      publishedDate: item.published,
    }));

    // Cache results
    cache.set(query, { data: results, timestamp: Date.now() });

    return {
      data: results,
      cached: false,
      rateLimit: {
        toolName,
        remaining: rateLimiter.getRemainingQuota(toolName),
        resetAt: rateLimiter.getResetTime(toolName),
        limited: false,
      },
    };
  } catch (error) {
    return {
      data: [],
      cached: false,
      rateLimit: {
        toolName,
        remaining: rateLimiter.getRemainingQuota(toolName),
        resetAt: rateLimiter.getResetTime(toolName),
        limited: false,
      },
      error: `Brave Search API error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
```

---

### 4. src/lib/mcp/fact-check.ts
Google Fact Check API wrapper

**Content**:
```typescript
import { rateLimiter } from './rate-limiter';
import type { ToolResponse, FactCheckResult } from './types';

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { data: FactCheckResult[]; timestamp: number }>();

export async function factCheck(claim: string): Promise<ToolResponse<FactCheckResult[]>> {
  const toolName = 'factcheck';

  // Check cache
  const cached = cache.get(claim);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      data: cached.data,
      cached: true,
      rateLimit: {
        toolName,
        remaining: rateLimiter.getRemainingQuota(toolName),
        resetAt: rateLimiter.getResetTime(toolName),
        limited: !rateLimiter.canMakeRequest(toolName),
      },
    };
  }

  if (!rateLimiter.canMakeRequest(toolName)) {
    return {
      data: [],
      cached: false,
      rateLimit: {
        toolName,
        remaining: 0,
        resetAt: rateLimiter.getResetTime(toolName),
        limited: true,
      },
      error: 'Rate limit exceeded',
    };
  }

  try {
    rateLimiter.recordRequest(toolName);
    const apiKey = process.env.GOOGLE_FACT_CHECK_API_KEY;
    if (!apiKey) {
      return {
        data: [],
        cached: false,
        rateLimit: {
          toolName,
          remaining: rateLimiter.getRemainingQuota(toolName),
          resetAt: rateLimiter.getResetTime(toolName),
          limited: false,
        },
        error: 'GOOGLE_FACT_CHECK_API_KEY not configured',
      };
    }

    const response = await fetch(
      `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(claim)}&languageCode=en&key=${apiKey}`,
      { cache: 'no-store' }
    ).then(r => r.json() as Promise<any>);

    const results: FactCheckResult[] = (response.claims || []).map((claim: any) => ({
      claim: claim.text,
      claimant: claim.claimant,
      rating: claim.claimReview?.[0]?.textualRating || 'Unknown',
      url: claim.claimReview?.[0]?.url,
      publisher: claim.claimReview?.[0]?.publisher?.name || 'Unknown',
      textualRating: claim.claimReview?.[0]?.textualRating,
    }));

    cache.set(claim, { data: results, timestamp: Date.now() });

    return {
      data: results,
      cached: false,
      rateLimit: {
        toolName,
        remaining: rateLimiter.getRemainingQuota(toolName),
        resetAt: rateLimiter.getResetTime(toolName),
        limited: false,
      },
    };
  } catch (error) {
    return {
      data: [],
      cached: false,
      rateLimit: {
        toolName,
        remaining: rateLimiter.getRemainingQuota(toolName),
        resetAt: rateLimiter.getResetTime(toolName),
        limited: false,
      },
      error: `Fact Check API error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
```

---

### 5. src/lib/mcp/archive.ts
Archive.org Wayback Machine wrapper

**Content**:
```typescript
import { rateLimiter } from './rate-limiter';
import type { ToolResponse, ArchiveSnapshot } from './types';

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { data: ArchiveSnapshot[]; timestamp: number }>();

export async function archive(url: string, timestamp?: string): Promise<ToolResponse<ArchiveSnapshot[]>> {
  const toolName = 'archive';
  const cacheKey = `${url}:${timestamp || 'latest'}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      data: cached.data,
      cached: true,
      rateLimit: {
        toolName,
        remaining: rateLimiter.getRemainingQuota(toolName),
        resetAt: rateLimiter.getResetTime(toolName),
        limited: !rateLimiter.canMakeRequest(toolName),
      },
    };
  }

  if (!rateLimiter.canMakeRequest(toolName)) {
    return {
      data: [],
      cached: false,
      rateLimit: {
        toolName,
        remaining: 0,
        resetAt: rateLimiter.getResetTime(toolName),
        limited: true,
      },
      error: 'Rate limit exceeded',
    };
  }

  try {
    rateLimiter.recordRequest(toolName);
    const response = await fetch(
      `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&matchType=domain&output=json&sort=timestamp&collapse=urlkey&filter=statuscode:200&limit=100`,
      { cache: 'no-store' }
    ).then(r => r.json() as Promise<any>);

    const results: ArchiveSnapshot[] = (response[0] ? response.slice(1, 6) : []).map((row: any[]) => ({
      url,
      timestamp: row[1],
      status: parseInt(row[4]),
      available: parseInt(row[4]) === 200,
      archiveUrl: `https://web.archive.org/web/${row[1]}/${url}`,
    }));

    cache.set(cacheKey, { data: results, timestamp: Date.now() });

    return {
      data: results,
      cached: false,
      rateLimit: {
        toolName,
        remaining: rateLimiter.getRemainingQuota(toolName),
        resetAt: rateLimiter.getResetTime(toolName),
        limited: false,
      },
    };
  } catch (error) {
    return {
      data: [],
      cached: false,
      rateLimit: {
        toolName,
        remaining: rateLimiter.getRemainingQuota(toolName),
        resetAt: rateLimiter.getResetTime(toolName),
        limited: false,
      },
      error: `Archive API error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
```

---

### 6. src/lib/mcp/whois.ts
WHOIS domain lookup wrapper

**Content**:
```typescript
import { rateLimiter } from './rate-limiter';
import type { ToolResponse, DomainInfo } from './types';

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { data: DomainInfo; timestamp: number }>();

export async function whois(domain: string): Promise<ToolResponse<DomainInfo>> {
  const toolName = 'whois';

  // Check cache
  const cached = cache.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      data: cached.data,
      cached: true,
      rateLimit: {
        toolName,
        remaining: rateLimiter.getRemainingQuota(toolName),
        resetAt: rateLimiter.getResetTime(toolName),
        limited: !rateLimiter.canMakeRequest(toolName),
      },
    };
  }

  if (!rateLimiter.canMakeRequest(toolName)) {
    return {
      data: { domain, error: 'Rate limit exceeded' },
      cached: false,
      rateLimit: {
        toolName,
        remaining: 0,
        resetAt: rateLimiter.getResetTime(toolName),
        limited: true,
      },
      error: 'Rate limit exceeded',
    };
  }

  try {
    rateLimiter.recordRequest(toolName);
    const apiKey = process.env.WHOIS_API_KEY;
    if (!apiKey) {
      return {
        data: { domain, error: 'WHOIS_API_KEY not configured' },
        cached: false,
        rateLimit: {
          toolName,
          remaining: rateLimiter.getRemainingQuota(toolName),
          resetAt: rateLimiter.getResetTime(toolName),
          limited: false,
        },
        error: 'WHOIS_API_KEY not configured',
      };
    }

    const response = await fetch(
      `https://www.whoisxmlapi.com/api/v1?apiKey=${apiKey}&domain=${encodeURIComponent(domain)}`,
      { cache: 'no-store' }
    ).then(r => r.json() as Promise<any>);

    const registrationDate = response.registryData?.registryExpiryDate
      ? new Date(response.registryData.createdDate)
      : new Date();
    const ageInDays = Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
    const credibilityScore = Math.min(100, Math.max(0, ageInDays / 3650 * 100));

    const result: DomainInfo = {
      domain,
      registrar: response.registryData?.registrar?.name,
      creationDate: response.registryData?.createdDate,
      expirationDate: response.registryData?.registryExpiryDate,
      ageInDays,
      credibilityScore,
      nameServers: response.registryData?.nameServers || [],
    };

    cache.set(domain, { data: result, timestamp: Date.now() });

    return {
      data: result,
      cached: false,
      rateLimit: {
        toolName,
        remaining: rateLimiter.getRemainingQuota(toolName),
        resetAt: rateLimiter.getResetTime(toolName),
        limited: false,
      },
    };
  } catch (error) {
    return {
      data: { domain, error: error instanceof Error ? error.message : String(error) },
      cached: false,
      rateLimit: {
        toolName,
        remaining: rateLimiter.getRemainingQuota(toolName),
        resetAt: rateLimiter.getResetTime(toolName),
        limited: false,
      },
      error: `WHOIS API error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
```

---

### 7. src/lib/mcp/index.ts
Unified export

**Content**:
```typescript
export { braveSearch } from './brave-search';
export { factCheck } from './fact-check';
export { archive } from './archive';
export { whois } from './whois';
export type {
  SearchResult,
  FactCheckResult,
  ArchiveSnapshot,
  DomainInfo,
  RateLimitInfo,
  ToolResponse,
  VerificationTools,
} from './types';
export { rateLimiter } from './rate-limiter';
```

---

### 8. app/tests/mcp/page.tsx
Interactive test UI

**Content**:
```typescript
'use client';

import { useState } from 'react';

export default function MCPTestPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runAllTools = async () => {
    if (!input) return;
    setLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/test/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error:', error);
      setResults({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold mb-2">MCP Tools Test Page</h1>
      <p className="text-gray-600 mb-8">Test parallel execution of all 4 verification tools</p>
      
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runAllTools()}
          placeholder="Enter claim or URL to verify..."
          className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={runAllTools}
          disabled={!input || loading}
          className="w-full px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
        >
          {loading ? 'Running All Tools...' : 'Run All Tools'}
        </button>
      </div>

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brave Search */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-blue-600">Brave Search</h2>
            <div className="text-xs text-gray-600 mb-3">
              <p>Cached: {results.brave?.cached ? '✓ Yes' : '✗ No'}</p>
              <p>Rate Limit: {results.brave?.rateLimit?.remaining} remaining</p>
              <p>Status: {results.brave?.error ? `Error: ${results.brave.error}` : 'Success'}</p>
            </div>
            <div className="space-y-2">
              {results.brave?.data?.slice(0, 3).map((r: any, i: number) => (
                <div key={i} className="text-sm">
                  <a href={r.url} className="text-blue-600 hover:underline font-medium">{r.title}</a>
                  <p className="text-gray-700">{r.snippet}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Fact Check */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-green-600">Google Fact Check</h2>
            <div className="text-xs text-gray-600 mb-3">
              <p>Cached: {results.factcheck?.cached ? '✓ Yes' : '✗ No'}</p>
              <p>Rate Limit: {results.factcheck?.rateLimit?.remaining} remaining</p>
              <p>Status: {results.factcheck?.error ? `Error: ${results.factcheck.error}` : 'Success'}</p>
            </div>
            <div className="space-y-2">
              {results.factcheck?.data?.slice(0, 3).map((fc: any, i: number) => (
                <div key={i} className="text-sm p-2 bg-gray-50 rounded">
                  <p className="font-medium">{fc.claim}</p>
                  <p className="text-gray-600">Rating: <span className="font-bold text-orange-600">{fc.rating}</span></p>
                  <p className="text-gray-500">{fc.publisher}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Archive */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-purple-600">Archive.org Wayback</h2>
            <div className="text-xs text-gray-600 mb-3">
              <p>Cached: {results.archive?.cached ? '✓ Yes' : '✗ No'}</p>
              <p>Rate Limit: {results.archive?.rateLimit?.remaining} remaining</p>
              <p>Status: {results.archive?.error ? `Error: ${results.archive.error}` : 'Success'}</p>
            </div>
            <div className="space-y-2">
              {results.archive?.data?.slice(0, 3).map((snap: any, i: number) => (
                <div key={i} className="text-sm p-2 bg-gray-50 rounded">
                  <p>Available: {snap.available ? '✓ Yes' : '✗ No'}</p>
                  <p className="text-gray-600">{snap.timestamp}</p>
                  {snap.archiveUrl && <a href={snap.archiveUrl} className="text-blue-600 hover:underline">View Archive</a>}
                </div>
              ))}
            </div>
          </div>

          {/* WHOIS */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-red-600">WHOIS Lookup</h2>
            <div className="text-xs text-gray-600 mb-3">
              <p>Cached: {results.whois?.cached ? '✓ Yes' : '✗ No'}</p>
              <p>Rate Limit: {results.whois?.rateLimit?.remaining} remaining</p>
              <p>Status: {results.whois?.error ? `Error: ${results.whois.error}` : 'Success'}</p>
            </div>
            {results.whois?.data && !results.whois.data.error && (
              <div className="text-sm space-y-1">
                <p>Domain: <span className="font-mono">{results.whois.data.domain}</span></p>
                <p>Registrar: {results.whois.data.registrar}</p>
                <p>Age: {results.whois.data.ageInDays} days</p>
                <p>Credibility: <span className="font-bold">{Math.round(results.whois.data.credibilityScore || 0)}%</span></p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 9. app/api/test/mcp/route.ts
API endpoint for parallel execution

**Content**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { braveSearch, factCheck, archive, whois } from '@/lib/mcp';

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();

    if (!input) {
      return NextResponse.json({ error: 'Input required' }, { status: 400 });
    }

    // Run all tools in parallel
    const [braveResults, factcheckResults, archiveResults, whoisResults] = await Promise.all([
      braveSearch(input).catch(e => ({
        error: e.message,
        data: [],
        cached: false,
        rateLimit: { toolName: 'brave', remaining: 0, limited: true, resetAt: new Date() },
      })),
      factCheck(input).catch(e => ({
        error: e.message,
        data: [],
        cached: false,
        rateLimit: { toolName: 'factcheck', remaining: 0, limited: true, resetAt: new Date() },
      })),
      archive(input).catch(e => ({
        error: e.message,
        data: [],
        cached: false,
        rateLimit: { toolName: 'archive', remaining: 0, limited: true, resetAt: new Date() },
      })),
      whois(extractDomain(input)).catch(e => ({
        error: e.message,
        data: null,
        cached: false,
        rateLimit: { toolName: 'whois', remaining: 0, limited: true, resetAt: new Date() },
      })),
    ]);

    return NextResponse.json({
      input,
      brave: braveResults,
      factcheck: factcheckResults,
      archive: archiveResults,
      whois: whoisResults,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function extractDomain(input: string): string {
  try {
    if (input.startsWith('http')) {
      return new URL(input).hostname || input;
    }
    return input;
  } catch {
    return input;
  }
}
```

---

## VERIFICATION CHECKLIST

After creating all files:

- [ ] TypeScript compiles: `npm run build`
- [ ] No `any` types used
- [ ] All files under 500 lines
- [ ] Navigate to `/tests/mcp` - page loads
- [ ] Input claim, click "Run All Tools"
- [ ] All 4 tool sections show results or errors
- [ ] Rate limit info displays correctly
- [ ] Cached indicator works (run same query twice)
- [ ] Error handling works (missing API keys)

## SUCCESS CRITERIA

✅ Phase 3 is complete when:
1. All 9 files created
2. Test page functional at `/tests/mcp`
3. All tools execute in parallel
4. No TypeScript errors
5. Rate limiting works
6. Caching works
7. Graceful error handling

## NEXT PHASE

→ Phase 4: Agent System (believer, skeptic, judge agents)

