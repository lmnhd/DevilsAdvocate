import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db/client';
import { DebateService } from '@/lib/db/services/debate-service';

interface CloudflareEnv {
  DB: any;
}

declare global {
  var CLOUDFLARE_ENV: CloudflareEnv;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get D1 database from Cloudflare environment
    let db: any = globalThis.CLOUDFLARE_ENV?.DB;
    
    if (!db) {
      console.warn('DB binding not found. Using development fallback.');
      return NextResponse.json(
        { success: false, error: 'D1 database binding not configured. Run with: wrangler dev' },
        { status: 503 }
      );
    }

    // Initialize database and service
    const dbClient = initDb(db);
    const debateService = new DebateService(dbClient);

    // List debates from database
    const debates = await debateService.listDebates(limit, offset);

    return NextResponse.json({
      success: true,
      debates,
      count: debates.length,
    });
  } catch (error) {
    console.error('List debates error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 400 }
    );
  }
}
