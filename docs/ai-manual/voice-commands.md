# Voice Commands Reference
## Complete Voice Command System Documentation

### Overview
BÆKON features advanced voice recognition with Web Speech API, natural language processing, confidence scoring, and smart error correction.

---

## Voice Command Categories

### Schedule Management
**Primary Function:** Create, modify, and query calendar events

#### Event Creation Patterns
```typescript
// Basic scheduling
"Schedule [event] [day] at [time]"
"Add [event] on [day]"
"Book [event] for [time]"
"Create [event] [day/time]"

// Examples:
"Schedule gym tomorrow at 7am"
"Add team meeting Friday at 2pm"
"Book dentist appointment next Tuesday"
"Create lunch with mom this Saturday at noon"
```

#### Time Blocking Patterns
```typescript
"Block [duration] for [activity]"
"Reserve [time] for [purpose]"
"Hold [timeframe] for [task]"
"Focus time for [duration]"

// Examples:
"Block 2 hours for deep work"
"Reserve this afternoon for project review"
"Hold Monday morning for planning"
"Focus time for 90 minutes"
```

#### Query Patterns
```typescript
"What's my schedule [timeframe]?"
"Show me [day/week] calendar"
"Am I free [time]?"
"When is my next [event type]?"

// Examples:
"What's my schedule today?"
"Show me this week's calendar"
"Am I free this afternoon?"
"When is my next meeting?"
```

### Note Management
```typescript
"Create a note about [topic]"
"Note that [information]"
"Remember [fact/task]"
"Add to [work/life] notes [content]"

// Examples:
"Create a note about project requirements"
"Note that the deadline moved to Friday"
"Remember to order office supplies"
"Add to work notes: team feedback session needed"
```

### Navigation Commands
```typescript
"Go to [section/view]"
"Switch to [work/life/schedule]"
"Show [calendar/planner] view"
"Open [section]"

// Examples:
"Go to calendar view"
"Switch to work section"
"Show planner view"
"Open life section"
```

### Control Commands
```typescript
"Help" | "What can you do?" | "Show commands"
"Stop" | "Cancel" | "Never mind"
"Repeat" | "Say that again"

// Examples:
"Help me with voice commands"
"What can you do?"
"Stop listening"
```

---

## Natural Language Date Parsing

### Relative Dates
```typescript
"today" → Current date
"tomorrow" → Next day
"yesterday" → Previous day
"this [weekday]" → Next occurrence this week
"next [weekday]" → Next occurrence next week
"coming [weekday]" → Next occurrence
```

### Time Expressions
```typescript
"in [number] [unit]" → Future offset
"[number] [unit] from now" → Future offset
"[number] [unit] ago" → Past offset

// Examples:
"in 3 days" → 3 days from today
"in 2 weeks" → 2 weeks from today
"in 6 months" → 6 months from today
"2 hours from now" → 2 hours later
```

### Specific Dates
```typescript
"[Month] [day]" → Next occurrence
"[Month] [day], [year]" → Specific year
"[day]/[month]" → Date format
"[day]-[month]-[year]" → Full date

// Examples:
"January 15" → Next January 15th
"March 20, 2026" → Specific date
"12/25" → December 25th this year
"15-06-2025" → June 15, 2025
```

### Holiday Recognition
```typescript
"Father's Day" → Calculated holiday date
"Mother's Day" → Calculated holiday date
"Christmas" → December 25th
"New Year" → January 1st
"Thanksgiving" → Calculated date
"Easter" → Calculated date
```

---

## Voice Processing Pipeline

### 1. Speech Recognition
```typescript
// Web Speech API Configuration
recognition.continuous = false;
recognition.interimResults = true;
recognition.lang = 'en-US';
recognition.maxAlternatives = 1;

// Audio Level Monitoring
analyser.fftSize = 256;
const audioLevel = average / 128; // Normalized 0-1
```

### 2. Command Pattern Matching
```typescript
// Regex patterns for each command category
const SCHEDULE_PATTERNS = [
  /^(schedule|add|create) (.*?) (tomorrow|today|monday|tuesday|...)/i,
  /^(book|set up|plan) (.*?) (at|for) (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
  /^(reminder|remind me) (.*?) (in|at) (.*)/i
];

// Pattern matching with confidence scoring
for (const pattern of patterns) {
  const matches = transcript.match(pattern);
  if (matches) {
    const confidence = calculateConfidence(transcript, matches, command);
    // Store best match
  }
}
```

### 3. Confidence Scoring
```typescript
function calculateConfidence(transcript: string, matches: RegExpMatchArray): number {
  let confidence = 0.8; // Base confidence for pattern match

  // Boost for coverage ratio
  const coverageRatio = matches[0].length / transcript.length;
  confidence += coverageRatio * 0.2;

  // Boost for common keywords
  const commonKeywords = ['schedule', 'add', 'create', 'what', 'show'];
  if (hasCommonKeywords) confidence += 0.1;

  // Penalize short matches
  if (coverageRatio < 0.5) confidence -= 0.2;

  return Math.min(Math.max(confidence, 0), 1);
}
```

