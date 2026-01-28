import { rateLimiter } from './rate-limiter';
import type { ToolResponse, ArchiveSnapshot } from './types';

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { data: ArchiveSnapshot[]; timestamp: number }>();

export async function archive(url: string, timestamp?: string): Promise<ToolResponse<ArchiveSnapshot[]>> {
  const toolName = 'archive';
  const cacheKey = `${url}:${timestamp || 'latest'}`;

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
