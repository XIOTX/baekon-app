// Calendar Reference System - External Ground Truth for Date Parsing
// This provides authoritative calendar data that AI can reference and compare against

interface CalendarReference {
  today: Date;
  todayInfo: DateInfo;
  weekInfo: WeekInfo;
  monthInfo: MonthInfo;
  yearInfo: YearInfo;
  upcomingDates: UpcomingDateMap;
}

interface DateInfo {
  date: Date;
  dayName: string;
  dayNumber: number;
  monthName: string;
  monthNumber: number;
  year: number;
  quarter: number;
  weekOfYear: number;
  dayOfYear: number;
  isWeekend: boolean;
  isToday: boolean;
}

interface WeekInfo {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  days: DateInfo[];
}

interface MonthInfo {
  monthName: string;
  monthNumber: number;
  year: number;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  weeks: WeekInfo[];
}

interface YearInfo {
  year: number;
  isLeapYear: boolean;
  totalDays: number;
  months: MonthInfo[];
}

interface UpcomingDateMap {
  [key: string]: Date; // "next monday", "tomorrow", "next week", etc.
}

/**
 * Get comprehensive calendar reference data
 * This is the authoritative source that AI should use for all date operations
 */
export function getCalendarReference(): CalendarReference {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    today,
    todayInfo: getDateInfo(today),
    weekInfo: getWeekInfo(today),
    monthInfo: getMonthInfo(today),
    yearInfo: getYearInfo(today),
    upcomingDates: generateUpcomingDates(today)
  };
}

/**
 * Get detailed information about a specific date
 */
function getDateInfo(date: Date): DateInfo {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

  const dayOfWeek = date.getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    date: new Date(date),
    dayName: dayNames[dayOfWeek],
    dayNumber: date.getDate(),
    monthName: monthNames[date.getMonth()],
    monthNumber: date.getMonth() + 1,
    year: date.getFullYear(),
    quarter: Math.floor(date.getMonth() / 3) + 1,
    weekOfYear: getWeekOfYear(date),
    dayOfYear: getDayOfYear(date),
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    isToday: date.getTime() === today.getTime()
  };
}

/**
 * Get information about the week containing the given date
 */
function getWeekInfo(date: Date): WeekInfo {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay()); // Start on Sunday

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const days: DateInfo[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(getDateInfo(day));
  }

  return {
    weekNumber: getWeekOfYear(date),
    startDate: startOfWeek,
    endDate: endOfWeek,
    days
  };
}

/**
 * Get information about the month containing the given date
 */
function getMonthInfo(date: Date): MonthInfo {
  const year = date.getFullYear();
  const month = date.getMonth();

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const weeks: WeekInfo[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    weeks.push(getWeekInfo(currentDate));
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return {
    monthName: getDateInfo(date).monthName,
    monthNumber: month + 1,
    year,
    startDate,
    endDate,
    totalDays: endDate.getDate(),
    weeks
  };
}

/**
 * Get information about the year containing the given date
 */
function getYearInfo(date: Date): YearInfo {
  const year = date.getFullYear();
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

  const months: MonthInfo[] = [];
  for (let month = 0; month < 12; month++) {
    const monthDate = new Date(year, month, 15); // Mid-month
    months.push(getMonthInfo(monthDate));
  }

  return {
    year,
    isLeapYear,
    totalDays: isLeapYear ? 366 : 365,
    months
  };
}

/**
 * Generate a map of upcoming dates that can be referenced by natural language
 */
function generateUpcomingDates(today: Date): UpcomingDateMap {
  const dates: UpcomingDateMap = {};

  // Tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  dates['tomorrow'] = tomorrow;

  // Day names for the next 14 days
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 1; i <= 14; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    const dayName = dayNames[futureDate.getDay()];

    // First occurrence gets just the day name
    if (!dates[dayName]) {
      dates[dayName] = futureDate;
    }

    // Also add "next [day]" for the second occurrence
    if (i > 7 && !dates[`next ${dayName}`]) {
      dates[`next ${dayName}`] = futureDate;
    }
  }

  // Relative weeks
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  dates['next week'] = nextWeek;

  const weekAfter = new Date(today);
  weekAfter.setDate(today.getDate() + 14);
  dates['week after next'] = weekAfter;

  // Relative months
  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);
  dates['next month'] = nextMonth;

  // Specific future dates (e.g., "in 3 days", "in 2 weeks")
  for (let days = 1; days <= 30; days++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    dates[`in ${days} day${days === 1 ? '' : 's'}`] = futureDate;
  }

  for (let weeks = 1; weeks <= 12; weeks++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + (weeks * 7));
    dates[`in ${weeks} week${weeks === 1 ? '' : 's'}`] = futureDate;
  }

  for (let months = 1; months <= 12; months++) {
    const futureDate = new Date(today);
    futureDate.setMonth(today.getMonth() + months);
    dates[`in ${months} month${months === 1 ? '' : 's'}`] = futureDate;
  }

  return dates;
}

