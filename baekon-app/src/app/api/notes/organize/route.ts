import { type NextRequest, NextResponse } from 'next/server';
import { organizeNotes } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { content, section, userId } = await request.json();

    if (!content || !section || !userId) {
      return NextResponse.json(
        { error: 'Content, section, and user ID are required' },
        { status: 400 }
      );
    }

    // Use OpenAI to organize the note
    const organized = await organizeNotes(content, section as 'WORK' | 'LIFE');

    return NextResponse.json(organized);
  } catch (error) {
    console.error('Error organizing note:', error);
    return NextResponse.json(
      { error: 'Failed to organize note' },
      { status: 500 }
    );
  }
}