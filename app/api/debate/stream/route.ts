import { NextRequest, NextResponse } from 'next/server';
import { DebateOrchestrator } from '@/lib/agents/orchestrator';
import { EvidenceTracker } from '@/lib/evidence/tracker';
import { formatSSE, extractEvidenceFromToken } from '@/lib/streaming/sse-handler';

export const runtime = 'edge';

interface StreamRequest {
  claim: string;
  debateLength?: 'short' | 'medium' | 'long';
}

function getTokensForLength(length: 'short' | 'medium' | 'long'): number {
  const limits = {
    short: 1000,
    medium: 2500,
    long: 5000,
  };
  return limits[length] || limits.medium;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const claim = searchParams.get('claim');
    const debateLength = (searchParams.get('debateLength') as 'short' | 'medium' | 'long') || 'medium';

    console.log(`\n[STREAM] ========== STARTING DEBATE ==========`);
    console.log(`[STREAM] Timestamp: ${new Date().toISOString()}`);
    console.log(`[STREAM] Claim: "${claim}"`);
    console.log(`[STREAM] Length: ${debateLength}`);

    if (!claim) {
      console.error('[STREAM] ERROR: No claim provided');
      return NextResponse.json({ error: 'Claim is required' }, { status: 400 });
    }

    const maxTokens = getTokensForLength(debateLength);
    console.log(`[STREAM] Max tokens: ${maxTokens}`);

    const orchestrator = new DebateOrchestrator();
    const tracker = new EvidenceTracker();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log(`[STREAM] ReadableStream started, initializing orchestrator`);

          for await (const event of orchestrator.orchestrateStream({ claim, maxTokens })) {
            const eventTime = Date.now() - startTime;
            console.log(`[STREAM] [${eventTime}ms] Event received: ${event.type}`);

            if (event.type === 'believer_complete') {
              const believerStart = Date.now();
              const fullContent = event.data.content;
              
              console.log(`[STREAM] BELIEVER_COMPLETE:`);
              console.log(`[STREAM]   Provider: ${event.data.provider_used || 'unknown'}`);
              console.log(`[STREAM]   Content length: ${fullContent?.length || 0} chars`);
              console.log(`[STREAM]   Tokens used: ${event.data.tokens_used || 'N/A'}`);
              console.log(`[STREAM]   Preview: ${fullContent?.substring(0, 80) || 'EMPTY'}...`);
              
              // Extract evidence from agent's evidence array
              const agentEvidence = event.data.evidence || [];
              console.log(`[STREAM]   Evidence items from agent: ${agentEvidence.length}`);
              console.log(`[STREAM]   🔍 DEBUG: Event.data structure:`, {
                hasEvidence: !!event.data.evidence,
                evidenceArray: agentEvidence,
                evidenceLength: agentEvidence.length,
                firstItem: agentEvidence[0],
              });
              
              for (const ev of agentEvidence) {
                try {
                  console.log(`[STREAM]   🔍 Processing evidence item:`, {
                    source_url: ev.source_url,
                    domain: ev.domain,
                    mentioned_by: ev.mentioned_by,
                    snippet: ev.snippet?.substring(0, 50),
                  });
                  
                  if (!ev.source_url) {
                    console.warn(`[STREAM]   ⚠️ Skipping evidence with no source_url`);
                    continue;
                  }
                  
                  const tracked = await tracker.trackEvidence(ev.source_url, ev.snippet || '', 'believer');
                  console.log(`[STREAM]   ✓ Tracked evidence:`, {
                    url: tracked.url,
                    domain: tracked.domain,
                    credibility: tracked.credibility_score,
                    mentioned_by: tracked.mentioned_by,
                  });
                  
                  const evidenceData = formatSSE('believer_evidence', {
                    url: tracked.url,
                    credibility: tracked.credibility_score || ev.credibility_score || 50,
                    snippet: (tracked.snippet || ev.snippet || '').substring(0, 100),
                    domain: tracked.domain,
                  });
                  controller.enqueue(encoder.encode(evidenceData));
                } catch (evErr) {
                  // Skip invalid evidence silently
                  console.warn(`[STREAM] ❌ Skipped invalid evidence:`, evErr instanceof Error ? evErr.message : 'unknown');
                }
              }

              // Stream believer response tokens
              const believerTokens = fullContent.split(' ');
              console.log(`[STREAM]   Streaming ${believerTokens.length} tokens to client`);
              for (const token of believerTokens) {
                const eventData = formatSSE('believer_token', { token: token + ' ' });
                controller.enqueue(encoder.encode(eventData));
                await new Promise((resolve) => setTimeout(resolve, 5));
              }
              
              console.log(`[STREAM]   ✓ Believer complete in ${Date.now() - believerStart}ms\n`);

            } else if (event.type === 'skeptic_complete') {
              const skepticStart = Date.now();
              const fullContent = event.data.content;
              
              console.log(`[STREAM] SKEPTIC_COMPLETE:`);
              console.log(`[STREAM]   Provider: ${event.data.provider_used || 'unknown'}`);
              console.log(`[STREAM]   Content length: ${fullContent?.length || 0} chars`);
              console.log(`[STREAM]   Tokens used: ${event.data.tokens_used || 'N/A'}`);
              console.log(`[STREAM]   Preview: ${fullContent?.substring(0, 80) || 'EMPTY'}...`);

              // Extract evidence from agent's evidence array
              const agentEvidence = event.data.evidence || [];
              console.log(`[STREAM]   Evidence items from agent: ${agentEvidence.length}`);
              console.log(`[STREAM]   🔍 DEBUG: Event.data structure:`, {
                hasEvidence: !!event.data.evidence,
                evidenceArray: agentEvidence,
                evidenceLength: agentEvidence.length,
                firstItem: agentEvidence[0],
              });
              
              for (const ev of agentEvidence) {
                try {
                  console.log(`[STREAM]   🔍 Processing evidence item:`, {
                    source_url: ev.source_url,
                    domain: ev.domain,
                    mentioned_by: ev.mentioned_by,
                    snippet: ev.snippet?.substring(0, 50),
                  });
                  
                  if (!ev.source_url) {
                    console.warn(`[STREAM]   ⚠️ Skipping evidence with no source_url`);
                    continue;
                  }
                  
                  const tracked = await tracker.trackEvidence(ev.source_url, ev.snippet || '', 'skeptic');
                  console.log(`[STREAM]   ✓ Tracked evidence:`, {
                    url: tracked.url,
                    domain: tracked.domain,
                    credibility: tracked.credibility_score,
                    mentioned_by: tracked.mentioned_by,
                  });
                  
                  const evidenceData = formatSSE('skeptic_evidence', {
                    url: tracked.url,
                    credibility: tracked.credibility_score || ev.credibility_score || 50,
                    snippet: (tracked.snippet || ev.snippet || '').substring(0, 100),
                    domain: tracked.domain,
                  });
                  controller.enqueue(encoder.encode(evidenceData));
                } catch (evErr) {
                  // Skip invalid evidence silently
                  console.warn(`[STREAM] ❌ Skipped invalid evidence:`, evErr instanceof Error ? evErr.message : 'unknown');
                }
              }

              // Stream skeptic response tokens
              const skepticTokens = fullContent.split(' ');
              console.log(`[STREAM]   Streaming ${skepticTokens.length} tokens to client`);
              for (const token of skepticTokens) {
                const eventData = formatSSE('skeptic_token', { token: token + ' ' });
                controller.enqueue(encoder.encode(eventData));
                await new Promise((resolve) => setTimeout(resolve, 5));
              }
              
              console.log(`[STREAM]   ✓ Skeptic complete in ${Date.now() - skepticStart}ms\n`);

            } else if (event.type === 'judge_complete') {
              const judgeStart = Date.now();
              
              console.log(`[STREAM] JUDGE_COMPLETE:`);
              console.log(`[STREAM]   Provider: ${event.data.provider_used || 'unknown'}`);
              console.log(`[STREAM]   Content length: ${event.data.content?.length || 0} chars`);
              console.log(`[STREAM]   Tokens used: ${event.data.tokens_used || 'N/A'}`);

              // Extract verdict details from judge response
              const verdictText = event.data.content;
              // Try multiple verdict patterns
              let verdictMatch = verdictText.match(/\*\*VERDICT\*\*:?\s*(.+?)(?:\n|\*\*)/i);
              if (!verdictMatch) {
                verdictMatch = verdictText.match(/^(.+?)(?:\n|\*\*CONFIDENCE)/im);
              }
              const confidenceMatch = verdictText.match(/\*\*CONFIDENCE SCORE\*\*:?\s*(\d+)/i);
              const believerMatch = verdictText.match(/\*\*STRENGTH OF BELIEVER CASE\*\*:?\s*(\w+(?:\s+\w+)?)/i);
              const skepticMatch = verdictText.match(/\*\*STRENGTH OF SKEPTIC CASE\*\*:?\s*(\w+(?:\s+\w+)?)/i);
              const harmMatch = verdictText.match(/If we acted on the Believer's position and they're wrong, what harm could result\?[^\n]*?([^\n]+?)(?=If we rejected|\*\*|$)/is);
              const opportunityMatch = verdictText.match(/If we rejected the Believer's position and they're right, what opportunity is lost\?[^\n]*?([^\n]+?)(?=\*\*|$)/is);
              
              // Extract key factors and gaps
              const keyFactorsMatch = verdictText.match(/\*\*KEY EVIDENCE FACTORS\*\*:?\s*([\s\S]*?)(?=\*\*|$)/i);
              const criticalGapsMatch = verdictText.match(/\*\*CRITICAL GAPS\*\*:?\s*([^\*]+)/i);
              
              const keyFactors = keyFactorsMatch 
                ? keyFactorsMatch[1]
                    .split('\n')
                    .filter(line => line.trim() && !line.includes('**'))
                    .map(line => line.replace(/^\d+\.\s*|^[-•]\s*/, '').trim())
                    .slice(0, 3)
                : [];

              const confidence = parseInt(confidenceMatch?.[1] || '50');
              const harmLevel = harmMatch?.[1]?.toLowerCase() || 'medium';
              const opportunityLevel = opportunityMatch?.[1]?.toLowerCase() || 'medium';
              
              // Calculate overall risk assessment
              let riskAssessment: 'low' | 'medium' | 'high' = 'medium';
              if (harmLevel === 'high' || opportunityLevel === 'high') {
                riskAssessment = 'high';
              } else if (harmLevel === 'low' && opportunityLevel === 'low') {
                riskAssessment = 'low';
              }

              console.log(`[STREAM]   Verdict: ${verdictMatch?.[1] || 'PARSE_FAILED'}`);
              console.log(`[STREAM]   Confidence score: ${confidence}`);
              console.log(`[STREAM]   Believer strength: ${believerMatch?.[1] || 'PARSE_FAILED'}`);
              console.log(`[STREAM]   Skeptic strength: ${skepticMatch?.[1] || 'PARSE_FAILED'}`);
              console.log(`[STREAM]   Risk assessment: ${riskAssessment}`);

              // Send judge verdict with parsed data
              const judgeEvent = formatSSE('judge_complete', {
                verdict: verdictMatch?.[1]?.trim() || 'Unable to determine verdict',
                confidence,
                riskAssessment,
                believerStrength: believerMatch?.[1] || 'Moderate',
                skepticStrength: skepticMatch?.[1] || 'Moderate',
                harmIfWrong: harmMatch?.[1]?.trim() || '',
                opportunityIfWrong: opportunityMatch?.[1]?.trim() || '',
                keyFactors,
                criticalGaps: criticalGapsMatch?.[1]?.trim() || '',
              });
              controller.enqueue(encoder.encode(judgeEvent));
              
              console.log(`[STREAM]   ✓ Judge complete in ${Date.now() - judgeStart}ms\n`);
            }
          }

          // Send evidence summary
          const allEvidence = tracker.getAllEvidence();
          const believerEv = tracker.getEvidenceByRole('believer');
          const skepticEv = tracker.getEvidenceByRole('skeptic');
          
          console.log(`[STREAM] DEBATE_SUMMARY:`);
          console.log(`[STREAM]   Total evidence: ${allEvidence.length}`);
          console.log(`[STREAM]   Believer evidence: ${believerEv.length}`);
          console.log(`[STREAM]   Skeptic evidence: ${skepticEv.length}`);
          
          const topEvidence = tracker.getTopEvidence(5);
          console.log(`[STREAM]   Top 5 sources:`);
          topEvidence.forEach((e, i) => {
            console.log(`[STREAM]     ${i + 1}. ${e.domain} (credibility: ${e.credibility_score})`);
          });
          
          const summaryEvent = formatSSE('evidence_summary', {
            total: allEvidence.length,
            byRole: {
              believer: believerEv.length,
              skeptic: skepticEv.length,
            },
            topSources: topEvidence.map((e) => ({ url: e.url, credibility: e.credibility_score })),
          });
          controller.enqueue(encoder.encode(summaryEvent));

          const totalDuration = Date.now() - startTime;
          console.log(`[STREAM] ========== DEBATE COMPLETE ==========`);
          console.log(`[STREAM] Total duration: ${totalDuration}ms`);
          console.log(`[STREAM]\n`);
          
          controller.close();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : 'No stack trace';
          const duration = Date.now() - startTime;
          
          console.error(`\n[STREAM] ========== ERROR OCCURRED ==========`);
          console.error(`[STREAM] Error message: ${errorMsg}`);
          console.error(`[STREAM] Error stack: ${errorStack}`);
          console.error(`[STREAM] Duration before error: ${duration}ms`);
          console.error(`[STREAM] =====================================\n`);
          
          const errorEvent = formatSSE('error', { message: errorMsg });
          controller.enqueue(encoder.encode(errorEvent));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
