---

## Error Handling

### Overview
BÆKON is designed with robust error handling to provide graceful degradation and helpful user feedback. The AI agent must understand common error scenarios and recovery patterns.

### Error Categories

#### 1. Function Call Errors
**When:** AI function calls fail due to invalid parameters or system issues
**Handling:** Validate inputs, provide fallbacks, inform user clearly

```typescript
// Example error handling in AI function
try {
  const result = await create_event(args, userId);
  if (!result.success) {
    return `I couldn't create that event: ${result.error}. Let me try a different approach.`;
  }
} catch (error) {
  return `Event creation failed due to a system error. Your request has been saved and I'll retry it.`;
}
```

#### 2. Natural Language Parsing Errors
**When:** Date/time parsing fails or ambiguous input
**Recovery:** Ask for clarification, suggest alternatives

```typescript
// Date parsing with error handling
function parseNaturalDateWithFallback(dateString: string): Date | null {
  try {
    const parsed = parseNaturalDate(dateString);
    if (!parsed || isNaN(parsed.getTime())) {
      throw new Error(`Invalid date: ${dateString}`);
    }
    return parsed;
  } catch (error) {
    // Return null and let caller handle
    console.warn('Date parsing failed:', error);
    return null;
  }
}

// In AI response logic
const parsedDate = parseNaturalDateWithFallback(userDate);
if (!parsedDate) {
  return `I couldn't understand "${userDate}". Could you try "tomorrow", "next Monday", or a specific date like "June 15"?`;
}
```

#### 3. Storage Errors
**When:** localStorage fails, database unavailable, sync issues
**Recovery:** Graceful degradation, user notification, retry mechanisms

```typescript
// Safe localStorage operations with error handling
function safeStorageWrite(key: string, data: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Storage write failed:', error);

    // Try to free up space
    if (error.name === 'QuotaExceededError') {
      cleanupOldStorage();
      try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (retryError) {
        console.error('Storage retry failed:', retryError);
      }
    }

    return false;
  }
}

// Usage in event creation
if (!safeStorageWrite(storageKey, eventData)) {
  return `Event created but couldn't save to your calendar. Please refresh the page and try again.`;
}
```

#### 4. Voice Recognition Errors
**When:** Microphone access denied, network issues, recognition failures
**Recovery:** Specific error messages, fallback to text input

```typescript
// Voice error handling (from useVoiceRecording.ts)
recognition.onerror = (event) => {
  let errorMessage = 'Speech recognition failed';

  switch (event.error) {
    case 'network':
      errorMessage = 'Network error. Please check your internet connection and try again.';
      break;
    case 'not-allowed':
      errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
      break;
    case 'service-not-allowed':
      errorMessage = 'Speech recognition service not available. Please try again later.';
      break;
    case 'no-speech':
      errorMessage = 'No speech detected. Please speak clearly and try again.';
      break;
    case 'audio-capture':
      errorMessage = 'Microphone error. Please check your microphone and try again.';
      break;
    default:
      errorMessage = `Speech recognition error: ${event.error}. Please try again.`;
  }

  setState(prev => ({ ...prev, error: errorMessage, isRecording: false }));
  if (onError) onError(errorMessage);
};
```

#### 5. API/Network Errors
**When:** OpenAI API issues, deployment problems, network failures
**Recovery:** Inform user, provide offline functionality where possible

```typescript
// API error handling in openai.ts
try {
  const response = await openai.chat.completions.create({...});
  return response.choices[0]?.message?.content;
} catch (error) {
  console.error('OpenAI API error:', error);

  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    return `I'm having authentication issues. Please contact support.`;
  }
  if (error.message.includes('429') || error.message.includes('rate limit')) {
    return `I'm temporarily overloaded. Please try again in a few moments.`;
  }
  if (error.message.includes('insufficient_quota')) {
    return `I've reached my usage limit. Please contact support to restore service.`;
  }

  // Generic fallback
  return `I'm experiencing technical difficulties. Your message was saved and I'll respond as soon as possible.`;
}
```

### Error Recovery Patterns

#### Progressive Degradation
```typescript
// Try multiple approaches in order of preference
async function createEventWithFallback(eventData: any, userId: string) {
  // 1. Try AI function calling (most intelligent)
  try {
    const aiResult = await executeAIFunction('create_event', eventData, userId);
    if (aiResult.success) return aiResult;
  } catch (error) {
    console.warn('AI function call failed, trying manual parsing');
  }

  // 2. Try manual parsing (more reliable)
  try {
    const manualResult = await manualEventCreation(eventData);
    if (manualResult.success) return manualResult;
  } catch (error) {
    console.warn('Manual parsing failed, using basic storage');
  }

  // 3. Basic storage as fallback (always works)
  return {
    success: true,
    data: { title: eventData.title, date: new Date().toISOString().split('T')[0] },
    message: 'Event created with basic information. Please edit details manually.'
  };
}
```

#### User Feedback Patterns
```typescript
// Provide helpful, actionable error messages
const ERROR_MESSAGES = {
  // Network issues
  NETWORK_ERROR: "I'm having trouble connecting. Please check your internet and try again.",
  API_TIMEOUT: "That took longer than expected. Let me try again with a simpler approach.",

  // User input issues
  AMBIGUOUS_DATE: "I need clarification on the date. Did you mean {suggestion1} or {suggestion2}?",
  INVALID_TIME: "I couldn't understand '{time}'. Please try formats like '2pm', '14:30', or 'afternoon'.",
  MISSING_INFO: "I need a bit more information. What {missingField} would you like?",

  // System issues
  STORAGE_FULL: "Your browser storage is full. I'll clean up old data to make space.",
  FEATURE_UNAVAILABLE: "That feature isn't available right now, but I can {alternative}.",

  // Generic fallbacks
  UNKNOWN_ERROR: "Something unexpected happened. Please try rephrasing your request.",
  PARTIAL_SUCCESS: "I completed part of your request. Here's what worked: {details}"
};
```

#### Retry Mechanisms
```typescript
// Exponential backoff for API calls
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('All retry attempts failed');
}

