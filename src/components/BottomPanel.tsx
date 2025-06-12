"use client";

import { useState, useRef } from "react";
import { getPersonalizedContext, analyzeConversationForMemory } from "@/utils/userPreferences";
import ActivityHistoryPanel from "./ActivityHistoryPanel";
import VoiceCommandInterface from "./VoiceCommandInterface";
import { processVoiceCommand, enhanceVoiceCommand } from "@/lib/voiceCommands";

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

interface BottomPanelProps {
  messages: Message[];
  sendMessage: (message: string, context?: any) => Promise<string | null>;
  loading: boolean;
  userId: string;
  // AI context and event management
  aiContext?: any;
  hourEvents?: { [key: string]: string[] };
  setHourEvents?: (events: { [key: string]: string[] } | ((prev: { [key: string]: string[] }) => { [key: string]: string[] })) => void;
  dayEvents?: { [key: string]: string[] };
  setDayEvents?: (events: { [key: string]: string[] } | ((prev: { [key: string]: string[] }) => { [key: string]: string[] })) => void;
  currentWeekDates?: Date[];
  // For activity history
  activeSection?: string;
  schedView?: string;
}

export default function BottomPanel({
  messages,
  sendMessage,
  loading,
  userId,
  aiContext,
  hourEvents,
  setHourEvents,
  dayEvents,
  setDayEvents,
  currentWeekDates,
  activeSection,
  schedView
}: BottomPanelProps) {
  const [chatInput, setChatInput] = useState("");
  const [showChatLog, setShowChatLog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse natural language for event creation
  const parseEventFromMessage = (message: string) => {
    const lowerMessage = message.toLowerCase();

    // Enhanced patterns for better date/time parsing including longer timeframes
    const patterns = [
      // "in [number] [months/weeks/days]" - e.g., "in 3 months", "in 2 weeks"
      /(.+?)\s+in\s+(\d+)\s+(months?|weeks?|days?)\s*(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|noon)?)?/i,
      // "next [month]" - e.g., "next January", "next month"
      /(.+?)\s+(?:next\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|month)\s*(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|noon)?)?/i,
      // Standard day patterns
      /schedule\s+(.+?)\s+(?:on\s+|for\s+)?(this\s+)?(?:coming\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|tomorrow|today|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2})\s*(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|noon)?)/i,
      /(.+?)\s+(this\s+|coming\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|tomorrow|today)\s*(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|noon)?)/i,
      /add\s+(.+?)\s+(?:for\s+|on\s+)?(this\s+)?(?:coming\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|tomorrow|today|\d{1,2}\/\d{1,2}|\d{1,2}-\d{2})\s*(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|noon)?)/i,
      // Holidays
      /(.*?)(?:father'?s\s+day|mother'?s\s+day|christmas|thanksgiving|easter|new\s+year|birthday)(?:\s+party|\s+celebration)?\s*(?:this\s+|coming\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)?\s*(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|noon)?)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return {
          isEvent: true,
          title: match[1]?.trim() || 'Event',
          dateContext: match[2] || match[3] || null, // "this", "coming"
          day: match[2] || match[3] || match[4] || null, // day/month/timeframe
          time: match[3] || match[4] || match[5] || null, // time
          rawMessage: message,
          needsAIDateParsing: true
        };
      }
    }

    // Simple check for scheduling intent - let AI handle complex parsing
    if (lowerMessage.includes('schedule') || lowerMessage.includes('add event') || lowerMessage.includes('reminder') ||
        lowerMessage.includes('party') || lowerMessage.includes('meeting') || lowerMessage.includes('appointment')) {
      return {
        isEvent: true,
        title: message,
        time: null,
        rawMessage: message,
        needsAIDateParsing: true
      };
    }

    return null;
  };

  // Add event to schedule
  const addEventToSchedule = (eventTitle: string, dateStr?: string, hour?: number, quarter?: number) => {
    if (!setHourEvents || !setDayEvents) return;

    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    if (hour !== undefined && quarter !== undefined) {
      // Add to specific hour slot
      const hourKey = `${targetDate}-${quarter}-${hour}`;
      setHourEvents(prev => ({
        ...prev,
        [hourKey]: [...(prev[hourKey] || []), eventTitle]
      }));
    } else {
      // Add to day events
      setDayEvents(prev => ({
        ...prev,
        [targetDate]: [...(prev[targetDate] || []), eventTitle]
      }));
    }
  };

  const [showActivityHistory, setShowActivityHistory] = useState(false);

  // Handle voice commands
  const handleVoiceCommand = async (command: string) => {
    console.log('Voice command received:', command);

    if (command.trim() && !loading) {
      // Process voice command for recognition and enhancement
      const voiceProcessing = processVoiceCommand(command);
      const enhancedCommand = enhanceVoiceCommand(command);

      console.log('Voice processing result:', voiceProcessing);

      // Set the chat input to show the enhanced command
      setChatInput(enhancedCommand);

      // Process the voice command directly
      setTimeout(async () => {
        // Reset input after showing the command
        setChatInput("");

        // Analyze message for conversation memory
        analyzeConversationForMemory(enhancedCommand, userId);

        // Check if this is an event creation request
        const eventParsing = parseEventFromMessage(enhancedCommand);

        // Get personalized context with conversation memory
        const personalizedContext = getPersonalizedContext(userId);

        // Enhanced context with conversation memory and event parsing
        const enhancedContext = {
          ...aiContext,
          ...personalizedContext,
          recentMessages: messages.slice(-5),
          currentTime: new Date().toISOString(),
          messageCount: messages.length,
          isVoiceCommand: true,
          voiceCommandRecognized: voiceProcessing.recognized,
          voiceCommandCategory: voiceProcessing.command?.category,
          voiceCommandAction: voiceProcessing.command?.action,
          eventParsing,
          capabilities: {
            canCreateEvents: true,
            canAnalyzePatterns: true,
            canProvideInsights: true,
            hasScheduleAccess: true
          }
        };

        // Send message to AI with rich context and messages history
        const result = await sendMessage(enhancedCommand, enhancedContext);
        const response = result.response;

        // Handle AI event creation
        if (result.eventData?.storageInfo) {
          const { title, storageInfo } = result.eventData;

          if (storageInfo.type === 'hour') {
            setHourEvents(prev => ({
              ...prev,
              [storageInfo.key]: [...(prev[storageInfo.key] || []), title]
            }));
          } else {
            setDayEvents(prev => ({
              ...prev,
              [storageInfo.key]: [...(prev[storageInfo.key] || []), title]
            }));
          }

          console.log(`AI event "${title}" added to ${storageInfo.type} storage for ${storageInfo.dateKey}!`);
        }

        // Handle event creation logic (same as text input)
        else if (eventParsing?.isEvent || (response && (response.includes('scheduled') || response.includes('added') || response.includes('created')))) {
          let eventTitle = eventParsing?.title || command;

          // Clean up the title if it's too long
          if (eventTitle.length > 50) {
            eventTitle = eventTitle.substring(0, 47) + '...';
          }

          // Calculate target date based on parsed information (FULL LOGIC)
          let targetDate = new Date().toISOString().split('T')[0]; // Default to today

          if (eventParsing?.day) {
            const today = new Date();
            const dayStr = eventParsing.day.toLowerCase();

            // Handle "in X months/weeks/days"
            if (eventParsing.dateContext && /in\s+\d+\s+(months?|weeks?|days?)/.test(eventParsing.rawMessage)) {
              const match = eventParsing.rawMessage.match(/in\s+(\d+)\s+(months?|weeks?|days?)/i);
              if (match) {
                const amount = Number.parseInt(match[1]);
                const unit = match[2].toLowerCase();
                const targetDateObj = new Date(today);

                if (unit.includes('month')) {
                  targetDateObj.setMonth(targetDateObj.getMonth() + amount);
                } else if (unit.includes('week')) {
                  targetDateObj.setDate(targetDateObj.getDate() + (amount * 7));
                } else if (unit.includes('day')) {
                  targetDateObj.setDate(targetDateObj.getDate() + amount);
                }

                targetDate = targetDateObj.toISOString().split('T')[0];
              }
            }
            // Handle "next [month]"
            else if (dayStr === 'month' || ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].includes(dayStr)) {
              const targetDateObj = new Date(today);

              if (dayStr === 'month') {
                targetDateObj.setMonth(targetDateObj.getMonth() + 1);
              } else {
                const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                const targetMonth = months.indexOf(dayStr);
                if (targetMonth !== -1) {
                  targetDateObj.setMonth(targetMonth);
                  // If the month has passed this year, go to next year
                  if (targetMonth <= today.getMonth()) {
                    targetDateObj.setFullYear(targetDateObj.getFullYear() + 1);
                  }
                }
              }

              targetDate = targetDateObj.toISOString().split('T')[0];
            }
            // Handle standard day parsing
            else if (dayStr === 'tomorrow') {
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              targetDate = tomorrow.toISOString().split('T')[0];
            } else if (dayStr === 'today') {
              targetDate = today.toISOString().split('T')[0];
            } else {
              // Handle day names (sunday, monday, etc.)
              const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
              const targetDayIndex = dayNames.indexOf(dayStr);

              if (targetDayIndex !== -1) {
                const currentDayIndex = today.getDay();
                let daysToAdd = targetDayIndex - currentDayIndex;

                // If the day has already passed this week, go to next week
                if (daysToAdd <= 0 || (eventParsing?.dateContext?.includes('coming') || eventParsing?.dateContext?.includes('next'))) {
                  daysToAdd += 7;
                }

                const targetDateObj = new Date(today);
                targetDateObj.setDate(today.getDate() + daysToAdd);
                targetDate = targetDateObj.toISOString().split('T')[0];
              }
            }
          }

          // Try to determine which time slot to use
          let quarter = 0; // Default to morning (9AM-3PM)
          let hour = 0; // Default to first hour of quarter

          if (eventParsing?.time) {
            const timeStr = eventParsing.time.toLowerCase();
            if (timeStr.includes('pm') || timeStr.includes('evening') || timeStr.includes('night')) {
              quarter = 1; // 3PM-9PM
            } else if (timeStr.includes('morning') || timeStr.includes('am')) {
              quarter = 0; // 9AM-3PM
            }

            // Extract hour number
            const hourMatch = timeStr.match(/(\d{1,2})/);
            if (hourMatch) {
              const parsedHour = Number.parseInt(hourMatch[1]);
              if (parsedHour >= 1 && parsedHour <= 6) {
                hour = parsedHour - 1; // Convert to 0-5 index
              }
            }
          }

          // Add to schedule
          console.log('Voice event parsing details:', {
            originalCommand: command,
            eventParsing,
            eventTitle,
            targetDate,
            quarter,
            hour,
            calculatedDay: eventParsing?.day,
            dateContext: eventParsing?.dateContext
          });
          addEventToSchedule(eventTitle, targetDate, hour, quarter);

          // Show confirmation
          console.log(`Voice event "${eventTitle}" added to schedule for ${targetDate}!`);
        }

        // Provide voice command feedback if not recognized
        if (!voiceProcessing.recognized && voiceProcessing.suggestion) {
          console.log('Voice command suggestion:', voiceProcessing.suggestion);
          // Could show a toast or hint to the user
        }
      }, 800);
    }
  };

  const controlButtons = [
    { id: 'profile', label: 'PROFILE', color: 'neon-purple' },
    {
      id: 'history',
      label: 'HISTORY',
      color: 'neon-blue',
      action: () => {
        console.log('History button clicked, current state:', showActivityHistory);
        setShowActivityHistory(!showActivityHistory);
      }
    },
    { id: 'settings', label: 'SETTINGS', color: 'neon-green' },
    { id: 'theme', label: 'THEME', color: 'neon-pink' },
    { id: 'mode', label: 'MODE', color: 'neon-aqua' },
    { id: 'files', label: 'FILES', color: 'neon-purple', action: () => fileInputRef.current?.click() },
  ];

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && !loading) {
      const message = chatInput.trim();
      setChatInput("");

      // Analyze message for conversation memory
      analyzeConversationForMemory(message, userId);

      // Check if this is an event creation request
      const eventParsing = parseEventFromMessage(message);

      // Get personalized context with conversation memory
      const personalizedContext = getPersonalizedContext(userId);

      // Enhanced context with conversation memory and event parsing
      const enhancedContext = {
        ...aiContext,
        ...personalizedContext,
        recentMessages: messages.slice(-5), // Last 5 messages for continuity
        currentTime: new Date().toISOString(),
        messageCount: messages.length,

        eventParsing,
        capabilities: {
          canCreateEvents: true,
          canAnalyzePatterns: true,
          canProvideInsights: true,
          hasScheduleAccess: true
        }
      };

      // Send message to AI with rich context and messages history
      const result = await sendMessage(message, enhancedContext);
      const response = result.response;

      // Handle AI event creation first
      if (result.eventData?.storageInfo) {
        const { title, storageInfo } = result.eventData;

        if (storageInfo.type === 'hour') {
          setHourEvents(prev => ({
            ...prev,
            [storageInfo.key]: [...(prev[storageInfo.key] || []), title]
          }));
        } else {
          setDayEvents(prev => ({
            ...prev,
            [storageInfo.key]: [...(prev[storageInfo.key] || []), title]
          }));
        }

        console.log(`AI event "${title}" added to ${storageInfo.type} storage for ${storageInfo.dateKey}!`);
      }
      // Enhanced event creation logic (fallback for manual parsing)
      else if (eventParsing?.isEvent || (response && (response.includes('scheduled') || response.includes('added') || response.includes('created')))) {
        let eventTitle = eventParsing?.title || message;

        // Clean up the title if it's too long
        if (eventTitle.length > 50) {
          eventTitle = eventTitle.substring(0, 47) + '...';
        }

        // Calculate target date based on parsed information
        let targetDate = new Date().toISOString().split('T')[0]; // Default to today

        if (eventParsing?.day) {
          const today = new Date();
          const dayStr = eventParsing.day.toLowerCase();

          // Handle "in X months/weeks/days"
          if (eventParsing.dateContext && /in\s+\d+\s+(months?|weeks?|days?)/.test(eventParsing.rawMessage)) {
            const match = eventParsing.rawMessage.match(/in\s+(\d+)\s+(months?|weeks?|days?)/i);
            if (match) {
              const amount = Number.parseInt(match[1]);
              const unit = match[2].toLowerCase();
              const targetDateObj = new Date(today);

              if (unit.includes('month')) {
                targetDateObj.setMonth(targetDateObj.getMonth() + amount);
              } else if (unit.includes('week')) {
                targetDateObj.setDate(targetDateObj.getDate() + (amount * 7));
              } else if (unit.includes('day')) {
                targetDateObj.setDate(targetDateObj.getDate() + amount);
              }

              targetDate = targetDateObj.toISOString().split('T')[0];
            }
          }
          // Handle "next [month]"
          else if (dayStr === 'month' || ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].includes(dayStr)) {
            const targetDateObj = new Date(today);

            if (dayStr === 'month') {
              targetDateObj.setMonth(targetDateObj.getMonth() + 1);
            } else {
              const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
              const targetMonth = months.indexOf(dayStr);
              if (targetMonth !== -1) {
                targetDateObj.setMonth(targetMonth);
                // If the month has passed this year, go to next year
                if (targetMonth <= today.getMonth()) {
                  targetDateObj.setFullYear(targetDateObj.getFullYear() + 1);
                }
              }
            }

            targetDate = targetDateObj.toISOString().split('T')[0];
          }
          // Handle standard day parsing
          else if (dayStr === 'tomorrow') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            targetDate = tomorrow.toISOString().split('T')[0];
          } else if (dayStr === 'today') {
            targetDate = today.toISOString().split('T')[0];
          } else {
            // Handle day names (sunday, monday, etc.)
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const targetDayIndex = dayNames.indexOf(dayStr);

            if (targetDayIndex !== -1) {
              const currentDayIndex = today.getDay();
              let daysToAdd = targetDayIndex - currentDayIndex;

              // If the day has already passed this week, go to next week
              if (daysToAdd <= 0 || (eventParsing?.dateContext?.includes('coming') || eventParsing?.dateContext?.includes('next'))) {
                daysToAdd += 7;
              }

              const targetDateObj = new Date(today);
              targetDateObj.setDate(today.getDate() + daysToAdd);
              targetDate = targetDateObj.toISOString().split('T')[0];
            }
          }
        }

        // Try to determine which time slot to use
        let quarter = 0; // Default to morning (9AM-3PM)
        let hour = 0; // Default to first hour of quarter

        if (eventParsing?.time) {
          const timeStr = eventParsing.time.toLowerCase();
          if (timeStr.includes('pm') || timeStr.includes('evening') || timeStr.includes('night')) {
            quarter = 1; // 3PM-9PM
          } else if (timeStr.includes('morning') || timeStr.includes('am')) {
            quarter = 0; // 9AM-3PM
          }

          // Extract hour number
          const hourMatch = timeStr.match(/(\d{1,2})/);
          if (hourMatch) {
            const parsedHour = Number.parseInt(hourMatch[1]);
            if (parsedHour >= 1 && parsedHour <= 6) {
              hour = parsedHour - 1; // Convert to 0-5 index
            }
          }
        }

        // Add to schedule
        console.log('Event parsing details:', {
          originalMessage: message,
          eventParsing,
          eventTitle,
          targetDate,
          quarter,
          hour,
          calculatedDay: eventParsing?.day,
          dateContext: eventParsing?.dateContext
        });
        addEventToSchedule(eventTitle, targetDate, hour, quarter);

        // Show confirmation
        console.log(`Event "${eventTitle}" added to schedule!`);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('File uploaded:', result);
        // Could send a message about the uploaded file
        await sendMessage(`I uploaded a file: ${file.name}`, aiContext);
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };



  return (
    <div className="h-full w-full p-4 flex flex-col">
      {/* Chat Log (when visible) */}
      {showChatLog && (
        <div className="flex-1 mb-4 bg-gray-900/50 rounded-lg p-3 max-h-32 overflow-y-auto">
          <div className="space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <div className="text-blue-400 font-medium">
                  You: {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-gray-400 italic">BÆKON is thinking...</div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4">
        {/* Control Buttons */}
        <div className="flex space-x-2">
          {controlButtons.map((button) => (
            <button
              key={button.id}
              onClick={button.action}
              className={`px-3 py-2 text-xs font-red-hat font-semibold rounded border transition-all duration-200 ${
                button.id === 'history' && showActivityHistory
                  ? 'border-neon-green text-neon-green bg-neon-green/20'
                  : `border-gray-600 text-gray-400 hover:border-${button.color} hover:text-${button.color}`
              } ${uploading && button.id === 'files' ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={uploading && button.id === 'files'}
            >
              {uploading && button.id === 'files' ? 'UPLOADING...' : button.label}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleChatSubmit} className="flex-1 flex items-center space-x-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Try: 'Schedule gym tomorrow at 7am' or ask for productivity insights..."
            disabled={loading}
            className="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-neon-aqua focus:shadow-neon-aqua transition-all duration-200"
          />

          <button
            type="submit"
            disabled={loading || !chatInput.trim()}
            className="px-4 py-2 bg-neon-aqua/20 border border-neon-aqua text-neon-aqua rounded-lg hover:bg-neon-aqua/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'SENDING...' : 'SEND'}
          </button>

          <VoiceCommandInterface
            onCommand={handleVoiceCommand}
            disabled={loading}
            userId={userId}
          />
        </form>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="*/*"
        />
      </div>

      {/* Activity History Overlay */}
      {showActivityHistory && (
        <div
          className={`fixed bg-gray-800/98 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl flex flex-col transition-all duration-300 ease-out transform ${
            showActivityHistory ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
          }`}
          style={{
            bottom: '160px',
            left: '50%',
            transform: showActivityHistory ? 'translateX(-50%) scaleY(1)' : 'translateX(-50%) scaleY(0)',
            width: '600px',
            height: '450px',
            zIndex: 10000,
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(34, 197, 94, 0.3)',
            transformOrigin: 'bottom'
          }}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-600 bg-gray-800/90 rounded-t-lg">
            <h3 className="text-neon-green font-semibold font-cal-sans text-sm">Activity History</h3>
            <button
              onClick={() => setShowActivityHistory(false)}
              className="text-gray-400 hover:text-white transition-colors text-lg w-6 h-6 flex items-center justify-center hover:bg-gray-700 rounded"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <ActivityHistoryPanel
              messages={messages}
              currentSection={activeSection}
              currentView={schedView}
            />
          </div>
        </div>
      )}
    </div>
  );
}
