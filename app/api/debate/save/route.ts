import { NextResponse } from 'next/server';
import { DebateRepository, type EvidenceItem } from '@/lib/db/debate-repository';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      claim,
      believer_argument,
      skeptic_argument,
      judge_verdict,
      confidence_score,
      believer_strength,
      skeptic_strength,
      risk_assessment,
      evidence
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

    // Initialize DynamoDB repository
    const debateRepo = new DebateRepository();

    try {
      // Create debate with all data
      const debateId = await debateRepo.createDebate(claim);

      // Update arguments
      if (believer_argument || skeptic_argument) {
        await debateRepo.updateArguments(
          debateId,
          believer_argument || '',
          skeptic_argument || ''
        );
      }

      // Save evidence
      if (evidence && Array.isArray(evidence)) {
        const believerEvidence = evidence.filter((e: any) => e.role === 'believer') as EvidenceItem[];
        const skepticEvidence = evidence.filter((e: any) => e.role === 'skeptic') as EvidenceItem[];

        if (believerEvidence.length > 0 || skepticEvidence.length > 0) {
          await debateRepo.saveEvidence(debateId, believerEvidence, skepticEvidence);
        }
      }

      // Save verdict
      await debateRepo.saveVerdict(
        debateId,
        judge_verdict || '',
        confidence_score,
        believer_strength || 'Moderate',
        skeptic_strength || 'Moderate',
        risk_assessment || 'medium'
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Debate saved successfully',
          debateId,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('[API] Error saving debate to DynamoDB:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to save debate',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Error parsing request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request format',
      },
      { status: 400 }
    );
  }
}
