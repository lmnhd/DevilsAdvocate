import { NextRequest, NextResponse } from 'next/server';
import { braveSearch, factCheck, archive, whois } from '@/lib/mcp';

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();

    if (!input) {
      return NextResponse.json({ error: 'Input required' }, { status: 400 });
    }

    const [braveResults, factcheckResults, archiveResults, whoisResults] = await Promise.all([
      braveSearch(input).catch(e => ({
        error: e.message,
        data: [],
        cached: false,
        rateLimit: { toolName: 'brave', remaining: 0, limited: true, resetAt: new Date() },
      })),
      factCheck(input).catch(e => ({
        error: e.message,
        data: [],
        cached: false,
        rateLimit: { toolName: 'factcheck', remaining: 0, limited: true, resetAt: new Date() },
      })),
      archive(input).catch(e => ({
        error: e.message,
        data: [],
        cached: false,
        rateLimit: { toolName: 'archive', remaining: 0, limited: true, resetAt: new Date() },
      })),
      whois(extractDomain(input)).catch(e => ({
        error: e.message,
        data: null,
        cached: false,
        rateLimit: { toolName: 'whois', remaining: 0, limited: true, resetAt: new Date() },
      })),
    ]);

    return NextResponse.json({
      input,
      brave: braveResults,
      factcheck: factcheckResults,
      archive: archiveResults,
      whois: whoisResults,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function extractDomain(input: string): string {
  try {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      return new URL(input).hostname || input;
    }
    return input;
  } catch {
    return input;
  }
}
