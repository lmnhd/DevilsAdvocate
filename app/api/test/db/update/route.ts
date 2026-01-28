import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db/client';
import { DebateService } from '@/lib/db/services/debate-service';

interface CloudflareEnv {
  DB: any;
}

declare global {
  var CLOUDFLARE_ENV: CloudflareEnv;
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, confidence_score } = data;

    if (!id || confidence_score === undefined) {
      return NextResponse.json(
        { success: false, error: 'ID and confidence_score are required' },
        { status: 400 }
      );
    }

    if (confidence_score < 0 || confidence_score > 100) {
      return NextResponse.json(
        { success: false, error: 'confidence_score must be between 0 and 100' },
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

    // Update debate score in database
    await debateService.updateDebateScore(id, confidence_score);

    return NextResponse.json({
      success: true,
      message: `Updated debate ${id} with confidence score ${confidence_score}`,
    });
  } catch (error) {
    console.error('Update debate error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 400 }
    );
  }
}

