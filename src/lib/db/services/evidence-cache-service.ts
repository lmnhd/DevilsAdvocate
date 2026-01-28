import { eq, lt } from 'drizzle-orm';
import type { DbClient } from '../client';
import { evidence_cache } from '../schema';
import { nanoid } from 'nanoid';
import type { MCPResult, MCPToolType } from '@/lib/types/mcp';

export class EvidenceCacheService {
  private CACHE_TTL_DAYS = 7;

  constructor(private db: DbClient) {}

  async cacheEvidence(
    toolType: MCPToolType,
    query: string,
    result: MCPResult
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(toolType, query);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.db.insert(evidence_cache).values({
      id: nanoid(),
      cache_key: cacheKey,
      tool_type: toolType,
      query,
      result_data: JSON.stringify(result),
      created_at: now,
      expires_at: expiresAt,
    });
  }

  async getCachedEvidence(toolType: MCPToolType, query: string): Promise<MCPResult | null> {
    const cacheKey = this.generateCacheKey(toolType, query);
    const now = new Date();

    const results = await this.db
      .select()
      .from(evidence_cache)
      .where(eq(evidence_cache.cache_key, cacheKey))
      .limit(1);

    if (results.length === 0) return null;

    const cached = results[0];

    // Check if expired
    if (new Date(cached.expires_at) < now) {
      await this.db.delete(evidence_cache).where(eq(evidence_cache.id, cached.id));
      return null;
    }

    return JSON.parse(cached.result_data);
  }

  async clearExpiredCache(): Promise<number> {
    const now = new Date();
    const result = await this.db
      .delete(evidence_cache)
      .where(lt(evidence_cache.expires_at, now));

    return result.rowsAffected || 0;
  }

  private generateCacheKey(toolType: MCPToolType, query: string): string {
    return `${toolType}:${query.toLowerCase().trim()}`;
  }
}
