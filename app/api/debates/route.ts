import { NextResponse } from 'next/server';
import { DebateRepository } from '@/lib/db/debate-repository';

export const runtime = 'nodejs';

const repository = new DebateRepository();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const debates = await repository.listRecentDebates(Math.min(limit, 100));

    return NextResponse.json({
      success: true,
      count: debates.length,
      data: debates,
    });
  } catch (error) {
    console.error('[API] Error fetching debates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch debate history',
      },
      { status: 500 }
    );
  }
}
