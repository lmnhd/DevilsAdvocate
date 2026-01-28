import OpenAI from 'openai';
import { believerSystemPrompt } from '@/lib/prompts/believer';
import { braveSearch } from '@/lib/mcp';
import { AIProviderManager } from '@/lib/utils/ai-provider';
import type { AgentResponse } from '@/lib/types/agent';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface BelieverOptions {
  claim: string;
  maxTokens?: number;
  temperature?: number;
}

export class BelieverAgent {
  private temperature: number;
  private providerManager: AIProviderManager;

  constructor(temperature: number = 0.7) {
    this.temperature = temperature;
    this.providerManager = new AIProviderManager(['openai', 'anthropic', 'gemini']);
  }

  async debate(options: BelieverOptions): Promise<AgentResponse> {
    const { claim, maxTokens = 2500 } = options;

    try {
      // Gather evidence using Brave Search
      const searchResults = await braveSearch(claim);
      const evidenceSummary = this.formatEvidenceFromSearch(searchResults);

      // Call OpenAI with provider fallback
      const result = await this.providerManager.executeWithFallback(async (provider) => {
        if (provider.provider === 'openai') {
          return await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [
              {
                role: 'system',
                content: believerSystemPrompt,
              },
              {
                role: 'user',
                content: `Debate claim: "${claim}"\n\nRelevant evidence found:\n${evidenceSummary}`,
              },
            ],
            temperature: this.temperature,
            max_tokens: maxTokens,
          });
        }

        // Fallback providers would be handled here but we delegate to provider manager
        throw new Error(`Provider ${provider.provider} not configured for direct use`);
      });

      const content = result.result.choices[0]?.message?.content || '';

      return {
        role: 'believer',
        content,
        evidence: (searchResults.data || []).map((r: any, idx: number) => ({
          id: `believer-${idx}`,
          source_url: r.url || '',
          domain: r.source || '',
          snippet: r.snippet || '',
          credibility_score: r.relevanceScore || 50,
          timestamp: new Date(),
          debate_id: '',
          mentioned_by: 'believer' as const,
        })),
        provider_used: result.provider,
        tokens_used: result.result.usage?.total_tokens || 0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Believer agent failed: ${errorMessage}`);
    }
  }

  private formatEvidenceFromSearch(searchResults: any): string {
    if (!searchResults.data || searchResults.data.length === 0) {
      return 'No evidence found';
    }

    return searchResults.data
      .slice(0, 5)
      .map(
        (result: any, idx: number) =>
          `${idx + 1}. "${result.title}" from ${result.source}\n   Snippet: ${result.snippet}`
      )
      .join('\n\n');
  }
}

export async function createBelieverAgent(
  options?: Partial<BelieverOptions>
): Promise<AgentResponse> {
  if (!options?.claim) {
    throw new Error('Claim is required for believer agent');
  }

  const agent = new BelieverAgent(options.temperature);
  return agent.debate(options as BelieverOptions);
}
