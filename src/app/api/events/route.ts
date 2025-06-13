import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Priority } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const events = await prisma.event.findMany({
      where: {
        userId,
        ...(startDate && endDate && {
          startTime: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Transform tags from JSON string to array
    const transformedEvents = events.map(event => ({
      ...event,
      tags: event.tags ? JSON.parse(event.tags) : []
    }));

    return NextResponse.json(transformedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, startTime, endTime, priority, category, tags, userId } = body;

    if (!title || !startTime || !userId) {
      return NextResponse.json(
        { error: 'Title, start time, and user ID are required' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        priority: (priority as Priority) || 'MEDIUM',
        category: category || null,
        tags: tags ? JSON.stringify(tags) : JSON.stringify([]),
        userId,
      },
    });

    // Transform tags back to array for response
    const transformedEvent = {
      ...event,
      tags: event.tags ? JSON.parse(event.tags) : []
    };

    return NextResponse.json(transformedEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}