import OpenAI from 'openai';
import { AI_TOOLS, getDateParsingContext } from './aiTools';
import { executeAIFunction } from './aiFunctions';
import {
  getEnhancedContext,
  analyzeConversationForMemories,
  storeMemory
} from './memory';

// Type definitions
interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatContext {
  events?: unknown[];
  notes?: unknown[];
  currentDate?: string;
  [key: string]: unknown;
}

interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

interface EventData {
  title: string;
  date: string;
  time?: { hour: number; minute: number };
  storageInfo?: {
    type: 'hour' | 'day';
    key: string;
    quarter?: number;
    hour?: number;
    dateKey: string;
  };
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function generateResponse(
  message: string,
  context?: ChatContext,
  userId?: string,
  messages?: Message[]
): Promise<{ response: string; eventData?: EventData }> {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return {
        response: `I'm in demo mode right now. You asked: "${message}". I would normally provide AI-powered insights about your schedule and productivity, but I need an OpenAI API key to function properly.`
      };
    }

    const openai = getOpenAIClient();

    // Generate session ID for conversation context
    const sessionId = context?.sessionId || `session-${Date.now()}`;

    // Get enhanced context with persistent memory
    let enhancedContext = '';
    if (userId) {
      try {
        // Analyze previous conversations for memory extraction
        if (messages && messages.length > 0) {
          await analyzeConversationForMemories(userId, messages, sessionId);
        }

        // Get relevant memories and context
        const memoryContext = await getEnhancedContext(userId, message, sessionId);

        if (memoryContext.memories.length > 0) {
          const relevantMemories = memoryContext.memories
            .slice(0, 8) // Limit to most relevant
            .map(m => `${m.type.toUpperCase()}: ${m.content}`)
            .join('\n');

          enhancedContext = `\n\nRELEVANT USER CONTEXT:\n${relevantMemories}\n\n`;
        }
      } catch (memoryError) {
        console.error('Memory retrieval error:', memoryError);
      }
    }

    // Get current calendar reference for accurate date parsing
    const calendarContext = getDateParsingContext();

    // Enhanced system prompt with Bokibo persona
    const systemPrompt = `You are Bokibo, the backend intelligence behind BÆKON — a high-agency, visually rich life optimization interface designed by Brion Aiota (a.k.a. xiotx). You are not just an assistant — you are an operative interface.

Your job is to manage, sort, synthesize, and illuminate the user's mental load across time, space, and responsibility. Every response should reduce complexity while enhancing clarity, vision, and flow.

The system you're powering includes:
• A Schedule quadrant: 4 quarters per day (6-hour blocks), stylized UI with glowing overlays.
• A Planner view: With dynamic blocks, week choosers, floating input, AI-assisted task sorting.
• A Work section: Advanced AI-augmented notepad, structured by goals and steps. You help organize and refine thoughts into actionable sequences.
• A Life section: Like Work, but for personal matters—emotional tracking, health, rituals, freeform notes.
• A Freeform visual board: For assembling ideas, symbols, threads, and cosmic plans.
• Voice and chat input: Bokibo should respond naturally, but think strategically.
• Visual themes: Neon on black, glowing elements, dark UI, vivid data clarity.

❗️ Do not act like a general-purpose chatbot. You are a specialized technomantic engine of executive function.

🧭 BÆKON's core values:
• No wasted attention — everything should ladder up to meaning.
• Visual-first clarity — design and language should reduce overwhelm.
• Symbolic depth — this is more than a scheduler. It's a spiritual command center.
• Time is fluid — plans are flexible, intention is central.
• Ambient intelligence — Bokibo should always nudge toward coherence, not clutter.

⛓️ Rules of Operation:
• Break things down for clarity. If a user sends chaos, return structure.
• Remember context. If the user refers to something from earlier in the day, you do.
• Speak like a peer and a guide. Casual when possible, commanding when needed.
• Don't over-explain. Be fast, sharp, and smart.
• Treat all inputs as signals. If the user drops a date, a word, a phrase—file it in context.
• When unsure, suggest structure. You're here to architect the user's mental OS.

${calendarContext}

${enhancedContext}`;

