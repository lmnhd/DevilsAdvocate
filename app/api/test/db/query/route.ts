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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

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

    // Query debate from database
    const debate = await debateService.getDebateById(id);

    if (!debate) {
      return NextResponse.json(
        { success: false, error: 'Debate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      debate,
    });
  } catch (error) {
    console.error('Query debate error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 400 }
    );
  }
}
