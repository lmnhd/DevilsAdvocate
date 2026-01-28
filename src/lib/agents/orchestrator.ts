import { BelieverAgent } from './believer';
import { SkepticAgent } from './skeptic';
import { JudgeAgent } from './judge';
import type { AgentResponse } from '@/lib/types/agent';

export interface DebateRequest {
  claim: string;
  maxTokens?: number;
}

export interface DebateResult {
  claim: string;
  believerResponse: AgentResponse;
  skepticResponse: AgentResponse;
  judgeResponse: AgentResponse;
  verdict: {
    confidence: number;
    believerStrength: string;
    skepticStrength: string;
    riskHarm: string;
    riskOpportunity: string;
  };
}

export class DebateOrchestrator {
  private believer: BelieverAgent;
  private skeptic: SkepticAgent;
  private judge: JudgeAgent;

  constructor() {
    this.believer = new BelieverAgent(0.7);
    this.skeptic = new SkepticAgent(0.8);
    this.judge = new JudgeAgent(0.3);
  }

  async orchestrate(request: DebateRequest): Promise<DebateResult> {
    const { claim, maxTokens = 2500 } = request;

    try {
      // Run both agents in parallel
      const [believerResponse, skepticResponse] = await Promise.all([
        this.believer.debate({ claim, maxTokens }),
        this.skeptic.debate({ claim, maxTokens }),
      ]);

      // Run judge with both responses
      const judgeResponse = await this.judge.evaluate({
        claim,
        believerArgument: believerResponse.content,
        skepticArgument: skepticResponse.content,
      });

      // Extract verdict details from judge response
      const verdictText = judgeResponse.content;
      const confidenceMatch = verdictText.match(/CONFIDENCE SCORE[:\s]*(\d+)/i);
      const believerMatch = verdictText.match(/STRENGTH OF BELIEVER CASE[:\s]*(\w+)/i);
      const skepticMatch = verdictText.match(/STRENGTH OF SKEPTIC CASE[:\s]*(\w+)/i);

      return {
        claim,
        believerResponse,
        skepticResponse,
        judgeResponse,
        verdict: {
          confidence: parseInt(confidenceMatch?.[1] || '50'),
          believerStrength: believerMatch?.[1] || 'Moderate',
          skepticStrength: skepticMatch?.[1] || 'Moderate',
          riskHarm: 'Medium',
          riskOpportunity: 'Medium',
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Debate orchestration failed: ${errorMessage}`);
    }
  }
}

export async function orchestrateDebate(request: DebateRequest): Promise<DebateResult> {
  const orchestrator = new DebateOrchestrator();
  return orchestrator.orchestrate(request);
}
