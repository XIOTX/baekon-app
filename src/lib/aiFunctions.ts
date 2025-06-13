import { prisma } from '@/lib/prisma';
import { parseNaturalDate, parseNaturalTime, getDateParsingContext } from './aiTools';
import { getCalendarReference, getRelativeDescription } from './calendarReference';

export interface FunctionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

// Execute AI function calls
export async function executeAIFunction(
  functionName: string,
  args: any,
  userId: string
): Promise<FunctionResult> {
  try {
    switch (functionName) {
      case 'create_event':
        return await createEvent(args, userId);
      case 'update_event':
        return await updateEvent(args, userId);
      case 'delete_event':
        return await deleteEvent(args, userId);
      case 'get_schedule':
        return await getSchedule(args, userId);
      case 'search_events':
        return await searchEvents(args, userId);
      case 'create_note':
        return await createNote(args, userId);
      case 'search_notes':
        return await searchNotes(args, userId);
      case 'update_preferences':
        return await updatePreferences(args, userId);
      case 'analyze_schedule':
        return await analyzeSchedule(args, userId);
      case 'suggest_optimal_time':
        return await suggestOptimalTime(args, userId);
      case 'set_reminder':
        return await setReminder(args, userId);
      case 'block_time':
        return await blockTime(args, userId);
      case 'get_calendar_context':
        return await getCalendarContext(args, userId);
      default:
        return { success: false, error: `Unknown function: ${functionName}` };
    }
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Event Management Functions
interface CreateEventArgs {
  title: string;
  description?: string;
  date: string;
  time?: string;
  duration?: number;
  category?: string;
}

async function createEvent(args: CreateEventArgs, userId: string): Promise<FunctionResult> {
  const { title, description, date, time, duration = 60, category = 'personal' } = args;

  try {
    // Use calendar reference system for accurate date parsing
    console.log(`[AI Functions] Creating event "${title}" for date: "${date}"`);
    const calendarContext = getCalendarReference();
    console.log(`[AI Functions] Calendar context: Today is ${calendarContext.todayInfo.dayName}, ${calendarContext.todayInfo.monthName} ${calendarContext.todayInfo.dayNumber}, ${calendarContext.todayInfo.year}`);

    // Parse natural language date and time with enhanced context
    const eventDate = parseNaturalDate(date);
    const eventTime = time ? parseNaturalTime(time) : { hour: 9, minute: 0 };

    console.log(`[AI Functions] Parsed event date: ${eventDate.toDateString()} (${getRelativeDescription(eventDate)})`);

    // Format date for localStorage key
    const dateKey = eventDate.toISOString().split('T')[0];

    // Calculate storage details for frontend (server can't access localStorage)
    let storageInfo: {
      type: 'hour' | 'day';
      key: string;
      quarter?: number;
      hour?: number;
      dateKey: string;
    };
    if (time && eventTime) {
      // Calculate quarter/hour for hourEvents
      const quarter = Math.floor((eventTime.hour - 9) / 6); // 9-3=0, 3-9=1, etc
      const hourInQuarter = Math.floor((eventTime.hour - 9) % 6);
      const hourKey = `${dateKey}-${quarter}-${hourInQuarter}`;

      storageInfo = {
        type: 'hour',
        key: hourKey,
        quarter,
        hour: hourInQuarter,
        dateKey
      };
    } else {
      // Store in dayEvents for all-day events
      storageInfo = {
        type: 'day',
        key: dateKey,
        dateKey
      };
    }

    return {
      success: true,
      data: {
        title,
        date: dateKey,
        time: eventTime,
        storageInfo // Include storage details for frontend
      },
      message: `Created event "${title}" for ${eventDate.toLocaleDateString()}${time ? ` at ${eventTime.hour}:${eventTime.minute.toString().padStart(2, '0')}` : ''}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create event'
    };
  }
}

async function updateEvent(args: any, userId: string): Promise<FunctionResult> {
  const { eventId, title, description, date, time, duration } = args;

  const updateData: any = {};

  if (title) updateData.title = title;
  if (description) updateData.description = description;

  if (date) {
    const eventDate = parseNaturalDate(date);
    const eventTime = time ? parseNaturalTime(time) : { hour: 9, minute: 0 };

    const startTime = new Date(eventDate);
    startTime.setHours(eventTime.hour, eventTime.minute, 0, 0);
    updateData.startTime = startTime;

    if (duration) {
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);
      updateData.endTime = endTime;
    }
  }

  const event = await prisma.event.update({
    where: { id: eventId, userId },
    data: updateData
  });

  return {
    success: true,
    data: event,
    message: `Updated event "${event.title}"`
  };
}

async function deleteEvent(args: any, userId: string): Promise<FunctionResult> {
  const { eventId } = args;

  const event = await prisma.event.delete({
    where: { id: eventId, userId }
  });

  return {
    success: true,
    data: event,
    message: `Deleted event "${event.title}"`
  };
}

async function getSchedule(args: any, userId: string): Promise<FunctionResult> {
  const { startDate, endDate, category } = args;

  const start = parseNaturalDate(startDate);
  const end = endDate ? parseNaturalDate(endDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const whereClause: any = {
    userId,
    startTime: {
      gte: start,
      lte: end
    }
  };

  if (category) {
    whereClause.category = category.toUpperCase();
  }

  const events = await prisma.event.findMany({
    where: whereClause,
    orderBy: { startTime: 'asc' }
  });

  return {
    success: true,
    data: events,
    message: `Found ${events.length} events between ${start.toLocaleDateString()} and ${end.toLocaleDateString()}`
  };
}

async function searchEvents(args: any, userId: string): Promise<FunctionResult> {
  const { query, limit = 10 } = args;

  const events = await prisma.event.findMany({
    where: {
      userId,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    },
    orderBy: { startTime: 'desc' },
    take: limit
  });

  return {
    success: true,
    data: events,
    message: `Found ${events.length} events matching "${query}"`
  };
}

// Note Management Functions
async function createNote(args: any, userId: string): Promise<FunctionResult> {
  const { title, content, section, tags = [], priority = 'MEDIUM' } = args;

  const note = await prisma.note.create({
    data: {
      title,
      content,
      section,
      tags,
      priority,
      userId
    }
  });

  return {
    success: true,
    data: note,
    message: `Created note "${title}" in ${section} section`
  };
}

async function searchNotes(args: any, userId: string): Promise<FunctionResult> {
  const { query, section, limit = 10 } = args;

  const whereClause: any = {
    userId,
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } }
    ]
  };

  if (section) {
    whereClause.section = section;
  }

  const notes = await prisma.note.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  return {
    success: true,
    data: notes,
    message: `Found ${notes.length} notes matching "${query}"`
  };
}

// User Preferences Functions
async function updatePreferences(args: any, userId: string): Promise<FunctionResult> {
  const { aiPersonality, timezone, workingHours, preferences } = args;

  const updateData: any = {};
  if (aiPersonality) updateData.aiPersonality = aiPersonality;
  if (timezone) updateData.timezone = timezone;
  if (workingHours) updateData.workingHours = workingHours;
  if (preferences) updateData.preferences = preferences;

  const userPreferences = await prisma.userPreference.upsert({
    where: { userId },
    update: updateData,
    create: {
      userId,
      ...updateData
    }
  });

  return {
    success: true,
    data: userPreferences,
    message: 'Updated user preferences'
  };
}

// Analysis Functions
async function analyzeSchedule(args: any, userId: string): Promise<FunctionResult> {
  const { timeframe, includeRecommendations = true } = args;

  // Calculate date range based on timeframe
  const now = new Date();
  const startDate = new Date(now);
  const endDate = new Date(now);

  switch (timeframe) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
  }

  const events = await prisma.event.findMany({
    where: {
      userId,
      startTime: { gte: startDate, lte: endDate }
    }
  });

  // Analyze patterns
  const analysis = {
    totalEvents: events.length,
    averageEventsPerDay: events.length / getDaysBetween(startDate, endDate),
    busiest: findBusiestDay(events),
    categories: analyzeCategories(events),
    timeDistribution: analyzeTimeDistribution(events),
    recommendations: includeRecommendations ? generateRecommendations(events) : []
  };

  return {
    success: true,
    data: analysis,
    message: `Analyzed ${events.length} events over the past ${timeframe}`
  };
}

async function suggestOptimalTime(args: any, userId: string): Promise<FunctionResult> {
  const { eventType, duration, preferredTimeframe = 'any', daysAhead = 7 } = args;

  // Get existing events for the next week
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);

  const existingEvents = await prisma.event.findMany({
    where: {
      userId,
      startTime: { gte: startDate, lte: endDate }
    },
    orderBy: { startTime: 'asc' }
  });

  // Find optimal time slots
  const suggestions = findOptimalTimeSlots(existingEvents, duration, preferredTimeframe, daysAhead);

  return {
    success: true,
    data: suggestions,
    message: `Found ${suggestions.length} optimal time slots for ${eventType}`
  };
}

async function setReminder(args: any, userId: string): Promise<FunctionResult> {
  const { eventId, reminderTime, message } = args;

  // For now, just update the event with reminder info
  // In a full implementation, you'd integrate with a notification system
  const event = await prisma.event.update({
    where: { id: eventId, userId },
    data: {
      description: `${message || 'Reminder set'} (${reminderTime})`
    }
  });

  return {
    success: true,
    data: event,
    message: `Set reminder for "${event.title}" - ${reminderTime}`
  };
}

async function blockTime(args: any, userId: string): Promise<FunctionResult> {
  const { title, duration, startTime, blockType = 'focus' } = args;

  const start = startTime ? parseNaturalDate(startTime) : new Date();
  const end = new Date(start.getTime() + duration * 60 * 1000);

  const event = await prisma.event.create({
    data: {
      title: `🔒 ${title}`,
      description: `Time block for ${blockType}`,
      startTime: start,
      endTime: end,
      userId,
      category: 'PERSONAL'
    }
  });

  return {
    success: true,
    data: event,
    message: `Blocked ${duration} minutes for "${title}"`
  };
}

// Get calendar context for accurate date parsing
async function getCalendarContext(args: any, userId: string): Promise<FunctionResult> {
  try {
    const context = getDateParsingContext();
    const reference = getCalendarReference();

    return {
      success: true,
      data: {
        context: context,
        today: reference.todayInfo,
        thisWeek: reference.weekInfo.days.map(d => ({
          day: d.dayName,
          date: d.dayNumber,
          isToday: d.isToday,
          isWeekend: d.isWeekend
        })),
        upcomingDates: Object.entries(reference.upcomingDates)
          .slice(0, 15)
          .map(([key, date]) => ({
            phrase: key,
            date: date.toDateString(),
            relative: getRelativeDescription(date)
          }))
      },
      message: `Calendar context retrieved. Today is ${reference.todayInfo.dayName}, ${reference.todayInfo.monthName} ${reference.todayInfo.dayNumber}, ${reference.todayInfo.year}.`
    };
  } catch (error) {
    console.error('Error getting calendar context:', error);
    return {
      success: false,
      error: 'Failed to get calendar context'
    };
  }
}

// Helper functions
function getDaysBetween(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function findBusiestDay(events: any[]): string {
  const dayCounts: { [key: string]: number } = {};

  events.forEach(event => {
    const day = event.startTime.toLocaleDateString('en-US', { weekday: 'long' });
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  return Object.entries(dayCounts).reduce((a, b) => a[1] > b[1] ? a : b)?.[0] || 'No data';
}

function analyzeCategories(events: any[]): { [key: string]: number } {
  const categories: { [key: string]: number } = {};

  events.forEach(event => {
    categories[event.category] = (categories[event.category] || 0) + 1;
  });

  return categories;
}

function analyzeTimeDistribution(events: any[]): { morning: number; afternoon: number; evening: number } {
  const distribution = { morning: 0, afternoon: 0, evening: 0 };

  events.forEach(event => {
    const hour = event.startTime.getHours();
    if (hour < 12) distribution.morning++;
    else if (hour < 18) distribution.afternoon++;
    else distribution.evening++;
  });

  return distribution;
}

function generateRecommendations(events: any[]): string[] {
  const recommendations: string[] = [];
  const timeDistribution = analyzeTimeDistribution(events);

  if (timeDistribution.morning < timeDistribution.evening) {
    recommendations.push("Consider scheduling more activities in the morning for better energy management");
  }

  if (events.length > 20) {
    recommendations.push("Your schedule is quite busy. Consider blocking time for breaks and focused work");
  }

  return recommendations;
}

function findOptimalTimeSlots(existingEvents: any[], duration: number, timeframe: string, daysAhead: number): any[] {
  // Simplified implementation - in practice, this would be more sophisticated
  const suggestions = [];
  const now = new Date();

  for (let day = 0; day < daysAhead; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);

    // Find free slots in the preferred timeframe
    const freeSlots = findFreeSlotsForDay(date, existingEvents, duration, timeframe);
    suggestions.push(...freeSlots);
  }

  return suggestions.slice(0, 5); // Return top 5 suggestions
}

function findFreeSlotsForDay(date: Date, existingEvents: any[], duration: number, timeframe: string): any[] {
  const slots = [];
  const dayStart = new Date(date);
  const dayEnd = new Date(date);

  // Set time ranges based on preference
  switch (timeframe) {
    case 'morning':
      dayStart.setHours(8, 0, 0, 0);
      dayEnd.setHours(12, 0, 0, 0);
      break;
    case 'afternoon':
      dayStart.setHours(12, 0, 0, 0);
      dayEnd.setHours(18, 0, 0, 0);
      break;
    case 'evening':
      dayStart.setHours(18, 0, 0, 0);
      dayEnd.setHours(22, 0, 0, 0);
      break;
    default:
      dayStart.setHours(8, 0, 0, 0);
      dayEnd.setHours(22, 0, 0, 0);
  }

  // Simple implementation: suggest times with 2-hour gaps
  for (let hour = dayStart.getHours(); hour < dayEnd.getHours(); hour += 2) {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);

    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + duration);

    // Check if this slot conflicts with existing events
    const hasConflict = existingEvents.some(event =>
      (slotStart >= event.startTime && slotStart < event.endTime) ||
      (slotEnd > event.startTime && slotEnd <= event.endTime)
    );

    if (!hasConflict) {
      slots.push({
        date: slotStart.toLocaleDateString(),
        time: slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        datetime: slotStart.toISOString()
      });
    }
  }

  return slots;
}
