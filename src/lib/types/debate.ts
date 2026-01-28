import type { EvidenceSource } from './evidence';

export interface Debate {
  id: string;
  claim: string;
  believer_argument: string;
  skeptic_argument: string;
  judge_verdict: string;
  confidence_score: number; // 0-100
  evidence_sources: EvidenceSource[];
  status: DebateStatus;
  created_at: Date;
  updated_at: Date;
}

export interface DebateRequest {
  claim: string;
  debateLength: 'short' | 'medium' | 'long';
  aiProviders?: {
    believer?: 'openai' | 'anthropic' | 'gemini';
    skeptic?: 'openai' | 'anthropic' | 'gemini';
    judge?: 'openai' | 'anthropic' | 'gemini';
  };
}

export interface DebateResponse {
  debateId: string;
  status: DebateStatus;
  believer_argument: string;
  skeptic_argument: string;
  judge_verdict: string;
  confidence_score: number;
  evidence_sources: EvidenceSource[];
}

export type DebateStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
