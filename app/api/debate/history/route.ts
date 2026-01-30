import { NextRequest, NextResponse } from 'next/server';
import { DebateService } from '@/lib/db/services/debate-service';
import { getDb, initDb } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'Offset must be >= 0' },
        { status: 400 }
      );
    }

    // Initialize database (auto-detects environment)
    initDb();
    const db = getDb();
    const debateService = new DebateService(db);
    const debates = await debateService.listDebates(limit, offset);

    return NextResponse.json(
      {
        debates,
        total: debates.length,
        limit,
        offset,
        hasMore: offset + limit < debates.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching debate history:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch debate history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
