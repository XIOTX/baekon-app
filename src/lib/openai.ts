import OpenAI from 'openai';
import type { ChatContext } from '@/types/chat';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateResponse(message: string, context?: ChatContext) {
  try {
    const systemPrompt = `You are BÆKON, a personal AI assistant for life organization and productivity. You help users manage their schedule, create events, organize notes, and provide insights about their life.

Key capabilities:
- Schedule management (create, modify, delete events)
- Note organization (work and life sections)
- Productivity insights
- Task prioritization
- Smart suggestions

Context about the user:
${context ? JSON.stringify(context, null, 2) : 'No additional context provided'}

Respond in a helpful, concise manner. If the user wants to create an event or note, ask for the necessary details.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'I apologize, but I could not generate a response at this time.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'I apologize, but I encountered an error while processing your request. Please try again.';
  }
}

export async function organizeNotes(content: string, section: 'WORK' | 'LIFE') {
  try {
    const prompt = `
    You are BÆKON, a personal AI assistant for life organization.
    Analyze this ${section.toLowerCase()} note and organize it:
    "${content}"

    Please provide:
    1. A clear, concise title (max 60 characters)
    2. Suggested category (one word, like "projects", "meetings", "health", "goals", etc.)
    3. Relevant tags (3-5 keywords)
    4. Priority level (LOW, MEDIUM, HIGH)
    5. A brief summary (max 100 characters)
    6. Break down into actionable steps if applicable

    Respond in JSON format with: title, category, tags, priority, summary, steps
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
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
        title: content.substring(0, 60),
        category: section.toLowerCase(),
        tags: [],
        priority: 'MEDIUM',
        summary: content.substring(0, 100),
        steps: []
      };
    }
  } catch (error) {
    console.error('Error organizing note:', error);
    // Return fallback structure
    return {
      title: content.substring(0, 60),
      category: section.toLowerCase(),
      tags: [],
      priority: 'MEDIUM',
      summary: content.substring(0, 100),
      steps: []
    };
  }
}

export async function generateEventFromText(text: string, context?: ChatContext) {
  try {
    const prompt = `
    You are BÆKON, a personal AI assistant. Parse this text to create a calendar event:
    "${text}"

    Context: ${context ? JSON.stringify(context) : 'No additional context'}

    Extract and provide:
    1. Event title
    2. Description (if any)
    3. Start date and time (ISO format)
    4. End date and time (ISO format, if mentioned)
    5. Priority (LOW, MEDIUM, HIGH)
    6. Category
    7. Tags (relevant keywords)

    Respond in JSON format with: title, description, startTime, endTime, priority, category, tags
    If no specific time is mentioned, suggest a reasonable time based on the event type.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.7,
    });

    const content_response = response.choices[0]?.message?.content;
    if (!content_response) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content_response);
  } catch (error) {
    console.error('Error generating event from text:', error);
    return null;
  }
}