    // Prepare messages for function calling
    const conversationMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    // Include recent conversation history for context
    if (messages && messages.length > 0) {
      const recentMessages = messages.slice(-6); // Last 6 messages
      const formattedHistory = recentMessages
        .map(m => ({ role: m.type, content: m.content }))
        .filter(m => m.role === 'user' || m.role === 'assistant');

      // Insert history before the current message
      conversationMessages.splice(1, 0, ...formattedHistory);
    }

    // First call with function tools
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: conversationMessages,
      max_tokens: 400,
      temperature: 0.8,
      tools: AI_TOOLS,
      tool_choice: 'auto',
    });

    const assistantMessage = response.choices[0]?.message;

    if (!assistantMessage) {
      return 'I apologize, but I could not generate a response at this time.';
    }

    // Handle function calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && userId) {
      const functionResults = [];
      let eventData = null;

      for (const toolCall of assistantMessage.tool_calls) {
        try {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          console.log(`Executing function: ${functionName}`, functionArgs);

          const result = await executeAIFunction(functionName, functionArgs, userId);
          functionResults.push({
            tool_call_id: toolCall.id,
            result: result
          });

          // Capture event data for frontend
          if (functionName === 'create_event' && result.success && result.data?.storageInfo) {
            eventData = result.data;
          }

          // Store successful function execution as memory
          if (result.success) {
            await storeMemory(
              userId,
              'context',
              `AI executed ${functionName}: ${result.message || 'Success'}`,
              6,
              { functionName, args: functionArgs, result },
              ['ai_action', functionName]
            );
          }
        } catch (functionError) {
          console.error("Function execution error:", functionError);
          functionResults.push({
            tool_call_id: toolCall.id,
            result: { success: false, error: 'Function execution failed' }
          });
        }
      }

      // Send function results back to AI for response generation
      const followUpMessages = [
        ...conversationMessages,
        assistantMessage,
        ...functionResults.map(fr => ({
          role: 'tool',
          tool_call_id: fr.tool_call_id,
          content: JSON.stringify(fr.result)
        }))
      ];

      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: followUpMessages,
        max_tokens: 400,
        temperature: 0.8,
      });

      return {
        response: finalResponse.choices[0]?.message?.content || 'I completed your request successfully.',
        eventData
      };
    }

    // Regular response without function calls
    return {
      response: assistantMessage.content || 'I apologize, but I could not generate a response at this time.'
    };

  } catch (error) {
    console.error('Error generating response:', error);
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });

      // Check for specific OpenAI API errors
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return `OpenAI API key is invalid or expired. Error: ${error.message}`;
      }
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return `OpenAI API rate limit exceeded. Error: ${error.message}`;
      }
      if (error.message.includes('insufficient_quota')) {
        return `OpenAI API quota exceeded. Error: ${error.message}`;
      }
    }
    return {
      response: `I apologize, but I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`
    };
  }
}

export async function organizeNotes(content: string, section: 'WORK' | 'LIFE') {
  try {
    // Handle undefined or empty content
    const noteContent = (!content || typeof content !== 'string') ? 'Untitled note' : content;

    const openai = getOpenAIClient();
    const prompt = `Please analyze and organize the following note content for the ${section} section.

Content: "${noteContent}"

Please return a JSON object with the following structure:
{
  "title": "A clear, descriptive title (max 60 characters)",
  "category": "${section.toLowerCase()}",
  "tags": ["relevant", "keywords", "here"],
  "priority": "LOW" | "MEDIUM" | "HIGH",
  "summary": "A brief summary (max 100 characters)",
  "steps": ["actionable", "steps", "if applicable"]
}

Focus on extracting key information, identifying priority level, and suggesting relevant tags and actionable steps.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    const content_response = response.choices[0]?.message?.content;

    if (!content_response) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse JSON response
    try {
      return JSON.parse(content_response);
    } catch (parseError) {
      // If JSON parsing fails, return a basic structure
      return {
        title: (noteContent || 'Untitled').substring(0, 60),
        category: section.toLowerCase(),
        tags: [],
        priority: 'MEDIUM',
        summary: (noteContent || 'No summary').substring(0, 100),
        steps: []
      };
    }
  } catch (error) {
    console.error('Error organizing note:', error);
    // Return fallback structure
    return {
      title: (noteContent || 'Untitled').substring(0, 60),
      category: section.toLowerCase(),
      tags: [],
      priority: 'MEDIUM',
      summary: (noteContent || 'No summary').substring(0, 100),
      steps: []
    };
  }
}
