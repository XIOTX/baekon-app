export interface VoiceCommand {
  patterns: RegExp[];
  action: string;
  category: 'schedule' | 'query' | 'note' | 'navigation' | 'control';
  description: string;
  examples: string[];
}

export const VOICE_COMMANDS: VoiceCommand[] = [
  // Schedule Management
  {
    patterns: [
      /^(schedule|add|create) (.*?) (tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /^(book|set up|plan) (.*?) (at|for) (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      /^(reminder|remind me) (.*?) (in|at) (.*)/i
    ],
    action: 'schedule_event',
    category: 'schedule',
    description: 'Schedule events, meetings, or activities',
    examples: [
      "Schedule gym tomorrow at 7am",
      "Add team meeting Friday at 2pm",
      "Remind me about dentist appointment"
    ]
  },

  // Time Blocking
  {
    patterns: [
      /^(block|reserve|hold) (\d+) (minutes?|hours?) (for|to) (.*)/i,
      /^(focus time|deep work|concentration) (for|lasting) (\d+) (minutes?|hours?)/i,
      /^(break|lunch|rest) (for|lasting) (\d+) (minutes?|hours?)/i
    ],
    action: 'block_time',
    category: 'schedule',
    description: 'Block time for focused work or activities',
    examples: [
      "Block 2 hours for deep work",
      "Focus time for 90 minutes",
      "Break for 15 minutes"
    ]
  },

  // Schedule Queries
  {
    patterns: [
      /^(what's|show me|tell me) (my|the) (schedule|agenda|calendar) (today|tomorrow|this week|next week)/i,
      /^(what do I have|what's scheduled) (today|tomorrow|this week)/i,
      /^(am I|do I have anything) (free|available) (today|tomorrow|this afternoon)/i,
      /^(when is|what time) (my|the) (.*?) (meeting|appointment|event)/i
    ],
    action: 'query_schedule',
    category: 'query',
    description: 'Ask about your schedule and availability',
    examples: [
      "What's my schedule today?",
      "Am I free this afternoon?",
      "When is my next meeting?"
    ]
  },

  // Note Taking
  {
    patterns: [
      /^(create|add|make|write) (a )?note (about|for|on) (.*)/i,
      /^(note|remember|write down) (that )?(.+)/i,
      /^(add to|update) (work|life|personal) (notes?) (.+)/i
    ],
    action: 'create_note',
    category: 'note',
    description: 'Create and manage notes',
    examples: [
      "Create a note about project ideas",
      "Note that we need to order supplies",
      "Add to work notes: team feedback"
    ]
  },

  // Productivity Insights
  {
    patterns: [
      /^(analyze|review|show) (my|the) (productivity|patterns|schedule analysis)/i,
      /^(how am I doing|what's my productivity|give me insights)/i,
      /^(suggest|recommend|find) (better|optimal) (time|slot) (for|to) (.+)/i
    ],
    action: 'analyze_productivity',
    category: 'query',
    description: 'Get productivity insights and recommendations',
    examples: [
      "Analyze my productivity patterns",
      "Suggest optimal time for meetings",
      "How am I doing this week?"
    ]
  },

  // Quick Actions
  {
    patterns: [
      /^(clear|delete|remove) (today's|tomorrow's|this week's) (schedule|events)/i,
      /^(move|reschedule|change) (.+?) (to|for) (.+)/i,
      /^(cancel|delete|remove) (.+?) (meeting|event|appointment)/i
    ],
    action: 'modify_schedule',
    category: 'schedule',
    description: 'Modify or cancel scheduled items',
    examples: [
      "Cancel gym session tomorrow",
      "Move team meeting to Friday",
      "Clear today's schedule"
    ]
  },

  // Navigation Commands
  {
    patterns: [
      /^(go to|show|open) (schedule|calendar|planner)/i,
      /^(switch to|show me) (work|life|personal) (section|view)/i,
      /^(show|display) (this|next) (week|month)/i
    ],
    action: 'navigate',
    category: 'navigation',
    description: 'Navigate between different views and sections',
    examples: [
      "Go to calendar view",
      "Switch to work section",
      "Show next week"
    ]
  },

  // General Help and Control
  {
    patterns: [
      /^(help|what can you do|show commands)/i,
      /^(stop|cancel|never mind)/i,
      /^(repeat|say that again|what did you say)/i
    ],
    action: 'help_control',
    category: 'control',
    description: 'Get help or control the voice interface',
    examples: [
      "Help me with voice commands",
      "What can you do?",
      "Stop listening"
    ]
  }
];

export function processVoiceCommand(transcript: string): {
  recognized: boolean;
  command?: VoiceCommand;
  matches?: RegExpMatchArray;
  suggestion?: string;
  confidence?: number;
  corrections?: string[];
} {
  const normalizedTranscript = transcript.trim().toLowerCase();

  // Try to match against known patterns with confidence scoring
  let bestMatch: {
    command: VoiceCommand;
    matches: RegExpMatchArray;
    confidence: number;
  } | null = null;

  for (const command of VOICE_COMMANDS) {
    for (const pattern of command.patterns) {
      const matches = transcript.match(pattern);
      if (matches) {
        // Calculate confidence based on match quality
        const confidence = calculateConfidence(transcript, matches, command);

        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { command, matches, confidence };
        }
      }
    }
  }

  if (bestMatch && bestMatch.confidence > 0.7) {
    return {
      recognized: true,
      command: bestMatch.command,
      matches: bestMatch.matches,
      confidence: bestMatch.confidence
    };
  }

  // If no good match, try fuzzy matching and corrections
  const { suggestion, corrections, confidence } = findSimilarCommandWithCorrections(normalizedTranscript);

  return {
    recognized: false,
    suggestion,
    corrections,
    confidence
  };
}

function calculateConfidence(transcript: string, matches: RegExpMatchArray, command: VoiceCommand): number {
  let confidence = 0.8; // Base confidence for pattern match

  // Boost confidence for longer, more specific matches
  const matchLength = matches[0].length;
  const transcriptLength = transcript.length;
  const coverageRatio = matchLength / transcriptLength;
  confidence += coverageRatio * 0.2;

  // Boost confidence for common commands
  const commonKeywords = ['schedule', 'add', 'create', 'what', 'show', 'tell'];
  const hasCommonKeywords = commonKeywords.some(keyword =>
    transcript.toLowerCase().includes(keyword)
  );
  if (hasCommonKeywords) confidence += 0.1;

  // Penalize if the match is too short relative to transcript
  if (coverageRatio < 0.5) confidence -= 0.2;

  return Math.min(Math.max(confidence, 0), 1);
}

function findSimilarCommandWithCorrections(transcript: string): {
  suggestion?: string;
  corrections?: string[];
  confidence: number;
} {
  const keywords = transcript.split(' ');
  const corrections: string[] = [];
  let confidence = 0;

  // Common scheduling keywords
  if (keywords.some(word => ['schedule', 'add', 'create', 'book', 'plan'].includes(word))) {
    const suggestions = [
      "Schedule [event] tomorrow at [time]",
      "Add [meeting] on [day]",
      "Create reminder for [task]"
    ];
    corrections.push(...suggestions);
    confidence = 0.6;
  }

  // Query keywords
  else if (keywords.some(word => ['what', 'show', 'tell', 'when', 'where'].includes(word))) {
    const suggestions = [
      "What's my schedule today?",
      "Show me this week's calendar",
      "When is my next meeting?"
    ];
    corrections.push(...suggestions);
    confidence = 0.6;
  }

  // Note keywords
  else if (keywords.some(word => ['note', 'remember', 'write', 'save'].includes(word))) {
    const suggestions = [
      "Create a note about [topic]",
      "Note that [information]",
      "Remember to [task]"
    ];
    corrections.push(...suggestions);
    confidence = 0.6;
  }

  // Time blocking keywords
  else if (keywords.some(word => ['block', 'focus', 'reserve', 'hold'].includes(word))) {
    const suggestions = [
      "Block 2 hours for deep work",
      "Focus time for 90 minutes",
      "Reserve time for [activity]"
    ];
    corrections.push(...suggestions);
    confidence = 0.6;
  }

  // Fuzzy string matching for typos/misheard words
  const fuzzyMatches = findFuzzyMatches(transcript);
  if (fuzzyMatches.length > 0) {
    corrections.push(...fuzzyMatches);
    confidence = Math.max(confidence, 0.4);
  }

  const suggestion = corrections.length > 0
    ? `Try one of these: ${corrections.slice(0, 3).join(', ')}`
    : "Try saying 'Help' to see available voice commands";

  return {
    suggestion,
    corrections: corrections.slice(0, 5),
    confidence
  };
}

function findFuzzyMatches(transcript: string): string[] {
  const commonCommands = [
    "schedule gym tomorrow",
    "what's my schedule today",
    "create a note about",
    "block time for work",
    "show me this week",
    "add meeting with",
    "remind me to",
    "cancel my appointment"
  ];

  const matches: Array<{ command: string; similarity: number }> = [];

  for (const command of commonCommands) {
    const similarity = calculateStringSimilarity(transcript.toLowerCase(), command);
    if (similarity > 0.6) {
      matches.push({ command, similarity });
    }
  }

  return matches
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3)
    .map(match => match.command);
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}

function findSimilarCommand(transcript: string): string | undefined {
  const keywords = transcript.split(' ');

  // Common scheduling keywords
  if (keywords.some(word => ['schedule', 'add', 'create', 'book', 'plan'].includes(word))) {
    return "Try: 'Schedule [event] tomorrow at [time]' or 'Add [meeting] on [day]'";
  }

  // Query keywords
  if (keywords.some(word => ['what', 'show', 'tell', 'when', 'where'].includes(word))) {
    return "Try: 'What's my schedule today?' or 'When is my next meeting?'";
  }

  // Note keywords
  if (keywords.some(word => ['note', 'remember', 'write', 'save'].includes(word))) {
    return "Try: 'Create a note about [topic]' or 'Note that [information]'";
  }

  // Time blocking keywords
  if (keywords.some(word => ['block', 'focus', 'reserve', 'hold'].includes(word))) {
    return "Try: 'Block 2 hours for deep work' or 'Focus time for 90 minutes'";
  }

  return "Try saying 'Help' to see available voice commands";
}

export function getVoiceCommandHelp(): string[] {
  return [
    "🗓️ **Schedule**: 'Schedule gym tomorrow at 7am'",
    "⏰ **Time Block**: 'Block 2 hours for deep work'",
    "❓ **Query**: 'What's my schedule today?'",
    "📝 **Notes**: 'Create a note about project ideas'",
    "📊 **Insights**: 'Analyze my productivity patterns'",
    "🎯 **Navigation**: 'Go to calendar view'",
    "❓ **Help**: 'What can you do?' or 'Help'"
  ];
}

export function enhanceVoiceCommand(transcript: string): string {
  const processed = processVoiceCommand(transcript);

  if (processed.recognized && processed.command) {
    // Add contextual enhancements based on command type
    switch (processed.command.action) {
      case 'schedule_event':
        return `Please ${transcript}. Make sure to confirm the exact date and time.`;
      case 'block_time':
        return `${transcript}. Block this time in my schedule and prevent other bookings.`;
      case 'query_schedule':
        return `${transcript}. Please provide a clear summary of events and times.`;
      case 'create_note':
        return `${transcript}. Organize this information appropriately in my notes.`;
      case 'analyze_productivity':
        return `${transcript}. Provide actionable insights and specific recommendations.`;
      default:
        return transcript;
    }
  }

  return transcript;
}
