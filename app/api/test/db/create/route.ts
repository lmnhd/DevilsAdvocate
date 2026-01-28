import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db/client';
import { DebateService } from '@/lib/db/services/debate-service';

// Get D1 binding from Cloudflare environment
interface CloudflareEnv {
  DB: any;
}

declare global {
  var CLOUDFLARE_ENV: CloudflareEnv;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Try to get D1 database from various sources
    let db: any = globalThis.CLOUDFLARE_ENV?.DB;
    
    if (!db) {
      // For local development fallback
      console.warn('DB binding not found. Using development fallback.');
      return NextResponse.json(
        { success: false, error: 'D1 database binding not configured. Run with: wrangler dev' },
        { status: 503 }
      );
    }

    // Initialize database and service
    const dbClient = initDb(db);
    const debateService = new DebateService(dbClient);

    // Create debate with actual database persistence
    const debate = await debateService.createDebate({
      claim: data.claim,
      believer_argument: data.believer_argument,
      skeptic_argument: data.skeptic_argument,
      judge_verdict: data.judge_verdict,
      confidence_score: data.confidence_score,
      evidence_sources: data.evidence_sources || [],
      status: data.status || 'pending',
    });

    return NextResponse.json(
      { success: true, debate },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create debate error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 400 }
    );
  }
}
