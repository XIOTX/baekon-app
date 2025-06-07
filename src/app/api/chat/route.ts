import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateResponse } from '@/lib/openai';
import { MessageType } from '@prisma/client';

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

    // Generate AI response
    const aiResponse = await generateResponse(message, context);

    // Save chat log
    const chatLog = await prisma.chatLog.create({
      data: {
        sessionId: `session-${Date.now()}`, // Generate a session ID
        message,
        response: aiResponse,
        messageType: MessageType.USER,
        context: context ? JSON.stringify(context) : null,
        userId,
      },
    });

    return NextResponse.json({
      response: aiResponse,
      chatLogId: chatLog.id,
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = Number.parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const chatLogs = await prisma.chatLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Transform context from JSON string
    const transformedLogs = chatLogs.map(log => ({
      ...log,
      context: log.context ? JSON.parse(log.context) : null
    }));

    return NextResponse.json(transformedLogs.reverse()); // Reverse to get chronological order
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }
}
