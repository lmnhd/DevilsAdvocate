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
    const orchestrationStart = Date.now();

    console.log(`[ORCHESTRATOR] ========== ORCHESTRATION START ==========`);
    console.log(`[ORCHESTRATOR] Claim: "${claim}"`);
    console.log(`[ORCHESTRATOR] Max tokens: ${maxTokens}`);

    try {
      // Run believer first and yield immediately
      console.log(`[ORCHESTRATOR] Starting Believer agent...`);
      const believerStart = Date.now();
      const believerResponse = await this.believer.debate({ claim, maxTokens });
      const believerDuration = Date.now() - believerStart;
      
      console.log(`[ORCHESTRATOR] Believer response received in ${believerDuration}ms`);
      console.log(`[ORCHESTRATOR]   Content length: ${believerResponse.content?.length || 0} chars`);
      console.log(`[ORCHESTRATOR]   Provider: ${believerResponse.provider_used || 'unknown'}`);
      
      // Check if believer agent refused or failed
      if (this.isRefusalResponse(believerResponse.content)) {
        console.error(`[ORCHESTRATOR] ❌ BELIEVER REFUSED - Early stopping`);
        console.error(`[ORCHESTRATOR]   Response: "${believerResponse.content.substring(0, 120)}"`);
        throw new Error(`Believer agent refused to engage: "${believerResponse.content.substring(0, 100)}"`);
      }
      
      console.log(`[ORCHESTRATOR] ✓ Believer response validated`);
      yield { type: 'believer_complete', data: believerResponse };

      // Run skeptic and yield immediately
      console.log(`[ORCHESTRATOR] Starting Skeptic agent...`);
      const skepticStart = Date.now();
      const skepticResponse = await this.skeptic.debate({ claim, maxTokens });
      const skepticDuration = Date.now() - skepticStart;
      
      console.log(`[ORCHESTRATOR] Skeptic response received in ${skepticDuration}ms`);
      console.log(`[ORCHESTRATOR]   Content length: ${skepticResponse.content?.length || 0} chars`);
      console.log(`[ORCHESTRATOR]   Provider: ${skepticResponse.provider_used || 'unknown'}`);
      
      // Check if skeptic agent refused or failed
      if (this.isRefusalResponse(skepticResponse.content)) {
        console.error(`[ORCHESTRATOR] ❌ SKEPTIC REFUSED - Early stopping`);
        console.error(`[ORCHESTRATOR]   Response: "${skepticResponse.content.substring(0, 120)}"`);
        throw new Error(`Skeptic agent refused to engage: "${skepticResponse.content.substring(0, 100)}"`);
      }
      
      console.log(`[ORCHESTRATOR] ✓ Skeptic response validated`);
      yield { type: 'skeptic_complete', data: skepticResponse };

      // Run judge and yield
      console.log(`[ORCHESTRATOR] Starting Judge agent...`);
      const judgeStart = Date.now();
      const judgeResponse = await this.judge.evaluate({
        claim,
        believerArgument: believerResponse.content,
        skepticArgument: skepticResponse.content,
      });
      const judgeDuration = Date.now() - judgeStart;
      
      console.log(`[ORCHESTRATOR] Judge response received in ${judgeDuration}ms`);
      console.log(`[ORCHESTRATOR]   Content length: ${judgeResponse.content?.length || 0} chars`);
      console.log(`[ORCHESTRATOR]   Provider: ${judgeResponse.provider_used || 'unknown'}`);
      console.log(`[ORCHESTRATOR] ✓ Judge response validated`);
      
      yield { type: 'judge_complete', data: judgeResponse };

      const totalDuration = Date.now() - orchestrationStart;
      console.log(`[ORCHESTRATOR] ========== ORCHESTRATION COMPLETE ==========`);
      console.log(`[ORCHESTRATOR] Total duration: ${totalDuration}ms`);
      console.log(`[ORCHESTRATOR]   Believer: ${believerDuration}ms`);
      console.log(`[ORCHESTRATOR]   Skeptic: ${skepticDuration}ms`);
      console.log(`[ORCHESTRATOR]   Judge: ${judgeDuration}ms`);
      console.log(`[ORCHESTRATOR]\n`);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';
      const duration = Date.now() - orchestrationStart;
      
      console.error(`[ORCHESTRATOR] ========== ORCHESTRATION ERROR ==========`);
      console.error(`[ORCHESTRATOR] Error: ${errorMsg}`);
      console.error(`[ORCHESTRATOR] Stack: ${errorStack}`);
      console.error(`[ORCHESTRATOR] Duration before error: ${duration}ms`);
      console.error(`[ORCHESTRATOR] =======================================\n`);
      
      throw new Error(`Debate orchestration failed: ${errorMsg}`);
    }
  }

  private isRefusalResponse(content: string): boolean {
    if (!content || content.length === 0) return true;
    
    // Only check for explicit AI refusal patterns (first-person statements)
    // Do NOT flag strong factual rebuttals or scientific language
    const refusalPatterns = [
      /^I('m| am) (sorry|unable|not able)/i,
      /^I (cannot|can't|won't)/i,
      /^I don't feel comfortable/i,
      /^(I|This) violates (my|our) (safety|content|ethical) (policy|guidelines)/i,
      /^As an AI,? I (cannot|can't|am unable)/i,
      /^I'm programmed not to/i,
    ];

    // Must match at start of response or after whitespace to avoid false positives
    const normalizedContent = content.trim();
    return refusalPatterns.some(pattern => pattern.test(normalizedContent));
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
