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

export async function POST(request: NextRequest) {
  try {
    const body: StreamRequest = await request.json();
    const { claim, debateLength = 'medium' } = body;

    if (!claim) {
      return NextResponse.json({ error: 'Claim is required' }, { status: 400 });
    }

    const maxTokens = getTokensForLength(debateLength);
    const orchestrator = new DebateOrchestrator();
    const tracker = new EvidenceTracker();

    const encoder = new TextEncoder();
    let buffer = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream results as they complete
          let believerResponse: any;
          let skepticResponse: any;
          let judgeResponse: any;

          for await (const event of orchestrator.orchestrateStream({ claim, maxTokens })) {
            if (event.type === 'believer_complete') {
              believerResponse = event.data;
              const fullContent = event.data.content;
              
              // Extract evidence from full content first
              const allEvidence = extractEvidenceFromToken(fullContent);
              console.log(`[Believer] Found ${allEvidence.length} evidence items`);
              
              for (const ev of allEvidence) {
                const tracked = await tracker.trackEvidence(ev.url, ev.snippet, 'believer');
                const evidenceData = formatSSE('believer_evidence', {
                  url: tracked.url,
                  credibility: tracked.credibility_score,
                  snippet: tracked.snippet.substring(0, 100),
                  domain: tracked.domain,
                });
                controller.enqueue(encoder.encode(evidenceData));
              }

              // Stream believer response tokens
              const believerTokens = fullContent.split(' ');
              for (const token of believerTokens) {
                const eventData = formatSSE('believer_token', { token: token + ' ' });
                controller.enqueue(encoder.encode(eventData));

                // Simulate streaming delay
                await new Promise((resolve) => setTimeout(resolve, 5));
              }
            } else if (event.type === 'skeptic_complete') {
              skepticResponse = event.data;
              const fullContent = event.data.content;

              // Extract evidence from full content first
              const allEvidence = extractEvidenceFromToken(fullContent);
              console.log(`[Skeptic] Found ${allEvidence.length} evidence items`);
              
              for (const ev of allEvidence) {
                const tracked = await tracker.trackEvidence(ev.url, ev.snippet, 'skeptic');
                const evidenceData = formatSSE('skeptic_evidence', {
                  url: tracked.url,
                  credibility: tracked.credibility_score,
                  snippet: tracked.snippet.substring(0, 100),
                  domain: tracked.domain,
                });
                controller.enqueue(encoder.encode(evidenceData));
              }

              // Stream skeptic response tokens
              const skepticTokens = fullContent.split(' ');
              for (const token of skepticTokens) {
                const eventData = formatSSE('skeptic_token', { token: token + ' ' });
                controller.enqueue(encoder.encode(eventData));

                // Simulate streaming delay
                await new Promise((resolve) => setTimeout(resolve, 5));
              }
            } else if (event.type === 'judge_complete') {
              judgeResponse = event.data;

              // Extract verdict details from judge response
              const verdictText = event.data.content;
              const confidenceMatch = verdictText.match(/CONFIDENCE SCORE[:\s]*(\d+)/i);
              const believerMatch = verdictText.match(/STRENGTH OF BELIEVER CASE[:\s]*(\w+)/i);
              const skepticMatch = verdictText.match(/STRENGTH OF SKEPTIC CASE[:\s]*(\w+)/i);

              // Send judge verdict
              const judgeEvent = formatSSE('judge_complete', {
                verdict: event.data.content.substring(0, 200),
                confidence: parseInt(confidenceMatch?.[1] || '50'),
                believerStrength: believerMatch?.[1] || 'Moderate',
                skepticStrength: skepticMatch?.[1] || 'Moderate',
              });
              controller.enqueue(encoder.encode(judgeEvent));
            }
          }

          // Send evidence summary
          const allEvidence = tracker.getAllEvidence();
          const summaryEvent = formatSSE('evidence_summary', {
            total: allEvidence.length,
            byRole: {
              believer: tracker.getEvidenceByRole('believer').length,
              skeptic: tracker.getEvidenceByRole('skeptic').length,
            },
            topSources: tracker
              .getTopEvidence(5)
              .map((e) => ({ url: e.url, credibility: e.credibility_score })),
          });
          controller.enqueue(encoder.encode(summaryEvent));

          controller.close();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
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