### 4. Error Correction
```typescript
// Fuzzy matching for misheard commands
function findSimilarCommands(transcript: string): string[] {
  const commonCommands = [
    "schedule gym tomorrow",
    "what's my schedule today",
    "create a note about",
    "block time for work"
  ];

  return commonCommands
    .map(cmd => ({
      command: cmd,
      similarity: calculateStringSimilarity(transcript, cmd)
    }))
    .filter(match => match.similarity > 0.6)
    .sort((a, b) => b.similarity - a.similarity)
    .map(match => match.command);
}

// Levenshtein distance for string similarity
function levenshteinDistance(str1: string, str2: string): number {
  // Dynamic programming implementation
  const matrix = Array(str2.length + 1).fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  // Fill matrix and return distance
  return matrix[str2.length][str1.length];
}
```

---

## Voice Interface Components

### Audio Level Visualization
```typescript
// Real-time audio level display
const getAudioLevelColor = () => {
  if (audioLevel < 0.1) return 'bg-gray-500';   // Too quiet
  if (audioLevel < 0.3) return 'bg-yellow-500'; // Good
  if (audioLevel < 0.7) return 'bg-green-500';  // Perfect
  return 'bg-red-500';                           // Too loud
};
```

### Live Transcription
```typescript
// Show interim results during recognition
recognition.onresult = (event) => {
  let finalTranscript = '';
  let interimTranscript = '';

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      finalTranscript += transcript;
    } else {
      interimTranscript += transcript;
    }
  }

  setTranscript(finalTranscript || interimTranscript);
};
```

### Error Handling
```typescript
// Enhanced error messages
recognition.onerror = (event) => {
  let errorMessage;
  switch (event.error) {
    case 'network':
      errorMessage = 'Network error. Check internet connection and try again.';
      break;
    case 'not-allowed':
      errorMessage = 'Microphone access denied. Allow microphone access in browser.';
      break;
    case 'no-speech':
      errorMessage = 'No speech detected. Speak clearly and try again.';
      break;
    default:
      errorMessage = `Speech recognition error: ${event.error}`;
  }

  setError(errorMessage);
};
```

---

## Keyboard Shortcuts

### Voice Activation
```typescript
"Ctrl+Shift+V" → Toggle voice recording
"Space (hold)" → Push-to-talk mode
"Ctrl+M" → Toggle microphone
"Ctrl+/" → Show voice command help
"Escape" → Stop recording
```

### Implementation
```typescript
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Skip if user is typing in inputs
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'V') {
      event.preventDefault();
      toggleRecording();
    }

    if (event.code === 'Space' && !event.repeat) {
      event.preventDefault();
      startRecording();
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## Voice Command History & Analytics

### History Tracking
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

// Track command usage
function addToHistory(command: string, recognized: boolean) {
  const existing = history.find(entry =>
    entry.command.toLowerCase() === command.toLowerCase()
  );

  if (existing) {
    existing.frequency += 1;
    existing.timestamp = new Date();
  } else {
    history.push({
      id: generateId(),
      command,
      timestamp: new Date(),
      recognized,
      frequency: 1,
      isFavorite: false
    });
  }
}
```

### Usage Analytics
```typescript
// Generate insights from voice usage
function getVoiceStats() {
  const total = history.length;
  const recognized = history.filter(entry => entry.recognized).length;
  const recognitionRate = (recognized / total) * 100;

  const categoryStats = history.reduce((acc, entry) => {
    if (entry.category) {
      acc[entry.category] = (acc[entry.category] || 0) + 1;
    }
    return acc;
  }, {});

  const mostUsed = history
    .sort((a, b) => b.frequency - a.frequency)[0];

  return {
    total,
    recognized,
    recognitionRate: Math.round(recognitionRate),
    categoryStats,
    mostUsedCommand: mostUsed?.command,
    favoritesCount: favorites.length
  };
}
```

---

## Best Practices for Voice Commands

### For Users
1. **Speak clearly** - Articulate words distinctly
2. **Use natural language** - "Schedule gym tomorrow" not "create-event-gym-06-12"
3. **Be specific** - Include times, dates, and details
4. **Wait for feedback** - Let the system confirm before continuing
5. **Learn from suggestions** - Pay attention to error corrections

### For AI Agents
1. **Parse intent first** - Understand what user wants before extracting details
2. **Confirm actions** - Always tell user what was created/modified
3. **Handle ambiguity** - Ask for clarification when dates/times are unclear
4. **Provide alternatives** - Suggest corrections for unrecognized commands
5. **Learn patterns** - Track user preferences and common phrasings