// Usage
const result = await withRetry(() =>
  executeAIFunction('create_event', eventData, userId)
);
```

### Error Prevention

#### Input Validation
```typescript
// Validate before processing
function validateUserInput(message: string, context: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check message length
  if (message.length > 2000) {
    errors.push('Message too long (max 2000 characters)');
  }

  // Check for common issues
  if (message.toLowerCase().includes('yesterday') && context.action === 'schedule') {
    warnings.push('Did you mean to schedule something in the past?');
  }

  // Check for required context
  if (message.includes('schedule') && !message.includes('time') && !message.includes('day')) {
    warnings.push('No date or time specified - I\'ll ask for clarification');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canProceed: errors.length === 0
  };
}
```

#### Graceful Fallbacks
```typescript
// Always provide a working fallback
function getEventStorageLocation(eventData: any): StorageLocation {
  try {
    // Try to calculate proper quarter/hour
    const calculated = calculateOptimalStorage(eventData);
    return calculated;
  } catch (error) {
    console.warn('Storage calculation failed, using default:', error);

    // Fallback to day storage
    return {
      type: 'day',
      key: new Date().toISOString().split('T')[0],
      message: 'Stored as all-day event due to parsing issue'
    };
  }
}
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: "AI not responding or giving generic responses"
**Symptoms:**
- AI responses are vague or unhelpful
- No function calling happening
- Responses don't reference user context

**Diagnosis:**
```typescript
// Check these in order:
1. OpenAI API key validity: process.env.OPENAI_API_KEY
2. Function calling registration: AI_TOOLS array in aiTools.ts
3. User context loading: Check memory retrieval in openai.ts
4. System prompt injection: Verify enhanced context in generateResponse()
```

**Solutions:**
- Verify API key is set and valid
- Check function calling is enabled in OpenAI request
- Ensure user ID is passed correctly
- Review system prompt for clarity and function availability

#### Issue: "Events not saving to calendar"
**Symptoms:**
- AI says event was created but doesn't appear in UI
- Events appear on wrong dates
- localStorage not updating

