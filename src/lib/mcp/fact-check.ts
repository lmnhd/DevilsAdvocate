import { rateLimiter } from './rate-limiter';
import type { ToolResponse, FactCheckResult } from './types';

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { data: FactCheckResult[]; timestamp: number }>();

export async function factCheck(claim: string): Promise<ToolResponse<FactCheckResult[]>> {
  const toolName = 'factcheck';

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

    const results: FactCheckResult[] = (response.claims || []).map((claimItem: any) => ({
      claim: claimItem.text,
      claimant: claimItem.claimant,
      rating: claimItem.claimReview?.[0]?.textualRating || 'Unknown',
      url: claimItem.claimReview?.[0]?.url,
      publisher: claimItem.claimReview?.[0]?.publisher?.name || 'Unknown',
      textualRating: claimItem.claimReview?.[0]?.textualRating,
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
