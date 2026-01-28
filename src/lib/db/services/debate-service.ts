import { eq, desc } from 'drizzle-orm';
import type { DbClient } from '../client';
import { debates } from '../schema';
import { nanoid } from 'nanoid';
import type { Debate, DebateStatus } from '@/lib/types/debate';
import type { EvidenceSource } from '@/lib/types/evidence';

export class DebateService {
  constructor(private db: DbClient) {}

  async createDebate(data: {
    claim: string;
    believer_argument: string;
    skeptic_argument: string;
    judge_verdict: string;
    confidence_score: number;
    evidence_sources: EvidenceSource[];
    status: DebateStatus;
  }): Promise<Debate> {
    const id = nanoid();
    const now = new Date();

    await this.db.insert(debates).values({
      id,
      claim: data.claim,
      believer_argument: data.believer_argument,
      skeptic_argument: data.skeptic_argument,
      judge_verdict: data.judge_verdict,
      confidence_score: data.confidence_score,
      evidence_sources: JSON.stringify(data.evidence_sources),
      status: data.status,
      created_at: now,
      updated_at: now,
    });

    return this.getDebateById(id) as Promise<Debate>;
  }

  async getDebateById(id: string): Promise<Debate | null> {
    const result = await this.db.select().from(debates).where(eq(debates.id, id)).limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return {
      ...row,
      evidence_sources: JSON.parse(row.evidence_sources),
      status: row.status as DebateStatus,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  async listDebates(limit: number = 10, offset: number = 0): Promise<Debate[]> {
    const results = await this.db
      .select()
      .from(debates)
      .orderBy(desc(debates.created_at))
      .limit(limit)
      .offset(offset);

    return results.map(row => ({
      ...row,
      evidence_sources: JSON.parse(row.evidence_sources),
      status: row.status as DebateStatus,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }));
  }

  async updateDebateScore(id: string, confidence_score: number): Promise<void> {
    await this.db
      .update(debates)
      .set({
        confidence_score,
        updated_at: new Date(),
      })
      .where(eq(debates.id, id));
  }

  async deleteDebate(id: string): Promise<void> {
    await this.db.delete(debates).where(eq(debates.id, id));
  }
}
