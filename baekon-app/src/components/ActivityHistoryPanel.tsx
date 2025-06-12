"use client";

import { useState, useEffect, useRef } from "react";

interface ActivityEntry {
  id: string;
  timestamp: Date;
  type: 'event_created' | 'event_modified' | 'event_deleted' | 'ai_chat' | 'voice_input' | 'view_changed' | 'manual_input' | 'file_upload';
  source: 'user' | 'ai' | 'system';
  description: string;
  details?: any;
}

interface ActivityHistoryPanelProps {
  messages: any[];
  currentSection?: string;
  currentView?: string;
}

export default function ActivityHistoryPanel({
  messages,
  currentSection,
  currentView
}: ActivityHistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ActivityEntry | null>(null);
  const activityEndRef = useRef<HTMLDivElement>(null);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Generate activity entries from various sources
  useEffect(() => {
    const newActivities: ActivityEntry[] = [];

    // Add chat activities with better descriptions
    messages.forEach((message, index) => {
      if (message.type === 'user') {
        // Detect different types of user messages
        const content = message.content.toLowerCase();
        let description = 'User sent message to AI';
        let activityType: ActivityEntry['type'] = 'ai_chat';

        if (content.includes('schedule') || content.includes('add event')) {
          description = 'User requested event creation';
          activityType = 'event_created';
        } else if (content.includes('upload') || content.includes('file')) {
          description = 'User mentioned file activity';
          activityType = 'file_upload';
        } else if (content.includes('voice') || content.includes('recording')) {
          description = 'User used voice input';
          activityType = 'voice_input';
        }

        newActivities.push({
          id: `chat-user-${message.id}`,
          timestamp: message.timestamp,
          type: activityType,
          source: 'user',
          description,
          details: {
            content: message.content,
            messageIndex: index + 1,
            totalMessages: messages.length
          }
        });
      } else {
        // Analyze AI responses for better context
        const content = message.content.toLowerCase();
        let description = 'AI provided response';

        if (content.includes('scheduled') || content.includes('added') || content.includes('created')) {
          description = 'AI created/scheduled event';
        } else if (content.includes('insight') || content.includes('pattern') || content.includes('recommend')) {
          description = 'AI provided productivity insights';
        } else if (content.includes('error') || content.includes('sorry')) {
          description = 'AI encountered an issue';
        }

        newActivities.push({
          id: `chat-ai-${message.id}`,
          timestamp: message.timestamp,
          type: 'ai_chat',
          source: 'ai',
          description,
          details: {
            content: message.content,
            responseLength: message.content.length,
            messageIndex: index + 1
          }
        });
      }
    });

    // Add session start activity
    if (messages.length > 0) {
      newActivities.push({
        id: `session-start-${Date.now()}`,
        timestamp: new Date(Date.now() - (messages.length * 30000)), // Estimate session start
        type: 'view_changed',
        source: 'system',
        description: 'User session started',
        details: {
          totalMessages: messages.length,
          sessionDuration: `~${Math.round(messages.length * 0.5)} minutes`
        }
      });
    }

    // Add current context activities (only when they actually change)
    const currentTime = new Date();
    if (currentSection) {
      newActivities.push({
        id: `section-${currentSection}-${currentTime.getTime()}`,
        timestamp: currentTime,
        type: 'view_changed',
        source: 'user',
        description: `Viewing ${currentSection.toUpperCase()} section`,
        details: {
          section: currentSection,
          previousSections: ['sched', 'work', 'life'].filter(s => s !== currentSection)
        }
      });
    }

    if (currentView) {
      newActivities.push({
        id: `view-${currentView}-${currentTime.getTime()}`,
        timestamp: currentTime,
        type: 'view_changed',
        source: 'user',
        description: `Using ${currentView} view`,
        details: {
          view: currentView,
          availableViews: ['planner', 'calendar']
        }
      });
    }

    // Add app launch activity
    newActivities.push({
      id: `app-launch-${Date.now()}`,
      timestamp: new Date(Date.now() - 60000), // 1 minute ago
      type: 'view_changed',
      source: 'system',
      description: 'BÆKON app launched',
      details: {
        platform: 'Web',
        timestamp: new Date().toISOString()
      }
    });

    // Sort by timestamp (newest first)
    newActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setActivities(newActivities.slice(0, 50)); // Keep last 50 activities
  }, [messages, currentSection, currentView]);

  // Auto-scroll to bottom when activities change and modal is open
  useEffect(() => {
    if (isExpanded && activityEndRef.current) {
      activityEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activities, isExpanded]);

  const getActivityIcon = (type: ActivityEntry['type']) => {
    switch (type) {
      case 'event_created': return '➕';
      case 'event_modified': return '✏️';
      case 'event_deleted': return '🗑️';
      case 'ai_chat': return '💬';
      case 'voice_input': return '🎤';
      case 'view_changed': return '👁️';
      case 'manual_input': return '⌨️';
      case 'file_upload': return '📎';
      default: return '📝';
    }
  };

  const getSourceColor = (source: ActivityEntry['source']) => {
    switch (source) {
      case 'user': return 'text-neon-blue';
      case 'ai': return 'text-neon-purple';
      case 'system': return 'text-neon-green';
      default: return 'text-gray-400';
    }
  };

  const getTypeColor = (type: ActivityEntry['type']) => {
    switch (type) {
      case 'event_created':
      case 'event_modified':
      case 'event_deleted': return 'bg-green-500/10 border-green-500/30';
      case 'ai_chat': return 'bg-blue-500/10 border-blue-500/30';
      case 'voice_input': return 'bg-purple-500/10 border-purple-500/30';
      case 'view_changed': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'manual_input': return 'bg-gray-500/10 border-gray-500/30';
      case 'file_upload': return 'bg-orange-500/10 border-orange-500/30';
      default: return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className="h-full relative">
      {/* Collapsed View */}
      <div className="h-full p-3 flex flex-col">
        <div
          className="flex items-center justify-between cursor-pointer hover:bg-gray-700/30 transition-colors rounded p-1"
          onClick={toggleExpanded}
        >
          <div className="text-neon-green text-xs font-medium font-red-hat">
            Activity History ({activities.length})
          </div>
          <div className="text-gray-400 text-xs">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>

        {/* Preview of recent activity */}
        {!isExpanded && activities.length > 0 && (
          <div className="flex-1 overflow-hidden mt-2">
            <div className={`p-2 rounded text-xs ${getTypeColor(activities[0].type)}`}>
              <div className="flex items-center gap-1 mb-1">
                <span>{getActivityIcon(activities[0].type)}</span>
                <span className={`font-semibold text-xs ${getSourceColor(activities[0].source)}`}>
                  {activities[0].source.toUpperCase()}
                </span>
              </div>
              <div className="text-gray-400 text-xs truncate">
                {activities[0].description}
              </div>
              <div className="text-gray-500 text-xs mt-1">
                {activities[0].timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Activity History - Animated upward expansion */}
      {isExpanded && (
        <div
          className={`absolute bottom-full left-0 right-0 mb-2 bg-gray-800/98 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl flex flex-col transition-all duration-300 ease-out transform ${
            isExpanded ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
          }`}
          style={{
            height: '450px',
            zIndex: 10000,
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(34, 197, 94, 0.3)',
            transformOrigin: 'bottom'
          }}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-600 bg-gray-800/90 rounded-t-lg">
            <h3 className="text-neon-green font-semibold font-cal-sans text-sm">Activity History</h3>
            <button
              onClick={toggleExpanded}
              className="text-gray-400 hover:text-white transition-colors text-lg w-6 h-6 flex items-center justify-center hover:bg-gray-700 rounded"
            >
              ×
            </button>
          </div>

          {/* Activities */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {activities.length === 0 ? (
              <div className="text-gray-500 text-center font-red-hat text-sm py-8">
                No activity recorded yet. Start using BÆKON to see your activity history!
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`p-2 rounded-lg border transition-all duration-200 hover:shadow-lg cursor-pointer ${getTypeColor(activity.type)} ${
                    selectedActivity?.id === activity.id ? 'ring-2 ring-neon-green ring-opacity-50' : ''
                  }`}
                  onClick={() => setSelectedActivity(selectedActivity?.id === activity.id ? null : activity)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getActivityIcon(activity.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${getSourceColor(activity.source)}`}>
                          {activity.source.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400 capitalize">{activity.type.replace('_', ' ')}</span>
                      </div>
                      <div className="text-xs text-gray-300 mb-1">
                        {activity.description}
                      </div>
                      {activity.details && !selectedActivity && (
                        <div className="text-xs text-gray-500 truncate">
                          {activity.details.content ?
                            `"${activity.details.content.substring(0, 60)}${activity.details.content.length > 60 ? '...' : ''}"`
                            : `${Object.keys(activity.details).length} details available`
                          }
                        </div>
                      )}
                      {/* Expanded Details */}
                      {selectedActivity?.id === activity.id && activity.details && (
                        <div className="mt-2 p-2 bg-gray-800/50 rounded border border-gray-600">
                          <div className="text-xs font-semibold text-neon-green mb-2">Activity Details:</div>
                          {Object.entries(activity.details).map(([key, value]) => (
                            <div key={key} className="text-xs mb-1">
                              <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span className="text-gray-300 ml-2">
                                {typeof value === 'string' ?
                                  (value.length > 200 ? `${value.substring(0, 200)}...` : value) :
                                  JSON.stringify(value)
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {selectedActivity?.id === activity.id ? '▼' : '▶'}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={activityEndRef} />
          </div>

          {/* Footer */}
          <div className="border-t border-gray-600 p-2">
            <div className="flex gap-2">
              <button className="flex-1 px-2 py-1 text-xs bg-neon-green/20 border border-neon-green text-neon-green rounded hover:bg-neon-green/30 transition-colors">
                Export Log
              </button>
              <button className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 text-gray-300 rounded hover:bg-gray-600 transition-colors">
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
