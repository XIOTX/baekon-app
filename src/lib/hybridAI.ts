import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getDateParsingContext } from './aiTools';

interface HybridAIResponse {
  response: string;
  reasoning?: string;
  actions?: Array<{
    type: 'create_event' | 'update_event' | 'search' | 'analyze';
    params: any;
    confidence: number;
  }>;
  eventData?: any;
}

interface AITask {
  type: 'reasoning' | 'execution' | 'creative' | 'analysis';
  input: string;
  context?: any;
}

export class HybridAIOrchestrator {
  private openai: OpenAI;
  private claude: Anthropic;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Main entry point - decides which AI to use for what
   */
  async processUserMessage(
    message: string,
    context: any,
    userId: string
  ): Promise<HybridAIResponse> {

    // Analyze the message to determine the best approach
    const taskAnalysis = this.analyzeTask(message);

    if (taskAnalysis.needsReasoning) {
      // Use Claude for complex reasoning, then GPT-4 for execution
      return await this.hybridReasoningFlow(message, context, userId);
    } else if (taskAnalysis.needsCreativity) {
      // Use GPT-4 for creative responses
      return await this.gptCreativeFlow(message, context, userId);
    } else {
      // Simple tasks can go to either
      return await this.gptExecutionFlow(message, context, userId);
    }
  }

  /**
   * Hybrid flow: Claude reasons, GPT-4 executes
   */
  private async hybridReasoningFlow(
    message: string,
    context: any,
    userId: string
  ): Promise<HybridAIResponse> {

    // Step 1: Claude analyzes and reasons
    const calendarContext = getDateParsingContext();

    const claudePrompt = `You are the reasoning engine for BÆKON, a scheduling AI system. Your job is to:

1. PARSE the user's request with precise date/time understanding
2. REASON through the scheduling logic
3. PLAN the exact actions needed
4. OUTPUT structured instructions for the execution engine

Current Calendar Context:
${calendarContext}

User Request: "${message}"
Context: ${JSON.stringify(context, null, 2)}

Analyze this request and provide:
1. INTERPRETATION: What exactly does the user want?
2. DATE_PARSING: What specific dates/times are involved? (Use current year 2025)
3. ACTIONS_NEEDED: What functions should be called with what parameters?
4. CONFIDENCE: How certain are you about the interpretation?

Response format:
{
  "interpretation": "Clear explanation of what user wants",
  "parsed_datetime": "2025-12-15T14:00:00Z",
  "actions": [
    {
      "function": "create_event",
      "params": {
        "title": "Event title",
        "date": "2025-12-15",
        "time": "2:00 PM",
        "description": "..."
      },
      "confidence": 0.95
    }
  ],
  "reasoning": "Step by step explanation of date parsing and decisions"
}`;

    const claudeResponse = await this.claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: claudePrompt }
      ]
    });

    let claudeAnalysis;
    try {
      const claudeText = claudeResponse.content[0].type === 'text'
        ? claudeResponse.content[0].text
        : '';

      // Extract JSON from Claude's response
      const jsonMatch = claudeText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        claudeAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in Claude response');
      }
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      // Fallback to GPT-4 only
      return await this.gptExecutionFlow(message, context, userId);
    }

    // Step 2: GPT-4 executes the planned actions
    const gptPrompt = `You are the execution engine for BÆKON. Claude has analyzed the user request and provided this plan:

CLAUDE'S ANALYSIS:
${JSON.stringify(claudeAnalysis, null, 2)}

USER'S ORIGINAL MESSAGE: "${message}"

Execute the planned actions using your function calling capabilities. Be precise with the parameters Claude provided.

Respond naturally to the user while executing the functions.`;

    // Use GPT-4's function calling to execute
    const gptResponse = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are Bokibo, executing precise scheduling actions based on Claude\'s analysis.' },
        { role: 'user', content: gptPrompt }
      ],
      tools: this.getGPTTools(),
      tool_choice: 'auto'
    });

    // Process the hybrid response
    return {
      response: gptResponse.choices[0].message.content || "Action completed.",
      reasoning: claudeAnalysis.reasoning,
      actions: claudeAnalysis.actions,
      eventData: claudeAnalysis.parsed_datetime
    };
  }

  /**
   * GPT-4 creative flow for conversational responses
   */
  private async gptCreativeFlow(
    message: string,
    context: any,
    userId: string
  ): Promise<HybridAIResponse> {
    // Use the existing GPT-4 system for creative/conversational responses
    // This would call your existing generateResponse function
    return { response: "GPT-4 creative response" };
  }

  /**
   * GPT-4 execution flow for simple tasks
   */
  private async gptExecutionFlow(
    message: string,
    context: any,
    userId: string
  ): Promise<HybridAIResponse> {
    // Use existing GPT-4 function calling system
    return { response: "GPT-4 execution response" };
  }

  /**
   * Analyze what type of task this is
   */
  private analyzeTask(message: string): {
    needsReasoning: boolean;
    needsCreativity: boolean;
    needsExecution: boolean;
    complexity: 'low' | 'medium' | 'high';
  } {
    const lowerMessage = message.toLowerCase();

    // Patterns that need complex reasoning (Claude)
    const reasoningPatterns = [
      /schedule.*for.*december/i,
      /next.*week.*meeting/i,
      /remind.*me.*in.*\d+.*days/i,
      /every.*tuesday/i,
      /move.*meeting.*to/i,
      /what.*conflicts.*with/i,
      /when.*am.*i.*free/i,
      /reschedule.*all/i
    ];

    // Patterns that need creativity (GPT-4)
    const creativityPatterns = [
      /how.*should.*i/i,
      /what.*do.*you.*think/i,
      /suggest.*something/i,
      /brainstorm/i,
      /ideas.*for/i
    ];

    const needsReasoning = reasoningPatterns.some(pattern => pattern.test(message));
    const needsCreativity = creativityPatterns.some(pattern => pattern.test(message));

    return {
      needsReasoning,
      needsCreativity,
      needsExecution: !needsReasoning && !needsCreativity,
      complexity: needsReasoning ? 'high' : needsCreativity ? 'medium' : 'low'
    };
  }

  /**
   * Get GPT-4 function definitions
   */
  private getGPTTools() {
    // Return your existing AI_TOOLS from aiTools.ts
    return [
      {
        type: "function" as const,
        function: {
          name: "create_event",
          description: "Create a new calendar event",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Event title" },
              date: { type: "string", description: "Event date (YYYY-MM-DD)" },
              time: { type: "string", description: "Event time" },
              description: { type: "string", description: "Event description" }
            },
            required: ["title", "date"]
          }
        }
      }
    ];
  }
}

// Export singleton instance
export const hybridAI = new HybridAIOrchestrator();