/**
 * Parse natural language date by referencing the calendar
 * This replaces guesswork with authoritative calendar lookups
 */
export function parseNaturalDateWithReference(dateStr: string): Date | null {
  const reference = getCalendarReference();
  const lowerDate = dateStr.toLowerCase().trim();

  console.log(`[Calendar Reference] Parsing: "${dateStr}"`);
  console.log(`[Calendar Reference] Today is: ${reference.todayInfo.dayName}, ${reference.todayInfo.monthName} ${reference.todayInfo.dayNumber}, ${reference.todayInfo.year}`);

  // Check direct matches in upcoming dates map
  if (reference.upcomingDates[lowerDate]) {
    const result = reference.upcomingDates[lowerDate];
    console.log(`[Calendar Reference] Direct match found: ${result.toDateString()}`);
    return result;
  }

  // Check for partial matches
  for (const [key, date] of Object.entries(reference.upcomingDates)) {
    if (lowerDate.includes(key) || key.includes(lowerDate)) {
      console.log(`[Calendar Reference] Partial match "${key}" found: ${date.toDateString()}`);
      return date;
    }
  }

  // Check for month names with optional day numbers
  const monthMatch = lowerDate.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{1,2})?/);
  if (monthMatch) {
    const monthName = monthMatch[1];
    const dayNumber = monthMatch[2] ? Number.parseInt(monthMatch[2]) : 15; // Default to mid-month

    // Find the month in this year or next year
    const currentMonth = reference.todayInfo.monthNumber;
    const targetMonthIndex = reference.yearInfo.months.findIndex(m =>
      m.monthName.toLowerCase() === monthName
    );

    if (targetMonthIndex !== -1) {
      const targetMonth = targetMonthIndex + 1;
      let year = reference.todayInfo.year;

      // If month has passed this year, use next year
      if (targetMonth < currentMonth ||
          (targetMonth === currentMonth && dayNumber < reference.todayInfo.dayNumber)) {
        year += 1;
      }

      const result = new Date(year, targetMonthIndex, dayNumber);
      console.log(`[Calendar Reference] Month match "${monthName} ${dayNumber}" found: ${result.toDateString()}`);
      return result;
    }
  }

  // Check for time expressions like "at 2pm tomorrow"
  const timeMatch = lowerDate.match(/at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?\s+(.*)/);
  if (timeMatch) {
    const dateReference = timeMatch[4];
    const baseDate = parseNaturalDateWithReference(dateReference);
    if (baseDate) {
      let hour = Number.parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? Number.parseInt(timeMatch[2]) : 0;
      const ampm = timeMatch[3];

      if (ampm === 'pm' && hour !== 12) {
        hour += 12;
      } else if (ampm === 'am' && hour === 12) {
        hour = 0;
      }

      baseDate.setHours(hour, minute, 0, 0);
      console.log(`[Calendar Reference] Time + date match: ${baseDate.toDateString()} ${baseDate.toTimeString()}`);
      return baseDate;
    }
  }

  console.log(`[Calendar Reference] No match found for: "${dateStr}"`);
  return null;
}

// Utility functions
function getWeekOfYear(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getDayOfYear(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((date.getTime() - firstDayOfYear.getTime()) / 86400000) + 1;
}

/**
 * Get human-readable description of when a date occurs relative to today
 */
export function getRelativeDescription(date: Date): string {
  const reference = getCalendarReference();
  const today = reference.today;

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  if (diffDays > 1 && diffDays <= 7) return `in ${diffDays} days`;
  if (diffDays > 7 && diffDays <= 14) return 'next week';
  if (diffDays > 14 && diffDays <= 30) return `in ${Math.ceil(diffDays / 7)} weeks`;
  if (diffDays > 30) return `in ${Math.ceil(diffDays / 30)} months`;

  return date.toDateString();
}
