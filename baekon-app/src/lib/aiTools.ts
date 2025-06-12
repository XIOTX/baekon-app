import { prisma } from '@/lib/prisma';
import * as chrono from 'chrono-node';
import { addDays, addWeeks, addMonths, format } from 'date-fns';

export interface AITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

// All available AI functions for controlling the app
export const AI_TOOLS: AITool[] = [
  // Event Management
  {
    type: 'function',
    function: {
      name: 'create_event',
      description: 'Create a new calendar event with natural language date/time parsing',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Event title' },
          description: { type: 'string', description: 'Optional event description' },
          date: { type: 'string', description: 'Date in natural language (e.g., "tomorrow", "next Friday", "June 15th")' },
          time: { type: 'string', description: 'Time in natural language (e.g., "2pm", "morning", "afternoon")' },
          duration: { type: 'number', description: 'Duration in minutes (default: 60)' },
          category: { type: 'string', enum: ['work', 'personal', 'health', 'social'], description: 'Event category' }
        },
        required: ['title', 'date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_event',
      description: 'Update an existing event',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'Event ID to update' },
          title: { type: 'string', description: 'New title' },
          description: { type: 'string', description: 'New description' },
          date: { type: 'string', description: 'New date' },
          time: { type: 'string', description: 'New time' },
          duration: { type: 'number', description: 'New duration in minutes' }
        },
        required: ['eventId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_event',
      description: 'Delete a calendar event',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'Event ID to delete' }
        },
        required: ['eventId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_schedule',
      description: 'Get events for a specific date range',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date (YYYY-MM-DD or natural language)' },
          endDate: { type: 'string', description: 'End date (YYYY-MM-DD or natural language)' },
          category: { type: 'string', description: 'Filter by category (optional)' }
        },
        required: ['startDate']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_events',
      description: 'Search events by title, description, or content',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', description: 'Max results (default: 10)' }
        },
        required: ['query']
      }
    }
  },

  // Note Management
  {
    type: 'function',
    function: {
      name: 'create_note',
      description: 'Create a new note',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Note title' },
          content: { type: 'string', description: 'Note content' },
          section: { type: 'string', enum: ['WORK', 'LIFE'], description: 'Note section' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Note tags' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'Note priority' }
        },
        required: ['title', 'content', 'section']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_notes',
      description: 'Search notes by content, title, or tags',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          section: { type: 'string', enum: ['WORK', 'LIFE'], description: 'Filter by section' },
          limit: { type: 'number', description: 'Max results (default: 10)' }
        },
        required: ['query']
      }
    }
  },

  // User Preferences & Settings
  {
    type: 'function',
    function: {
      name: 'update_preferences',
      description: 'Update user preferences and settings',
      parameters: {
        type: 'object',
        properties: {
          aiPersonality: { type: 'string', description: 'AI personality style' },
          timezone: { type: 'string', description: 'User timezone' },
          workingHours: { type: 'object', description: 'Working hours {start: "9:00", end: "17:00"}' },
          preferences: { type: 'object', description: 'Any custom preferences' }
        },
        required: []
      }
    }
  },

  // Analysis & Insights
  {
    type: 'function',
    function: {
      name: 'analyze_schedule',
      description: 'Analyze schedule patterns and provide insights',
      parameters: {
        type: 'object',
        properties: {
          timeframe: { type: 'string', enum: ['week', 'month', 'quarter'], description: 'Analysis timeframe' },
          includeRecommendations: { type: 'boolean', description: 'Include optimization recommendations' }
        },
        required: ['timeframe']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'suggest_optimal_time',
      description: 'Suggest optimal time slots for new events based on schedule and preferences',
      parameters: {
        type: 'object',
        properties: {
          eventType: { type: 'string', description: 'Type of event (meeting, workout, focus time, etc.)' },
          duration: { type: 'number', description: 'Duration in minutes' },
          preferredTimeframe: { type: 'string', description: 'Preferred timeframe (morning, afternoon, evening)' },
          daysAhead: { type: 'number', description: 'How many days to look ahead (default: 7)' }
        },
        required: ['eventType', 'duration']
      }
    }
  },

  // Reminders & Notifications
  {
    type: 'function',
    function: {
      name: 'set_reminder',
      description: 'Set a reminder for an event or task',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'Event ID to set reminder for' },
          reminderTime: { type: 'string', description: 'When to remind (e.g., "30 minutes before", "1 hour before")' },
          message: { type: 'string', description: 'Custom reminder message' }
        },
        required: ['eventId', 'reminderTime']
      }
    }
  },

  // Time Management
  {
    type: 'function',
    function: {
      name: 'block_time',
      description: 'Block time for focused work or specific activities',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'What to focus on' },
          duration: { type: 'number', description: 'Duration in minutes' },
          startTime: { type: 'string', description: 'When to start (natural language)' },
          blockType: { type: 'string', enum: ['focus', 'break', 'meeting', 'personal'], description: 'Type of time block' }
        },
        required: ['title', 'duration']
      }
    }
  },

  // Calendar Reference System
  {
    type: 'function',
    function: {
      name: 'get_calendar_context',
      description: 'Get current calendar context and upcoming dates to help with accurate date parsing. Use this before creating events to ground date references.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  }
];

import { parseNaturalDateWithReference, getCalendarReference, getRelativeDescription } from './calendarReference';

// Helper function to parse natural language dates using calendar reference system
export function parseNaturalDate(dateStr: string): Date {
  console.log(`[AI Tools] Parsing date: "${dateStr}"`);

  // First try the new calendar reference system
  const referenceParsed = parseNaturalDateWithReference(dateStr);
  if (referenceParsed) {
    console.log(`[AI Tools] Calendar reference success: ${referenceParsed.toDateString()}`);
    return referenceParsed;
  }

  // Fallback to basic parsing only if reference system fails
  console.log(`[AI Tools] Falling back to basic parsing for: "${dateStr}"`);
  const today = new Date();
  const lowerDate = dateStr.toLowerCase();

  try {
    // Basic fallback patterns
    if (lowerDate.includes('today')) {
      return today;
    }

    if (lowerDate.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow;
    }

    // Try chrono-node as last resort but with validation
    const chrono = require('chrono-node');
    const parsed = chrono.parseDate(dateStr, today);
    if (parsed && !Number.isNaN(parsed.getTime())) {
      const yearDiff = parsed.getFullYear() - today.getFullYear();
      if (yearDiff >= -1 && yearDiff <= 2) {
        console.log(`[AI Tools] Chrono fallback success: ${parsed.toDateString()}`);
        return parsed;
      }
    }

    // If all parsing fails, default to today
    console.log(`[AI Tools] All parsing failed, defaulting to today`);
    return today;

  } catch (error) {
    console.error('[AI Tools] Date parsing error:', error);
    return today;
  }
}

// Enhanced date parsing with calendar reference system
// This provides AI with specific date context to avoid confusion
export function getDateParsingContext(): string {
  const reference = getCalendarReference();
  const { todayInfo, weekInfo, monthInfo } = reference;

  return `
CURRENT DATE CONTEXT (Ground Truth):
- Today: ${todayInfo.dayName}, ${todayInfo.monthName} ${todayInfo.dayNumber}, ${todayInfo.year}
- Current Week: ${weekInfo.days.map(d => `${d.dayName}(${d.dayNumber})`).join(', ')}
- This Month: ${monthInfo.monthName} ${monthInfo.year} (${monthInfo.totalDays} days)
- Available upcoming dates: ${Object.keys(reference.upcomingDates).slice(0, 10).join(', ')}...

USE THIS CONTEXT: When user says a date, match it against these known calendar positions.
Examples:
- "tomorrow" → ${getRelativeDescription(reference.upcomingDates['tomorrow'])}
- "monday" → ${reference.upcomingDates['monday'] ? getRelativeDescription(reference.upcomingDates['monday']) : 'Not found'}
- "next week" → ${getRelativeDescription(reference.upcomingDates['next week'])}
`;
}

// Date utility functions that work with calendar reference system
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(date.getMonth() + months);
  return result;
}

// Helper function to parse natural language times
export function parseNaturalTime(timeStr: string): { hour: number; minute: number } {
  const lowerTime = timeStr.toLowerCase();

  // Handle special times
  if (lowerTime.includes('noon') || lowerTime.includes('12pm')) return { hour: 12, minute: 0 };
  if (lowerTime.includes('midnight') || lowerTime.includes('12am')) return { hour: 0, minute: 0 };
  if (lowerTime.includes('morning')) return { hour: 9, minute: 0 };
  if (lowerTime.includes('afternoon')) return { hour: 14, minute: 0 };
  if (lowerTime.includes('evening')) return { hour: 18, minute: 0 };
  if (lowerTime.includes('night')) return { hour: 20, minute: 0 };

  // Parse specific times like "2pm", "14:30", "9:15am"
  const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hour = Number.parseInt(timeMatch[1]);
    const minute = Number.parseInt(timeMatch[2] || '0');
    const ampm = timeMatch[3]?.toLowerCase();

    if (ampm === 'pm' && hour !== 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;

    return { hour, minute };
  }

  // Default to current time
  const now = new Date();
  return { hour: now.getHours(), minute: now.getMinutes() };
}