**Diagnosis:**
```typescript
// Debug localStorage issues:
console.log('Hour Events:', localStorage.getItem('baekon-hour-events'));
console.log('Day Events:', localStorage.getItem('baekon-day-events'));

// Check function call response:
console.log('AI Function Result:', result.eventData);

// Verify storage routing:
console.log('Storage Info:', result.eventData?.storageInfo);
```

**Solutions:**
- Check if `eventData.storageInfo` is returned from AI function
- Verify frontend is handling `storageInfo` correctly in BottomPanel.tsx
- Ensure date keys match between AI and frontend (YYYY-MM-DD format)
- Check quarter/hour calculations are consistent

#### Issue: "Voice commands not working"
**Symptoms:**
- Microphone not activating
- Speech not recognized
- Voice commands not processed

**Diagnosis:**
```typescript
// Check browser support:
const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

// Check permissions:
navigator.permissions.query({name: 'microphone'}).then(result => {
  console.log('Microphone permission:', result.state);
});

// Check voice processing:
console.log('Voice command processing:', processVoiceCommand(transcript));
```

**Solutions:**
- Ensure HTTPS (required for microphone access)
- Check browser permissions for microphone
- Verify Web Speech API support (Chrome/Edge work best)
- Test voice command patterns in voiceCommands.ts

#### Issue: "Calendar UI broken or events not displaying"
**Symptoms:**
- Calendar days overflow
- Events not visible
- Expandable overlays not working

**Diagnosis:**
```typescript
// Check event data structure:
console.log('Day Events:', dayEvents);
console.log('Hour Events:', hourEvents);

// Check calendar date calculation:
console.log('Selected Date:', selectedDate);
console.log('Date Key:', selectedDate.toISOString().split('T')[0]);

// Check CSS constraints:
// Look for calendar day height restrictions and overflow settings
```

**Solutions:**
- Verify day cells have fixed height (120px) in SchedulerView.tsx
- Check expandable overlay positioning
- Ensure event arrays are properly filtered and limited
- Test calendar navigation and date selection

#### Issue: "Memory/context not working"
**Symptoms:**
- AI doesn't remember previous conversations
- No personalized responses
- Context not building over time

**Diagnosis:**
```typescript
// Check memory storage:
const memories = await prisma.memory.findMany({ where: { userId } });
console.log('User memories:', memories);

// Check conversation analysis:
console.log('Memory extraction enabled:', process.env.ENABLE_MEMORY_EXTRACTION);

// Check context retrieval:
const context = await getEnhancedContext(userId, message, sessionId);
console.log('Enhanced context:', context);
```

**Solutions:**
- Verify database connection and memory schema
- Check if conversation analysis is running
- Ensure user ID consistency across sessions
- Review memory relevance scoring and cleanup

### Performance Optimization

#### Memory Management
```typescript
// Cleanup localStorage periodically
function cleanupLocalStorage() {
  const keys = Object.keys(localStorage);
  const bakonKeys = keys.filter(key => key.startsWith('baekon-'));

  // Remove old data (>1 year)
  bakonKeys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      if (data.timestamp && Date.now() - data.timestamp > 365 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(key);
        console.log('Cleaned up old data:', key);
      }
    } catch (error) {
      console.warn('Error cleaning up storage:', error);
    }
  });
}
```

#### API Optimization
```typescript
// Batch operations when possible
async function batchCreateEvents(events: EventData[], userId: string) {
  const results = [];

  // Process in chunks of 5 to avoid rate limits
  for (let i = 0; i < events.length; i += 5) {
    const chunk = events.slice(i, i + 5);
    const chunkResults = await Promise.allSettled(
      chunk.map(event => executeAIFunction('create_event', event, userId))
    );
    results.push(...chunkResults);

    // Small delay between chunks
    if (i + 5 < events.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
```

### Debugging Tools

#### Debug Mode
```typescript
// Enable debug logging
const DEBUG_MODE = process.env.NODE_ENV === 'development';

function debugLog(category: string, data: any) {
  if (DEBUG_MODE) {
    console.group(`🔍 DEBUG: ${category}`);
    console.log(data);
    console.groupEnd();
  }
}

// Usage throughout the app
debugLog('Voice Command', { command, confidence, pattern });
debugLog('Event Creation', { input, parsed, storage });
debugLog('Memory Context', { memories, patterns, goals });
```

