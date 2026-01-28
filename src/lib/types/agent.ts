/**
 * Agent System Type Definitions
 * Types for the multi-agent debate framework
 */

export type AgentRole = 'support' | 'oppose' | 'moderator' | 'fact-checker';

export type AgentProvider = 'openai' | 'anthropic' | 'gemini';

/**
 * Configuration for an agent instance
 */
export interface AgentConfig {
  role: AgentRole;
  provider: AgentProvider;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Response from an agent
 */
export interface AgentResponse {
  role: AgentRole;
  content: string;
  reasoning?: string;
  evidence: EvidenceItem[];
  metadata: AgentResponseMetadata;
}

/**
 * Evidence item referenced by agent
 */
export interface EvidenceItem {
  source: string;
  url: string;
  relevance: number; // 0-1
  credibility: number; // 0-1
  excerpt: string;
  publishDate?: string;
}

/**
 * Metadata about agent response
 */
export interface AgentResponseMetadata {
  provider: AgentProvider;
  model: string;
  tokensUsed: number;
  responseTime: number; // milliseconds
  retries: number;
  timestamp: Date;
}

/**
 * Context passed to agents between rounds
 */
export interface AgentContext {
  topic: string;
  previousRounds: RoundContext[];
  currentRound: number;
  maxRounds: number;
  userContext?: string;
}

/**
 * Context from a previous round
 */
export interface RoundContext {
  roundNumber: number;
  supportArgument: string;
  opposeArgument: string;
  factChecks: string[];
}

/**
 * Stream chunk from agent
 */
export interface AgentStreamChunk {
  role: AgentRole;
  delta: string;
  done: boolean;
  metadata?: Partial<AgentResponseMetadata>;
}
