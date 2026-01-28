/**
 * Debate System Type Definitions
 * Core types for the multi-agent debate framework
 */

export type DebateStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type PerspectiveType = 'support' | 'oppose' | 'neutral';

/**
 * Client request for initiating a debate
 */
export interface DebateRequest {
  topic: string;
  context?: string;
  maxRounds?: number;
  includeFactChecking?: boolean;
  includeSourceVerification?: boolean;
  userId?: string;
}

/**
 * Complete debate result with all rounds and analysis
 */
export interface DebateResult {
  id: string;
  topic: string;
  context?: string;
  status: DebateStatus;
  rounds: DebateRound[];
  summary: DebateSummary;
  metadata: DebateMetadata;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Individual debate round with both perspectives
 */
export interface DebateRound {
  roundNumber: number;
  support: AgentArgument;
  oppose: AgentArgument;
  factChecks: FactCheck[];
  timestamp: Date;
}

/**
 * Argument presented by an agent
 */
export interface AgentArgument {
  perspective: PerspectiveType;
  content: string;
  evidenceSources: EvidenceReference[];
  confidence: number; // 0-1
  biasIndicators?: BiasIndicator[];
}

/**
 * Reference to evidence source
 */
export interface EvidenceReference {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  credibilityScore: number; // 0-1
}

/**
 * Fact check result for a claim
 */
export interface FactCheck {
  claim: string;
  verdict: 'true' | 'false' | 'misleading' | 'unverified';
  confidence: number; // 0-1
  sources: FactCheckSource[];
  explanation: string;
}

/**
 * Source for fact checking
 */
export interface FactCheckSource {
  name: string;
  url: string;
  verdict: string;
}

/**
 * Detected bias in argument
 */
export interface BiasIndicator {
  type: 'emotional' | 'logical-fallacy' | 'omission' | 'framing';
  description: string;
  severity: 'low' | 'medium' | 'high';
  location: string; // excerpt where bias detected
}

/**
 * Summary of entire debate
 */
export interface DebateSummary {
  keyPoints: string[];
  consensusAreas: string[];
  disagreementAreas: string[];
  overallVerdict: string;
  recommendedReading: EvidenceReference[];
}

/**
 * Metadata about debate execution
 */
export interface DebateMetadata {
  totalRounds: number;
  totalTokensUsed: number;
  providersUsed: string[];
  averageResponseTime: number; // milliseconds
  factChecksPerformed: number;
  sourcesVerified: number;
  userId?: string;
}
