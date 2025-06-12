// User preferences and conversation memory management

interface UserPreferences {
  name?: string;
  defaultView: 'planner' | 'calendar';
  timeFormat: '12h' | '24h';
  timezone: string;
  aiPersonality: 'friendly' | 'professional' | 'casual';
  reminderSettings: {
    dailyInsights: boolean;
    productivityTips: boolean;
    scheduleAlerts: boolean;
  };
  conversationMemory: {
    goals: string[];
    interests: string[];
    workPatterns: string[];
    achievements: string[];
    preferences: string[];
  };
  lastInteraction: string;
  totalInteractions: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultView: 'planner',
  timeFormat: '12h',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  aiPersonality: 'friendly',
  reminderSettings: {
    dailyInsights: true,
    productivityTips: true,
    scheduleAlerts: true,
  },
  conversationMemory: {
    goals: [],
    interests: [],
    workPatterns: [],
    achievements: [],
    preferences: [],
  },
  lastInteraction: new Date().toISOString(),
  totalInteractions: 0,
};

export function getUserPreferences(userId: string): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

  const stored = localStorage.getItem(`baekon-preferences-${userId}`);
  if (!stored) return DEFAULT_PREFERENCES;

  try {
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch (error) {
    console.warn('Failed to parse user preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(userId: string, preferences: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return;

  const current = getUserPreferences(userId);
  const updated = {
    ...current,
    ...preferences,
    lastInteraction: new Date().toISOString(),
    totalInteractions: current.totalInteractions + 1,
  };

  localStorage.setItem(`baekon-preferences-${userId}`, JSON.stringify(updated));
}

export function updateConversationMemory(
  userId: string,
  type: keyof UserPreferences['conversationMemory'],
  value: string
): void {
  const preferences = getUserPreferences(userId);
  const currentMemory = preferences.conversationMemory[type];

  // Avoid duplicates and limit memory size
  if (!currentMemory.includes(value)) {
    const updatedMemory = [...currentMemory, value];
    if (updatedMemory.length > 10) {
      updatedMemory.shift(); // Remove oldest entry
    }

    saveUserPreferences(userId, {
      conversationMemory: {
        ...preferences.conversationMemory,
        [type]: updatedMemory,
      },
    });
  }
}

export function getPersonalizedContext(userId: string): Record<string, unknown> {
  const preferences = getUserPreferences(userId);

  return {
    userName: preferences.name,
    personalityStyle: preferences.aiPersonality,
    conversationHistory: preferences.conversationMemory,
    totalSessions: preferences.totalInteractions,
    lastSeen: preferences.lastInteraction,
    preferences: {
      defaultView: preferences.defaultView,
      timeFormat: preferences.timeFormat,
      timezone: preferences.timezone,
    },
    reminderSettings: preferences.reminderSettings,
  };
}

// Extract insights from conversations to build memory
export function analyzeConversationForMemory(message: string, userId: string): void {
  const lowerMessage = message.toLowerCase();

  // Detect goals
  if (lowerMessage.includes('goal') || lowerMessage.includes('want to') || lowerMessage.includes('plan to')) {
    updateConversationMemory(userId, 'goals', message);
  }

  // Detect interests
  if (lowerMessage.includes('love') || lowerMessage.includes('enjoy') || lowerMessage.includes('interested in')) {
    updateConversationMemory(userId, 'interests', message);
  }

  // Detect work patterns
  if (lowerMessage.includes('usually') || lowerMessage.includes('always') || lowerMessage.includes('typically')) {
    updateConversationMemory(userId, 'workPatterns', message);
  }

  // Detect achievements
  if (lowerMessage.includes('completed') || lowerMessage.includes('finished') || lowerMessage.includes('accomplished')) {
    updateConversationMemory(userId, 'achievements', message);
  }

  // Detect preferences
  if (lowerMessage.includes('prefer') || lowerMessage.includes('like to') || lowerMessage.includes('better')) {
    updateConversationMemory(userId, 'preferences', message);
  }
}
