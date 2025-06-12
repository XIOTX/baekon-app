import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Priority, Section } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const section = searchParams.get('section');
    const category = searchParams.get('category');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const notes = await prisma.note.findMany({
      where: {
        userId,
        archived: false,
        ...(section && { section: section as Section }),
        ...(category && { category }),
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Transform tags from JSON string to array
    const transformedNotes = notes.map(note => ({
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : []
    }));

    return NextResponse.json(transformedNotes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      category,
      tags,
      section,
      priority,
      userId,
      aiGenerated,
      aiSummary,
    } = body;

    if (!title || !content || !section || !userId) {
      return NextResponse.json(
        { error: 'Title, content, section, and user ID are required' },
        { status: 400 }
      );
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        category: category || null,
        tags: tags ? JSON.stringify(tags) : JSON.stringify([]),
        section: section as Section,
        priority: (priority as Priority) || 'MEDIUM',
        userId,
        aiGenerated: aiGenerated || false,
        aiSummary: aiSummary || null,
      },
    });

    // Transform tags back to array for response
    const transformedNote = {
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : []
    };

    return NextResponse.json(transformedNote, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}