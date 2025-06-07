import OpenAI from 'openai';

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function generateResponse(message: string, context?: any) {
  try {
    const openai = getOpenAIClient();
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
    console.error('Error generating response:', error);
    return 'I apologize, but I encountered an error while processing your request. Please try again later.';
  }
}

export async function organizeNotes(content: string, section: 'WORK' | 'LIFE') {
  try {
    const openai = getOpenAIClient();
    const prompt = `Please analyze and organize the following note content for the ${section} section. 
    
Content: "${content}"

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
