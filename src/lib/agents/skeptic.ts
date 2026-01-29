import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { skepticSystemPrompt } from '@/lib/prompts/skeptic';
import { factCheck, whois, archive } from '@/lib/mcp';
import { AIProviderManager } from '@/lib/utils/ai-provider';
import type { AgentResponse, AIProvider } from '@/lib/types/agent';

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
    const debateStart = Date.now();

    console.log(`[SKEPTIC] Starting debate...`);
    console.log(`[SKEPTIC]   Claim: "${claim.substring(0, 80)}..."`);
    console.log(`[SKEPTIC]   Max tokens: ${maxTokens}`);

    try {
      // Gather counter-evidence using multiple MCP tools with graceful fallback
      console.log(`[SKEPTIC] Gathering counter-evidence via MCP tools...`);
      const toolStart = Date.now();
      
      let counterEvidenceSummary = '';
      let factCheckResults: any = { data: [], error: 'Not available' };
      let domainInfo: any = { data: {}, error: 'Not available' };
      let archiveResults: any = { data: [], error: 'Not available' };
      let toolsUsed = 0;

      try {
        // Try to gather evidence from MCP tools
        const [fc, di, ar] = await Promise.all([
          factCheck(claim)
            .then(result => {
              console.log(`[SKEPTIC]   ✓ factCheck succeeded`);
              toolsUsed++;
              return result;
            })
            .catch(err => {
              console.warn(`[SKEPTIC]   ✗ factCheck failed: ${err instanceof Error ? err.message : 'unknown'}`);
              return { data: [], error: 'Fact check unavailable' };
            }),
          whois(this.extractDomain(claim))
            .then(result => {
              console.log(`[SKEPTIC]   ✓ whois succeeded`);
              toolsUsed++;
              return result;
            })
            .catch(err => {
              console.warn(`[SKEPTIC]   ✗ whois failed: ${err instanceof Error ? err.message : 'unknown'}`);
              return { data: {}, error: 'WHOIS unavailable' };
            }),
          archive(claim)
            .then(result => {
              console.log(`[SKEPTIC]   ✓ archive succeeded`);
              toolsUsed++;
              return result;
            })
            .catch(err => {
              console.warn(`[SKEPTIC]   ✗ archive failed: ${err instanceof Error ? err.message : 'unknown'}`);
              return { data: [], error: 'Archive unavailable' };
            }),
        ]);

        factCheckResults = fc;
        domainInfo = di;
        archiveResults = ar;

        console.log(`[SKEPTIC] Tools completed in ${Date.now() - toolStart}ms`);
        console.log(`[SKEPTIC]   Tools successful: ${toolsUsed}/3`);

        counterEvidenceSummary = this.formatCounterEvidence(
          factCheckResults,
          domainInfo,
          archiveResults
        );
        
        console.log(`[SKEPTIC]   Counter-evidence summary length: ${counterEvidenceSummary.length} chars`);
      } catch (toolError) {
        const toolErrorMsg = toolError instanceof Error ? toolError.message : String(toolError);
        console.warn(`[SKEPTIC] MCP tools failed: ${toolErrorMsg}`);
        counterEvidenceSummary = 'Limited external evidence available - will rely on logical analysis and general knowledge.';
      }

      // Call Anthropic Claude directly with OpenAI fallback
      let content = '';
      let tokensUsed = 0;
      let providerUsed: 'anthropic' | 'openai' | 'gemini' = 'anthropic';

      console.log(`[SKEPTIC] Calling AI provider (Anthropic preferred)...`);
      const aiStart = Date.now();

      try {
        console.log(`[SKEPTIC]   Attempting Anthropic Claude...`);
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
        providerUsed = 'anthropic';
        
        console.log(`[SKEPTIC]   ✓ Anthropic succeeded`);
        console.log(`[SKEPTIC]     Tokens: ${tokensUsed}`);
        console.log(`[SKEPTIC]     Content length: ${content.length} chars`);
        
      } catch (anthropicError) {
        // Fallback to OpenAI if Anthropic fails
        const anthropicMsg = anthropicError instanceof Error ? anthropicError.message : String(anthropicError);
        console.warn(`[SKEPTIC]   ✗ Anthropic failed: ${anthropicMsg}`);
        console.log(`[SKEPTIC]   Falling back to OpenAI...`);
        
        try {
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
          providerUsed = 'openai';
          
          console.log(`[SKEPTIC]   ✓ OpenAI succeeded`);
          console.log(`[SKEPTIC]     Tokens: ${tokensUsed}`);
          console.log(`[SKEPTIC]     Content length: ${content.length} chars`);
          
        } catch (openaiError) {
          const openaiMsg = openaiError instanceof Error ? openaiError.message : String(openaiError);
          console.error(`[SKEPTIC]   ✗ OpenAI also failed: ${openaiMsg}`);
          throw openaiError;
        }
      }

      const aiDuration = Date.now() - aiStart;
      console.log(`[SKEPTIC] AI call completed in ${aiDuration}ms`);

      // Ensure content is not empty
      if (!content || content.trim().length === 0) {
        const emptyErr = 'Skeptic agent returned empty response';
        console.error(`[SKEPTIC] ❌ ${emptyErr}`);
        throw new Error(emptyErr);
      }

      console.log(`[SKEPTIC] ✓ Response validated`);
      console.log(`[SKEPTIC]   Content length: ${content.length} chars`);
      console.log(`[SKEPTIC]   Preview: ${content.substring(0, 80)}...`);

      const response: AgentResponse = {
        role: 'skeptic',
        content,
        evidence: [
          // Fact check results
          ...(factCheckResults.data || []).map((fc: any, idx: number) => ({
            id: `skeptic-fc-${idx}`,
            source_url: fc.url || '',
            domain: fc.publisher || '',
            snippet: `Fact check rating: ${fc.rating || 'Unknown'}`,
            credibility_score: 75,
            timestamp: new Date(),
            debate_id: '',
            mentioned_by: 'skeptic' as const,
          })),
          // Archive results
          ...(archiveResults.data || []).map((ar: any, idx: number) => ({
            id: `skeptic-ar-${idx}`,
            source_url: ar.archiveUrl || ar.url || '',
            domain: 'archive.org',
            snippet: ar.available ? `Archived: ${ar.timestamp}` : 'Not archived',
            credibility_score: 70,
            timestamp: new Date(),
            debate_id: '',
            mentioned_by: 'skeptic' as const,
          })),
          // Domain info as evidence
          ...(domainInfo.data?.domain ? [{
            id: `skeptic-whois`,
            source_url: `https://${domainInfo.data.domain}`,
            domain: domainInfo.data.domain,
            snippet: `Domain age: ${domainInfo.data.ageInDays ? Math.floor(domainInfo.data.ageInDays / 365) + ' years' : 'Unknown'}`,
            credibility_score: domainInfo.data.credibilityScore || 60,
            timestamp: new Date(),
            debate_id: '',
            mentioned_by: 'skeptic' as const,
          }] : []),
        ],
        provider_used: providerUsed,
        tokens_used: tokensUsed,
      };
      
      const totalDuration = Date.now() - debateStart;
      console.log(`[SKEPTIC] ========== SKEPTIC COMPLETE ==========`);
      console.log(`[SKEPTIC] Total duration: ${totalDuration}ms`);
      console.log(`[SKEPTIC]   Tools: ${toolStart ? Date.now() - toolStart : 0}ms`);
      console.log(`[SKEPTIC]   AI: ${aiDuration}ms`);
      console.log(`[SKEPTIC]\n`);

      return response;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';
      const duration = Date.now() - debateStart;
      
      console.error(`[SKEPTIC] ========== SKEPTIC ERROR ==========`);
      console.error(`[SKEPTIC] Error: ${errorMsg}`);
      console.error(`[SKEPTIC] Stack: ${errorStack}`);
      console.error(`[SKEPTIC] Duration before error: ${duration}ms`);
      console.error(`[SKEPTIC] ====================================\n`);
      
      throw new Error(`Skeptic agent failed: ${errorMsg}`);
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
