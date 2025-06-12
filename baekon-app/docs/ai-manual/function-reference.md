# Function Reference
## Available AI Functions for BÆKON Control

### Overview
All functions return `{success: boolean, data?: any, message?: string}` format.
**CRITICAL:** Server-side functions cannot access localStorage - they return storage instructions for frontend.

---

## Event Management

### `create_event(args, userId)`
**Purpose:** Create calendar events with natural language date parsing
**Execution:** Server-side → Returns storageInfo for frontend localStorage writing

**Parameters:**
```typescript
{
  title: string;           // Event title (required)
  description?: string;    // Optional description
  date: string;           // Natural language date: "tomorrow", "next Tuesday", "in 3 months"
  time?: string;          // Natural language time: "2pm", "morning", "evening"
  duration?: number;      // Minutes (default: 60)
  category?: string;      // "personal", "work", etc.
}
```

**Returns:**
```typescript
{
  success: true,
  data: {
    title: string,
    date: string,        // YYYY-MM-DD format
    time: {hour: number, minute: number},
    storageInfo: {
      type: "hour" | "day",
      key: string,       // localStorage key
      quarter?: number,  // 0-3 (for hour events)
      hour?: number,     // 0-5 (within quarter)
      dateKey: string    // YYYY-MM-DD
    }
  },
  message: string
}
```

**Natural Language Date Parsing:**
- `"tomorrow"` → Next day
- `"next Tuesday"` → Next occurrence of Tuesday
- `"in 3 months"` → 3 months from today
- `"January 15"` → Next January 15th
- `"Father's Day"` → Next Father's Day

**Time Quarter System:**
- Quarter 0: 9AM-3PM (hours 0-5 = 9AM-2PM)
- Quarter 1: 3PM-9PM (hours 0-5 = 3PM-8PM)
- Quarter 2: 9PM-3AM (hours 0-5 = 9PM-2AM)
- Quarter 3: 3AM-9AM (hours 0-5 = 3AM-8AM)

### `update_event(args, userId)`
**Purpose:** Modify existing events
**Status:** Placeholder - not fully implemented

### `delete_event(args, userId)`
**Purpose:** Remove events
**Status:** Placeholder - not fully implemented

---

## Schedule Management

### `get_schedule(args, userId)`
**Purpose:** Retrieve user's schedule for analysis
**Parameters:**
```typescript
{
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
  timeframe?: "today" | "week" | "month";
}
```

### `search_events(args, userId)`
**Purpose:** Find events by criteria
**Parameters:**
```typescript
{
  query: string;       // Search term
  startDate?: string;
  endDate?: string;
}
```

### `analyze_schedule(args, userId)`
**Purpose:** Provide schedule optimization insights
**Returns:** Productivity patterns, time conflicts, recommendations

### `suggest_optimal_time(args, userId)`
**Purpose:** Find best time slots for activities
**Parameters:**
```typescript
{
  activity: string;    // What needs scheduling
  duration: number;    // Minutes needed
  preferences?: {
    timeOfDay?: "morning" | "afternoon" | "evening";
    daysOfWeek?: string[];
  }
}
```

---

## Note Management

### `create_note(args, userId)`
**Purpose:** Create structured notes
**Parameters:**
```typescript
{
  title: string;
  content: string;
  section: "WORK" | "LIFE";
  tags?: string[];
  priority?: "LOW" | "MEDIUM" | "HIGH";
}
```

### `search_notes(args, userId)`
**Purpose:** Find notes by content/tags
**Parameters:**
```typescript
{
  query: string;
  section?: "WORK" | "LIFE";
  tags?: string[];
}
```

---

## User Preferences

### `update_preferences(args, userId)`
**Purpose:** Modify user settings and preferences
**Parameters:**
```typescript
{
  aiPersonality?: string;
  timezone?: string;
  workingHours?: {start: string, end: string};
  preferences?: object;  // Flexible preferences
}
```

### `set_reminder(args, userId)`
**Purpose:** Create reminders and alerts
**Parameters:**
```typescript
{
  title: string;
  triggerDate: string;
  triggerTime?: string;
  type: "notification" | "email" | "sms";
}
```

---

## Function Calling Best Practices

1. **Always use natural language dates** - System handles parsing
2. **Be specific with times** - Include AM/PM or use 24hr format
3. **Capture user intent** - If user says "gym tomorrow", use `create_event`
4. **Handle errors gracefully** - Check `success` field in response
5. **Store function results in memory** - For user context building
6. **Provide confirmation** - Tell user what was created/modified

## Example Usage Patterns

```typescript
// User: "Schedule gym tomorrow at 7am"
await create_event({
  title: "Gym",
  date: "tomorrow",
  time: "7am",
  category: "personal"
}, userId);

// User: "Block 2 hours for deep work next week"
await create_event({
  title: "Deep work block",
  date: "next Monday",
  time: "9am",
  duration: 120,
  category: "work"
}, userId);
```
