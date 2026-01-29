import { NextRequest, NextResponse } from 'next/server';
import { DebateService } from '@/lib/db/services/debate-service';
import { getDb } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      claim,
      believer_argument,
      skeptic_argument,
      judge_verdict,
      confidence_score,
      evidence_sources,
      status
    } = body;

    // Validation
    if (!claim || typeof claim !== 'string') {
      return NextResponse.json(
        { error: 'claim is required and must be a string' },
        { status: 400 }
      );
    }

    if (confidence_score === undefined || typeof confidence_score !== 'number') {
      return NextResponse.json(
        { error: 'confidence_score is required and must be a number' },
        { status: 400 }
      );
    }

    if (confidence_score < 0 || confidence_score > 100) {
      return NextResponse.json(
        { error: 'confidence_score must be between 0 and 100' },
        { status: 400 }
      );
    }

    const db = getDb();
    const debateService = new DebateService(db);
    const debate = await debateService.createDebate({
      claim,
      believer_argument: believer_argument || '',
      skeptic_argument: skeptic_argument || '',
      judge_verdict: judge_verdict || '',
      confidence_score,
      evidence_sources: evidence_sources || [],
      status: status || 'completed'
    });

    return NextResponse.json(
      {
        id: debate.id,
        created_at: debate.created_at,
        message: 'Debate saved successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving debate:', error);
    return NextResponse.json(
      {
        error: 'Failed to save debate',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
