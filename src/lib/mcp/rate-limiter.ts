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
      return new Date(Date.now() + (limit?.windowMs || 0));
    }
    const oldestRequest = Math.min(...limit.requests.map(r => r.timestamp));
    return new Date(oldestRequest + limit.windowMs);
  }
}

export const rateLimiter = new RateLimiter();
