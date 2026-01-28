import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock implementation for testing
    const mockDebates = [
      {
        id: 'mock1',
        claim: 'AI will surpass human intelligence',
        believer_argument: 'Evidence suggests rapid AI progress',
        skeptic_argument: 'Current AI has significant limitations',
        judge_verdict: 'Both sides present valid points',
        confidence_score: 60,
        status: 'completed',
      },
      {
        id: 'mock2',
        claim: 'Climate change is human-caused',
        believer_argument: 'Scientific consensus supports this',
        skeptic_argument: 'Natural cycles also play a role',
        judge_verdict: 'Evidence overwhelmingly supports human causation',
        confidence_score: 85,
        status: 'completed',
      },
    ];

    return NextResponse.json({
      success: true,
      debates: mockDebates,
      count: mockDebates.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 400 }
    );
  }
}
