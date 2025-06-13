import { prisma } from './prisma';

interface MemoryContext {
  sessionId?: string;
  source?: string;
  functionName?: string;
  args?: unknown;
  result?: unknown;
  [key: string]: unknown;
}

export interface MemoryEntry {
  id: string;
  userId: string;
  type: 'preference' | 'pattern' | 'context' | 'goal' | 'insight';
  content: string;
  summary?: string;
  importance: number;
  context?: MemoryContext;
  tags: string[];
  embedding?: string;
  createdAt: Date;
  lastAccessed?: Date;
}

interface ConversationMessage {
  id?: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp?: Date;
}

// Store a memory entry
export async function storeMemory(
  userId: string,
  type: 'preference' | 'pattern' | 'context' | 'goal' | 'insight',
  content: string,
  importance = 5,
  context?: MemoryContext,
  tags: string[] = []
): Promise<MemoryEntry | null> {
  try {
    // Generate summary for long content
    let summary: string | undefined;
    if (content.length > 200) {
      summary = `${content.substring(0, 150)}...`;
    }

    const memory = await prisma.memory.create({
      data: {
        userId,
        type,
        content,
        summary,
        importance,
        context: context || {},
        tags,
        createdAt: new Date(),
        lastAccessed: new Date()
      }
    });

    return memory as MemoryEntry;
  } catch (error) {
    console.error('Error storing memory:', error);
    return null;
  }
}

// Retrieve memories with filters
export async function getMemories(
  userId: string,
  type?: string,
  tags?: string[],
  limit = 50
): Promise<MemoryEntry[]> {
  try {
    interface WhereClause {
      userId: string;
      type?: string;
      tags?: {
        hasEvery: string[];
      };
    }

    const whereClause: WhereClause = { userId };

    if (type) {
      whereClause.type = type;
    }

    if (tags && tags.length > 0) {
      whereClause.tags = { hasEvery: tags };
    }

    const memories = await prisma.memory.findMany({
      where: whereClause,
      orderBy: [
        { importance: 'desc' },
        { lastAccessed: 'desc' }
      ],
      take: limit
    });

    return memories as MemoryEntry[];
  } catch (error) {
    console.error('Error retrieving memories:', error);
    return [];
  }
}

// Enhanced context retrieval
export async function getEnhancedContext(
  userId: string,
  query: string,
  sessionId: string
) {
  try {
    // Get relevant memories (simplified version without vector search for now)
    const memories = await getMemories(userId, undefined, undefined, 10);

    // Filter for most relevant based on content similarity (simple text matching)
    const relevantMemories = memories.filter(memory =>
      memory.content.toLowerCase().includes(query.toLowerCase()) ||
      memory.tags.some(tag => query.toLowerCase().includes(tag.toLowerCase()))
    ).slice(0, 5);

    return {
      memories: relevantMemories,
      recentContext: [],
      currentState: {},
      patterns: memories.filter(m => m.type === 'pattern').slice(0, 3),
      preferences: memories.filter(m => m.type === 'preference').slice(0, 3),
      goals: memories.filter(m => m.type === 'goal').slice(0, 2)
    };
  } catch (error) {
    console.error('Error getting enhanced context:', error);
    return {
      memories: [],
      recentContext: [],
      currentState: {},
      patterns: [],
      preferences: [],
      goals: []
    };
  }
}

// Analyze conversation for memory extraction
export async function analyzeConversationForMemories(
  userId: string,
  messages: ConversationMessage[],
  sessionId: string
): Promise<void> {
  // Skip if conversation too short or not enough meaningful content
  if (messages.length < 4) return;

  try {
    // Simple pattern extraction for now (would use AI in full implementation)
    const conversationText = messages.map(m => m.content).join(' ');

    // Extract basic patterns
    if (conversationText.includes('schedule') || conversationText.includes('meeting')) {
      await storeMemory(
        userId,
        'pattern',
        'User frequently schedules meetings and events',
        6,
        { sessionId, source: 'conversation_analysis' },
        ['scheduling', 'meetings']
      );
    }

    if (conversationText.includes('gym') || conversationText.includes('workout')) {
      await storeMemory(
        userId,
        'pattern',
        'User is focused on fitness and exercise',
        7,
        { sessionId, source: 'conversation_analysis' },
        ['fitness', 'health', 'routine']
      );
    }

    // Extract preferences
    if (conversationText.includes('morning') || conversationText.includes('7am') || conversationText.includes('early')) {
      await storeMemory(
        userId,
        'preference',
        'User prefers morning activities and early scheduling',
        8,
        { sessionId, source: 'conversation_analysis' },
        ['morning', 'timing', 'schedule']
      );
    }

  } catch (error) {
    console.error('Error analyzing conversation for memories:', error);
  }
}
