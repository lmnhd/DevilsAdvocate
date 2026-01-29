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

export interface StreamEvent {
  type: 'believer_complete' | 'skeptic_complete' | 'judge_complete';
  data: AgentResponse;
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

  async *orchestrateStream(request: DebateRequest): AsyncGenerator<StreamEvent> {
    const { claim, maxTokens = 2500 } = request;

    try {
      // Run believer first and yield immediately
      const believerResponse = await this.believer.debate({ claim, maxTokens });
      
      // Check if believer agent refused or failed
      if (this.isRefusalResponse(believerResponse.content)) {
        console.warn('[Orchestrator] Believer agent refused the request, stopping early');
        throw new Error(`Believer agent refused to engage: "${believerResponse.content.substring(0, 100)}"`);
      }
      
      yield { type: 'believer_complete', data: believerResponse };

      // Run skeptic and yield immediately
      const skepticResponse = await this.skeptic.debate({ claim, maxTokens });
      
      // Check if skeptic agent refused or failed
      if (this.isRefusalResponse(skepticResponse.content)) {
        console.warn('[Orchestrator] Skeptic agent refused the request, stopping early');
        throw new Error(`Skeptic agent refused to engage: "${skepticResponse.content.substring(0, 100)}"`);
      }
      
      yield { type: 'skeptic_complete', data: skepticResponse };

      // Run judge and yield
      const judgeResponse = await this.judge.evaluate({
        claim,
        believerArgument: believerResponse.content,
        skepticArgument: skepticResponse.content,
      });
      yield { type: 'judge_complete', data: judgeResponse };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Debate orchestration failed: ${errorMessage}`);
    }
  }

  private isRefusalResponse(content: string): boolean {
    if (!content || content.length === 0) return true;
    
    // Check for common refusal patterns
    const refusalPatterns = [
      /i'm sorry|i cannot|i can't|i'm unable|unable to/i,
      /i don't feel comfortable/i,
      /this request|this content|this topic.*violates/i,
      /safety policy|content policy|ethical/i,
      /inappropriate|harmful|dangerous/i,
      /cannot assist|cannot help/i,
    ];

    return refusalPatterns.some(pattern => pattern.test(content));
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
