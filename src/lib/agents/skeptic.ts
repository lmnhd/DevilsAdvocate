import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { skepticSystemPrompt } from '@/lib/prompts/skeptic';
import { factCheck, whois, archive } from '@/lib/mcp';
import { AIProviderManager } from '@/lib/utils/ai-provider';
import type { AgentResponse } from '@/lib/types/agent';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface SkepticOptions {
  claim: string;
  maxTokens?: number;
  temperature?: number;
}

export class SkepticAgent {
  private temperature: number;
  private providerManager: AIProviderManager;

  constructor(temperature: number = 0.8) {
    this.temperature = temperature;
    this.providerManager = new AIProviderManager(['anthropic', 'openai', 'gemini']);
  }

  async debate(options: SkepticOptions): Promise<AgentResponse> {
    const { claim, maxTokens = 2500 } = options;

    try {
      // Gather counter-evidence using multiple MCP tools with graceful fallback
      let counterEvidenceSummary = '';
      let factCheckResults: any = { data: [], error: 'Not available' };
      let domainInfo: any = { data: {}, error: 'Not available' };
      let archiveResults: any = { data: [], error: 'Not available' };

      try {
        // Try to gather evidence from MCP tools
        [factCheckResults, domainInfo, archiveResults] = await Promise.all([
          factCheck(claim).catch(() => ({ data: [], error: 'Fact check unavailable' })),
          whois(this.extractDomain(claim)).catch(() => ({ data: {}, error: 'WHOIS unavailable' })),
          archive(claim).catch(() => ({ data: [], error: 'Archive unavailable' })),
        ]);

        counterEvidenceSummary = this.formatCounterEvidence(
          factCheckResults,
          domainInfo,
          archiveResults
        );
      } catch (toolError) {
        console.warn('MCP tools failed, using fallback:', toolError);
        counterEvidenceSummary = 'Limited external evidence available - will rely on logical analysis and general knowledge.';
      }

      // Call Anthropic Claude directly with OpenAI fallback
      let content = '';
      let tokensUsed = 0;

      try {
        const response = await anthropic.messages.create({
          model: 'claude-opus-4-1-20250805',
          max_tokens: maxTokens,
          system: skepticSystemPrompt,
          messages: [
            {
              role: 'user',
              content: `Debate claim: "${claim}"\n\nCounter-evidence found:\n${counterEvidenceSummary}`,
            },
          ],
        });
        const message = response.content[0];
        content = message.type === 'text' ? message.text : '';
        tokensUsed = response.usage?.input_tokens || 0;
      } catch (anthropicError) {
        // Fallback to OpenAI if Anthropic fails
        console.warn('Anthropic failed, falling back to OpenAI:', anthropicError);
        const response = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: skepticSystemPrompt,
            },
            {
              role: 'user',
              content: `Debate claim: "${claim}"\n\nCounter-evidence found:\n${counterEvidenceSummary}`,
            },
          ],
          temperature: this.temperature,
          max_tokens: maxTokens,
        });
        content = response.choices[0]?.message?.content || '';
        tokensUsed = response.usage?.total_tokens || 0;
      }

      // Ensure content is not empty
      if (!content || content.trim().length === 0) {
        throw new Error('Skeptic agent returned empty response');
      }

      return {
        role: 'skeptic',
        content,
        evidence: (factCheckResults.data || []).map((fc: any, idx: number) => ({
          id: `skeptic-${idx}`,
          source_url: fc.url || '',
          domain: fc.publisher || '',
          snippet: fc.rating || '',
          credibility_score: 75,
          timestamp: new Date(),
          debate_id: '',
          mentioned_by: 'skeptic' as const,
        })),
        provider_used: 'anthropic',
        tokens_used: tokensUsed,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[SkepticAgent]', errorMessage);
      throw new Error(`Skeptic agent failed: ${errorMessage}`);
    }
  }

  private extractDomain(input: string): string {
    try {
      if (input.startsWith('http')) {
        return new URL(input).hostname || input;
      }
      return input;
    } catch {
      return input;
    }
  }

  private formatCounterEvidence(factCheckResults: any, domainInfo: any, archiveResults: any): string {
    const parts: string[] = [];

    if (factCheckResults.data?.length > 0) {
      parts.push(
        `Fact Checks:\n${factCheckResults.data
          .slice(0, 3)
          .map((fc: any) => `- "${fc.claim}" → Rating: ${fc.rating} (${fc.publisher})`)
          .join('\n')}`
      );
    }

    if (domainInfo.data?.credibilityScore !== undefined) {
      parts.push(`Domain Credibility: ${Math.round(domainInfo.data.credibilityScore)}%`);
    }

    if (archiveResults.data?.length > 0) {
      parts.push(`Historical snapshots available: ${archiveResults.data.length} archives found`);
    }

    if (parts.length === 0) {
      parts.push('Limited counter-evidence available - rely on logical analysis');
    }

    return parts.join('\n\n');
  }
}

export async function createSkepticAgent(
  options?: Partial<SkepticOptions>
): Promise<AgentResponse> {
  if (!options?.claim) {
    throw new Error('Claim is required for skeptic agent');
  }

  const agent = new SkepticAgent(options.temperature);
  return agent.debate(options as SkepticOptions);
}
