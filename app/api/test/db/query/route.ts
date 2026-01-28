import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    // Mock implementation for testing
    const mockDebate = {
      id,
      claim: 'Mock debate claim',
      believer_argument: 'Mock believer argument',
      skeptic_argument: 'Mock skeptic argument',
      judge_verdict: 'Mock judge verdict',
      confidence_score: 50,
      evidence_sources: [],
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, debate: mockDebate });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 400 }
    );
  }
}
