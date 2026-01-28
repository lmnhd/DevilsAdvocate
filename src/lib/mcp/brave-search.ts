import { rateLimiter } from './rate-limiter';
import type { ToolResponse, SearchResult } from './types';

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { data: SearchResult[]; timestamp: number }>();

export async function braveSearch(query: string): Promise<ToolResponse<SearchResult[]>> {
  const toolName = 'brave';

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

    const response = await fetch('https://api.search.brave.com/res/v1/web/search?q=' + encodeURIComponent(query), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
      },
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
