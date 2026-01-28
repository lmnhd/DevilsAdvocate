import { rateLimiter } from './rate-limiter';
import type { ToolResponse, DomainInfo } from './types';

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { data: DomainInfo; timestamp: number }>();

export async function whois(domain: string): Promise<ToolResponse<DomainInfo>> {
  const toolName = 'whois';

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

    const registrationDate = response.registryData?.createdDate
      ? new Date(response.registryData.createdDate)
      : new Date();
    const ageInDays = Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
    const credibilityScore = Math.min(100, Math.max(0, (ageInDays / 3650) * 100));

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
