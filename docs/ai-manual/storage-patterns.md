# Storage Patterns
## localStorage Data Structure & Key Patterns

### Overview
BÆKON uses localStorage-first architecture for privacy and performance. All user data persists locally by default, with optional cloud sync.

---

## Event Storage

### Hour Events
**Key Pattern:** `YYYY-MM-DD-{quarter}-{hour}`
**Storage:** `localStorage['baekon-hour-events']`

```typescript
// Example keys:
"2025-06-11-0-2"  // June 11, 2025, Quarter 0 (9AM-3PM), Hour 2 (11AM-12PM)
"2025-06-15-1-4"  // June 15, 2025, Quarter 1 (3PM-9PM), Hour 4 (7PM-8PM)

// Storage structure:
{
  "2025-06-11-0-2": ["Team meeting", "Code review"],
  "2025-06-11-1-0": ["Gym session"],
  "2025-06-12-0-1": ["Doctor appointment"]
}
```

### Day Events
**Key Pattern:** `YYYY-MM-DD`
**Storage:** `localStorage['baekon-day-events']`

```typescript
// All-day events or events without specific times
{
  "2025-06-11": ["Birthday party", "Travel day"],
  "2025-06-15": ["Conference", "Team outing"]
}
```

### Quarter System Mapping
```typescript
const QUARTERS = {
  0: { label: "9AM-3PM", start: 9,  hours: ["9", "10", "11", "12", "1", "2"] },
  1: { label: "3PM-9PM", start: 15, hours: ["3", "4",  "5",  "6",  "7", "8"] },
  2: { label: "9PM-3AM", start: 21, hours: ["9", "10", "11", "12", "1", "2"] },
  3: { label: "3AM-9AM", start: 3,  hours: ["3", "4",  "5",  "6",  "7", "8"] }
};

// Hour calculation within quarter:
// hourInQuarter = actualHour - quarterStartHour
// For Quarter 1 (3PM-9PM): 5PM = hour 2 (5-15=2, but we use 5-3=2 within quarter)
```

---

## Chat & Memory Storage

### Chat Messages
**Storage:** `localStorage['baekon-chat-{userId}']`

```typescript
interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

// Array of messages per user
[
  {
    id: "user-1699123456789",
    content: "Schedule gym tomorrow",
    type: "user",
    timestamp: "2025-06-11T10:30:00.000Z"
  },
  {
    id: "assistant-1699123456790",
    content: "I've scheduled your gym session for tomorrow at 9AM.",
    type: "assistant",
    timestamp: "2025-06-11T10:30:01.000Z"
  }
]
```

### Voice Command History
**Storage:** `localStorage['voice-history-{userId}']` & `localStorage['voice-favorites-{userId}']`

```typescript
interface VoiceHistoryEntry {
  id: string;
  command: string;
  timestamp: Date;
  recognized: boolean;
  category?: string;
  frequency: number;
  isFavorite: boolean;
}
```

### User Preferences
**Storage:** `localStorage['baekon-preferences-{userId}']`

```typescript
{
  defaultView: "planner" | "calendar";
  timezone: string;
  theme: "dark" | "light";
  voiceEnabled: boolean;
  aiPersonality: string;
  workingHours: { start: string, end: string };
  syncSettings: {
    events: boolean;
    notes: boolean;
    aiMemory: boolean;
  }
}
```

---

## Key Generation Patterns

### Date Key Generation
```typescript
// Always use ISO date format YYYY-MM-DD
const dateKey = new Date().toISOString().split('T')[0];

// For specific dates:
const targetDate = new Date('2025-06-15');
const dateKey = targetDate.toISOString().split('T')[0]; // "2025-06-15"
```

### Hour Key Generation
```typescript
function generateHourKey(date: Date, hour: number): string {
  const dateKey = date.toISOString().split('T')[0];

  // Determine quarter (0-3)
  let quarter;
  if (hour >= 9 && hour < 15) quarter = 0;      // 9AM-3PM
  else if (hour >= 15 && hour < 21) quarter = 1; // 3PM-9PM
  else if (hour >= 21 || hour < 3) quarter = 2;  // 9PM-3AM
  else quarter = 3;                               // 3AM-9AM

  // Hour within quarter (0-5)
  const hourInQuarter = Math.floor((hour - (quarter * 6 + 9)) % 6);

  return `${dateKey}-${quarter}-${hourInQuarter}`;
}
```

### Safe Storage Operations
```typescript
// Reading from localStorage
function getEvents(key: string): string[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn(`Failed to read ${key}:`, error);
    return [];
  }
}

// Writing to localStorage
function setEvents(key: string, events: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(events));
  } catch (error) {
    console.warn(`Failed to write ${key}:`, error);
  }
}

// Adding events safely
function addEvent(storageKey: string, eventTitle: string): void {
  const existing = getEvents(storageKey);
  const updated = [...existing, eventTitle];
  setEvents(storageKey, updated);
}
```

---

## Data Migration & Sync

### Version Detection
```typescript
// Check for data format version
const version = localStorage.getItem('baekon-data-version') || '1.0';

// Migrate if needed
if (version < '2.0') {
  migrateToV2();
  localStorage.setItem('baekon-data-version', '2.0');
}
```

### Cloud Sync Pattern
```typescript
// When sync is enabled, replicate localStorage to database
async function syncToCloud(userId: string) {
  const localEvents = {
    hourEvents: JSON.parse(localStorage.getItem('baekon-hour-events') || '{}'),
    dayEvents: JSON.parse(localStorage.getItem('baekon-day-events') || '{}')
  };

  await fetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify({ userId, events: localEvents })
  });
}
```

---

## Performance Considerations

1. **Batch Updates:** Group multiple event changes into single localStorage write
2. **Lazy Loading:** Only load data for current view/timeframe
3. **Cleanup:** Periodically remove old data (>1 year)
4. **Compression:** Consider compressing large datasets
5. **Indexing:** Use Maps for frequent lookups instead of object key scanning

### Storage Limits
- **localStorage Limit:** ~5-10MB per domain
- **Recommended Usage:** <2MB for optimal performance
- **Cleanup Strategy:** Auto-archive events older than 12 months
