import type { Evidence } from './evidence';

export type AgentRole = 'believer' | 'skeptic' | 'judge';
export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface Agent {
  role: AgentRole;
  provider: AIProvider;
  temperature: number;
  max_tokens: number;
  max_tool_calls: number;
}

export interface AgentResponse {
  role: AgentRole;
  content: string;
  evidence: Evidence[];
  provider_used: AIProvider;
  tokens_used: number;
}

export interface AgentConfig {
  role: AgentRole;
  provider: AIProvider;
  temperature: number;
  systemPrompt: string;
  tools: string[]; // MCP tool names
}
