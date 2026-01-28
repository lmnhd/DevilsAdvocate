import Anthropic from '@anthropic-ai/sdk';
import { skepticSystemPrompt } from '@/lib/prompts/skeptic';
import { factCheck, whois, archive } from '@/lib/mcp';
import { AIProviderManager } from '@/lib/utils/ai-provider';
import type { AgentResponse } from '@/lib/types/agent';

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
      // Gather counter-evidence using multiple MCP tools
      const [factCheckResults, domainInfo, archiveResults] = await Promise.all([
        factCheck(claim).catch(() => ({ data: [], error: 'Fact check unavailable' })),
        whois(this.extractDomain(claim)).catch(() => ({ data: {}, error: 'WHOIS unavailable' })),
        archive(claim).catch(() => ({ data: [], error: 'Archive unavailable' })),
      ]);

      const counterEvidenceSummary = this.formatCounterEvidence(
        factCheckResults,
        domainInfo,
        archiveResults
      );

      // Call Anthropic Claude with provider fallback
      const result = await this.providerManager.executeWithFallback(async (provider) => {
        if (provider.provider === 'anthropic') {
          return await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: maxTokens,
            system: skepticSystemPrompt,
            messages: [
              {
                role: 'user',
                content: `Debate claim: "${claim}"\n\nCounter-evidence found:\n${counterEvidenceSummary}`,
              },
            ],
          });
        }

        throw new Error(`Provider ${provider.provider} not configured for direct use`);
      });

      const message = result.result.content[0];
      const content = message.type === 'text' ? message.text : '';

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
        provider_used: result.provider,
        tokens_used: result.result.usage?.input_tokens || 0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
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
