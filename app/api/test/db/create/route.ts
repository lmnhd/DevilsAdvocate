import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Mock implementation for testing without D1 binding
    // In production, this would use initDb(env.DB) and DebateService
    const mockDebate = {
      id: Math.random().toString(36).substring(7),
      ...data,
      evidence_sources: data.evidence_sources || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(
      { success: true, debate: mockDebate },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 400 }
    );
  }
}
