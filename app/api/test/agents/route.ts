import { NextRequest, NextResponse } from 'next/server';
import { orchestrateDebate } from '@/lib/agents/orchestrator';

export async function POST(request: NextRequest) {
  try {
    const { claim } = await request.json();

    if (!claim || typeof claim !== 'string' || claim.trim().length === 0) {
      return NextResponse.json({ error: 'Claim is required' }, { status: 400 });
    }

    // Run the debate orchestration
    const result = await orchestrateDebate({ claim: claim.trim(), maxTokens: 2500 });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Debate API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}
