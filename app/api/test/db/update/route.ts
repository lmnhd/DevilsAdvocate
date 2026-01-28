import { NextRequest, NextResponse } from 'next/server';

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

    // Mock implementation for testing
    const mockUpdated = {
      id,
      confidence_score,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, debate: mockUpdated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 400 }
    );
  }
}
