import { NextRequest, NextResponse } from 'next/server';
import { hybridAI } from '@/lib/hybridAI';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, context } = body;

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and user ID are required' },
        { status: 400 }
      );
    }

    // Check if we have both API keys
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasClaude = !!process.env.ANTHROPIC_API_KEY;

    if (!hasOpenAI) {
      return NextResponse.json({
        response: "Hybrid AI needs OpenAI API key",
        error: "OPENAI_API_KEY not configured"
      });
    }

    if (!hasClaude) {
      return NextResponse.json({
        response: "Hybrid AI needs Claude API key. Using GPT-4 only for now.",
        error: "ANTHROPIC_API_KEY not configured"
      });
    }

    // Process with hybrid AI
    const result = await hybridAI.processUserMessage(message, context, userId);

    return NextResponse.json({
      response: result.response,
      reasoning: result.reasoning,
      actions: result.actions,
      eventData: result.eventData,
      hybridUsed: true
    });

  } catch (error) {
    console.error('Hybrid AI error:', error);
    return NextResponse.json({
      error: 'Hybrid AI processing failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
