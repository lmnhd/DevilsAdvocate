import { GoogleGenerativeAI } from '@google/generative-ai';
import { judgeSystemPrompt } from '@/lib/prompts/judge';
import { AIProviderManager } from '@/lib/utils/ai-provider';
import type { AgentResponse } from '@/lib/types/agent';

interface JudgeInput {
  claim: string;
  believerArgument: string;
  skepticArgument: string;
}

interface JudgeVerdict {
  verdict:
    | 'Claim Supported'
    | 'Claim Partially Supported'
    | 'Claim Unproven'
    | 'Claim Unsupported';
  confidenceScore: number;
  believerStrength: 'Weak' | 'Moderate' | 'Strong' | 'Very Strong';
  skepticStrength: 'Weak' | 'Moderate' | 'Strong' | 'Very Strong';
  keyFactors: string[];
  criticalGaps: string;
  riskAssessment: {
    harmIfWrong: 'Low' | 'Medium' | 'High';
    opportunityIfWrong: 'Low' | 'Medium' | 'High';
  };
}

export class JudgeAgent {
  private temperature: number;
  private providerManager: AIProviderManager;
  private genAI: GoogleGenerativeAI;

  constructor(temperature: number = 0.3) {
    this.temperature = temperature;
    this.providerManager = new AIProviderManager(['gemini', 'openai', 'anthropic']);
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
  }

  async evaluate(input: JudgeInput): Promise<AgentResponse> {
    const { claim, believerArgument, skepticArgument } = input;

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `${judgeSystemPrompt}

---

CLAIM TO EVALUATE: "${claim}"

BELIEVER'S ARGUMENT:
${believerArgument}

SKEPTIC'S ARGUMENT:
${skepticArgument}

---

Provide your structured verdict now:`;

      const result = await model.generateContent(prompt);
      const content = result.response.text();

      // Parse the verdict from response
      const verdict = this.parseVerdict(content);

      return {
        role: 'judge',
        content,
        evidence: [
          {
            id: 'judge-verdict',
            source_url: '',
            domain: 'internal',
            snippet: content,
            credibility_score: 100,
            timestamp: new Date(),
            debate_id: '',
            mentioned_by: 'both' as const,
          },
        ],
        provider_used: 'gemini',
        tokens_used: 0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Judge agent failed: ${errorMessage}`);
    }
  }

  private parseVerdict(content: string): JudgeVerdict {
    // Extract verdict components from the structured response
    const verdictMatch = content.match(/\*\*VERDICT\*\*:?\s*(.+?)(?=\n|$)/i);
    const confidenceMatch = content.match(/\*\*CONFIDENCE SCORE\*\*:?\s*(\d+)/i);
    const believerMatch = content.match(/\*\*STRENGTH OF BELIEVER CASE\*\*:?\s*(.+?)(?=\n|$)/i);
    const skepticMatch = content.match(/\*\*STRENGTH OF SKEPTIC CASE\*\*:?\s*(.+?)(?=\n|$)/i);
    const gapsMatch = content.match(/\*\*CRITICAL GAPS\*\*:?\s*(.+?)(?=\*\*|$)/is);
    const riskMatch = content.match(/harm.*?(\w+).*?opportunity.*?(\w+)/is);

    return {
      verdict: (verdictMatch?.[1]?.trim() || 'Claim Unproven') as any,
      confidenceScore: parseInt(confidenceMatch?.[1] || '50'),
      believerStrength: (believerMatch?.[1]?.trim() || 'Moderate') as any,
      skepticStrength: (skepticMatch?.[1]?.trim() || 'Moderate') as any,
      keyFactors: this.extractKeyFactors(content),
      criticalGaps: gapsMatch?.[1]?.trim() || 'Unknown',
      riskAssessment: {
        harmIfWrong: (riskMatch?.[1]?.toLowerCase() as any) || 'Medium',
        opportunityIfWrong: (riskMatch?.[2]?.toLowerCase() as any) || 'Medium',
      },
    };
  }

  private extractKeyFactors(content: string): string[] {
    const match = content.match(/\*\*KEY EVIDENCE FACTORS\*\*:?\s*(.+?)(?=\*\*|$)/is);
    if (!match) return [];

    return match[1]
      .split('\n')
      .filter((line) => line.trim())
      .slice(0, 3)
      .map((line) => line.replace(/^\d+\.\s*/, '').trim());
  }
}

export async function createJudgeAgent(input: JudgeInput): Promise<AgentResponse> {
  if (!input.claim || !input.believerArgument || !input.skepticArgument) {
    throw new Error('Claim, believerArgument, and skepticArgument are required');
  }

  const agent = new JudgeAgent(0.3);
  return agent.evaluate(input);
}
