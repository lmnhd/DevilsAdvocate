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
    const debateStart = Date.now();

    console.log(`[BELIEVER] Starting debate...`);
    console.log(`[BELIEVER]   Claim: "${claim.substring(0, 80)}..."`);
    console.log(`[BELIEVER]   Max tokens: ${maxTokens}`);

    try {
      // Gather evidence using Brave Search
      console.log(`[BELIEVER] Gathering evidence via Brave Search...`);
      const searchStart = Date.now();
      const searchResults = await braveSearch(claim);
      const searchDuration = Date.now() - searchStart;
      
      console.log(`[BELIEVER] Search completed in ${searchDuration}ms`);
      console.log(`[BELIEVER]   Results found: ${(searchResults.data || []).length}`);
      
      const evidenceSummary = this.formatEvidenceFromSearch(searchResults);
      console.log(`[BELIEVER]   Evidence summary length: ${evidenceSummary.length} chars`);

      // Call OpenAI with provider fallback
      console.log(`[BELIEVER] Calling AI provider...`);
      const aiStart = Date.now();
      
      const result = await this.providerManager.executeWithFallback(async (provider) => {
        console.log(`[BELIEVER]   Attempting provider: ${provider.provider}`);
        
        if (provider.provider === 'openai') {
          const response = await openai.chat.completions.create({
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
          
          console.log(`[BELIEVER]   ✓ OpenAI succeeded`);
          console.log(`[BELIEVER]     Tokens used: ${response.usage?.total_tokens || 'N/A'}`);
          console.log(`[BELIEVER]     Content length: ${response.choices[0]?.message?.content?.length || 0} chars`);
          
          return response;
        }

        throw new Error(`Provider ${provider.provider} not configured for direct use`);
      });

      const aiDuration = Date.now() - aiStart;
      console.log(`[BELIEVER] AI call completed in ${aiDuration}ms`);
      
      const content = result.result.choices[0]?.message?.content || '';
      
      console.log(`[BELIEVER] ✓ Response generated`);
      console.log(`[BELIEVER]   Content length: ${content.length} chars`);
      console.log(`[BELIEVER]   Preview: ${content.substring(0, 80)}...`);

      const response: AgentResponse = {
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
      
      const totalDuration = Date.now() - debateStart;
      console.log(`[BELIEVER] ========== BELIEVER COMPLETE ==========`);
      console.log(`[BELIEVER] Total duration: ${totalDuration}ms`);
      console.log(`[BELIEVER]   Search: ${searchDuration}ms`);
      console.log(`[BELIEVER]   AI: ${aiDuration}ms`);
      console.log(`[BELIEVER]\n`);

      return response;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';
      const duration = Date.now() - debateStart;
      
      console.error(`[BELIEVER] ========== BELIEVER ERROR ==========`);
      console.error(`[BELIEVER] Error: ${errorMsg}`);
      console.error(`[BELIEVER] Stack: ${errorStack}`);
      console.error(`[BELIEVER] Duration before error: ${duration}ms`);
      console.error(`[BELIEVER] ====================================\n`);
      
      throw new Error(`Believer agent failed: ${errorMsg}`);
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
