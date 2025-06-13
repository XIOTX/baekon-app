import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateResponse } from '@/lib/openai';
import { MessageType } from '@prisma/client';

interface MessageResponse {
  id: string;
  content: string;
  type: string;
  timestamp: Date;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, context, messages } = body;

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and user ID are required' },
        { status: 400 }
      );
    }

    // Generate AI response with enhanced context and function calling
    const aiResult = await generateResponse(message, context, userId, messages);

    // Try to save to database, but don't fail if it doesn't work
    let chatLogId = null;
    try {
      // Create session ID for this conversation
      const sessionId = `session-${Date.now()}`;

      // Save chat log with messages
      const chatLog = await prisma.chatLog.create({
        data: {
          sessionId,
          userId,
          messages: {
            create: [
              {
                content: message,
                type: MessageType.USER,
              },
              {
                content: aiResult.response,
                type: MessageType.ASSISTANT,
              }
            ]
          }
        },
      });
      chatLogId = chatLog.id;
    } catch (dbError) {
      console.warn('Database save failed, continuing without persistence:', dbError);
    }

    return NextResponse.json({
      response: aiResult.response,
      eventData: aiResult.eventData,
      chatLogId,
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

    try {
      const chatLogs = await prisma.chatLog.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      // Flatten messages from all chat logs using for...of instead of forEach
      const allMessages: MessageResponse[] = [];

      for (const log of chatLogs.reverse()) {
        for (const message of log.messages) {
          allMessages.push({
            id: message.id,
            content: message.content,
            type: message.type.toLowerCase(),
            timestamp: message.createdAt,
          });
        }
      }

      return NextResponse.json(allMessages);
    } catch (dbError) {
      console.warn('Database fetch failed, returning empty messages:', dbError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json([]);
  }
}
