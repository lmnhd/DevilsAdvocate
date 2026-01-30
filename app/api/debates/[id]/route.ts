import { NextResponse } from 'next/server';
import { DebateRepository } from '@/lib/db/debate-repository';

const repository = new DebateRepository();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Debate ID is required',
        },
        { status: 400 }
      );
    }

    const debate = await repository.getDebate(id);

    if (!debate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Debate not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: debate,
    });
  } catch (error) {
    console.error('[API] Error fetching debate:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch debate',
      },
      { status: 500 }
    );
  }
}