#### Health Checks
```typescript
// System health monitoring
async function systemHealthCheck(): Promise<HealthStatus> {
  const checks = {
    localStorage: checkLocalStorageAvailable(),
    apiConnection: await checkOpenAIConnection(),
    database: await checkDatabaseConnection(),
    voiceSupport: checkVoiceSupport(),
    memorySystem: await checkMemorySystem()
  };

  const issues = Object.entries(checks)
    .filter(([key, status]) => !status.healthy)
    .map(([key, status]) => ({ component: key, issue: status.error }));

  return {
    healthy: issues.length === 0,
    issues,
    timestamp: new Date().toISOString()
  };
}
```

### Recovery Procedures

#### Data Recovery
```typescript
// Recover from corrupted localStorage
function recoverLocalStorage() {
  const backupKeys = ['baekon-hour-events-backup', 'baekon-day-events-backup'];

  backupKeys.forEach(backupKey => {
    try {
      const backup = localStorage.getItem(backupKey);
      if (backup) {
        const mainKey = backupKey.replace('-backup', '');
        localStorage.setItem(mainKey, backup);
        console.log(`Recovered ${mainKey} from backup`);
      }
    } catch (error) {
      console.error('Recovery failed for', backupKey, error);
    }
  });
}

// Create automatic backups
function createStorageBackup() {
  try {
    const hourEvents = localStorage.getItem('baekon-hour-events');
    const dayEvents = localStorage.getItem('baekon-day-events');

    if (hourEvents) localStorage.setItem('baekon-hour-events-backup', hourEvents);
    if (dayEvents) localStorage.setItem('baekon-day-events-backup', dayEvents);
  } catch (error) {
    console.warn('Backup creation failed:', error);
  }
}
```

#### Reset Procedures
```typescript
// Complete system reset (last resort)
function resetBaekonSystem() {
  // Clear localStorage
  const keys = Object.keys(localStorage);
  keys.filter(key => key.startsWith('baekon-')).forEach(key => {
    localStorage.removeItem(key);
  });

  // Reset UI state
  window.location.reload();

  console.log('BÆKON system reset completed');
}

// Selective reset options
function resetBaekonComponent(component: 'events' | 'memory' | 'voice' | 'preferences') {
  switch (component) {
    case 'events':
      localStorage.removeItem('baekon-hour-events');
      localStorage.removeItem('baekon-day-events');
      break;
    case 'memory':
      // Clear conversation history
      Object.keys(localStorage)
        .filter(key => key.startsWith('baekon-chat-'))
        .forEach(key => localStorage.removeItem(key));
      break;
    case 'voice':
      Object.keys(localStorage)
        .filter(key => key.startsWith('voice-'))
        .forEach(key => localStorage.removeItem(key));
      break;
    case 'preferences':
      Object.keys(localStorage)
        .filter(key => key.startsWith('baekon-preferences-'))
        .forEach(key => localStorage.removeItem(key));
      break;
  }

  console.log(`Reset ${component} component`);
}
```

---

## Conclusion

This manual provides comprehensive guidance for AI agents operating within the BÆKON productivity system. The key to success is understanding that BÆKON is not just a scheduling app—it's a sophisticated life optimization interface that requires contextual, personalized, and proactive assistance.

### Final Reminders for AI Agents

1. **Think like Bokibo** - You're an operative interface, not a general chatbot
2. **Prioritize user agency** - Provide options and insights, don't just execute commands
3. **Build context continuously** - Every interaction should improve your understanding
4. **Handle errors gracefully** - Always provide fallbacks and clear explanations
5. **Respect privacy** - localStorage-first approach gives users control over their data

### Next Steps

- Test all function calling patterns with real user scenarios
- Validate voice command processing across different browsers
- Monitor memory system performance and relevance scoring
- Gather user feedback on AI personality and helpfulness
- Optimize for mobile and tablet interfaces

**Remember:** The ultimate measure of success is whether users feel more capable and less overwhelmed after interacting with the BÆKON system.

---

**End of Manual**
