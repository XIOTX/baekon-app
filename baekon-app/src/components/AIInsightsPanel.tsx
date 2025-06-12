"use client";

import { useState, useEffect } from "react";

interface AIInsightsPanelProps {
  hourEvents: { [key: string]: string[] };
  dayEvents: { [key: string]: string[] };
  currentWeekDates: Date[];
  messages: Array<{
    id: string;
    content: string;
    type: string;
    timestamp: Date;
  }>;
}

interface Insight {
  type: 'pattern' | 'recommendation' | 'achievement' | 'warning';
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

export default function AIInsightsPanel({
  hourEvents,
  dayEvents,
  currentWeekDates,
  messages
}: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Analyze patterns and generate insights
  useEffect(() => {
    const generateInsights = () => {
      const newInsights: Insight[] = [];

      // Analyze event frequency by day
      const todayStr = new Date().toISOString().split('T')[0];
      const todayEvents = [...(dayEvents[todayStr] || [])];

      // Count hour events for today
      for (let quarter = 0; quarter < 4; quarter++) {
        for (let hour = 0; hour < 6; hour++) {
          const hourKey = `${todayStr}-${quarter}-${hour}`;
          todayEvents.push(...(hourEvents[hourKey] || []));
        }
      }

      // Pattern: Busy day detection
      if (todayEvents.length > 8) {
        newInsights.push({
          type: 'warning',
          title: 'Heavy Schedule Today',
          description: `You have ${todayEvents.length} events today. Consider adding buffer time between activities.`,
          icon: '⚠️',
          priority: 'high'
        });
      }

      // Pattern: Empty day optimization
      if (todayEvents.length === 0) {
        newInsights.push({
          type: 'recommendation',
          title: 'Free Day Opportunity',
          description: 'Your schedule is clear today - perfect time for deep work or planning ahead!',
          icon: '🎯',
          priority: 'medium'
        });
      }

      // Analyze week patterns
      const weekEventCounts = currentWeekDates.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const dayEventsCount = (dayEvents[dateStr] || []).length;
        let hourEventsCount = 0;

        for (let quarter = 0; quarter < 4; quarter++) {
          for (let hour = 0; hour < 6; hour++) {
            const hourKey = `${dateStr}-${quarter}-${hour}`;
            hourEventsCount += (hourEvents[hourKey] || []).length;
          }
        }

        return dayEventsCount + hourEventsCount;
      });

      const maxEvents = Math.max(...weekEventCounts);
      const totalEvents = weekEventCounts.reduce((sum, count) => sum + count, 0);

      // Pattern: Week distribution analysis
      if (maxEvents > 10) {
        const busiestDayIndex = weekEventCounts.indexOf(maxEvents);
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        newInsights.push({
          type: 'pattern',
          title: 'Peak Workload Detected',
          description: `${dayNames[busiestDayIndex]} is your busiest day with ${maxEvents} events. Consider redistributing some tasks.`,
          icon: '📊',
          priority: 'medium'
        });
      }

      // Achievement: Consistent scheduling
      if (totalEvents > 15 && weekEventCounts.filter(count => count > 0).length >= 5) {
        newInsights.push({
          type: 'achievement',
          title: 'Great Planning Consistency!',
          description: `You've scheduled ${totalEvents} events across the week. Your organization skills are on point!`,
          icon: '🏆',
          priority: 'low'
        });
      }

      // Chat engagement analysis
      if (messages.length > 10) {
        newInsights.push({
          type: 'achievement',
          title: 'Active AI Collaboration',
          description: `You've had ${messages.length} conversations with me. I'm learning your patterns to help you better!`,
          icon: '🤖',
          priority: 'low'
        });
      }

      // Time-based recommendations
      const currentHour = new Date().getHours();

      if (currentHour >= 9 && currentHour <= 11 && todayEvents.length < 3) {
        newInsights.push({
          type: 'recommendation',
          title: 'Morning Productivity Window',
          description: 'It\'s prime morning hours and your schedule is light. Perfect time for focused deep work!',
          icon: '🌅',
          priority: 'high'
        });
      }

      if (currentHour >= 15 && currentHour <= 17 && todayEvents.length > 5) {
        newInsights.push({
          type: 'recommendation',
          title: 'Afternoon Energy Check',
          description: 'Busy afternoon ahead. Consider a 10-minute break to recharge before your next activities.',
          icon: '☕',
          priority: 'medium'
        });
      }

      // Default encouraging insight if no patterns detected
      if (newInsights.length === 0) {
        newInsights.push({
          type: 'recommendation',
          title: 'Ready for Productivity',
          description: 'Your schedule looks balanced. Ask me for productivity tips or help optimizing your day!',
          icon: '✨',
          priority: 'low'
        });
      }

      setInsights(newInsights);
    };

    generateInsights();
  }, [hourEvents, dayEvents, currentWeekDates, messages]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 border-red-500';
      case 'medium': return 'text-yellow-400 border-yellow-500';
      case 'low': return 'text-green-400 border-green-500';
      default: return 'text-gray-400 border-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-red-500/10';
      case 'recommendation': return 'bg-blue-500/10';
      case 'achievement': return 'bg-green-500/10';
      case 'pattern': return 'bg-purple-500/10';
      default: return 'bg-gray-500/10';
    }
  };

  return (
    <div className="h-full relative">
      {/* Collapsed View */}
      <div className="h-full p-3 flex flex-col">
        <div
          className="flex items-center justify-between cursor-pointer hover:bg-gray-700/30 transition-colors rounded p-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="text-neon-purple text-xs font-medium font-red-hat">
            AI Insights ({insights.length})
          </div>
          <div className="text-gray-400 text-xs">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>

        {/* Preview of top insight */}
        {!isExpanded && insights.length > 0 && (
          <div className="flex-1 overflow-hidden mt-2">
            <div className={`p-2 rounded text-xs ${getTypeColor(insights[0].type)}`}>
              <div className="flex items-center gap-1 mb-1">
                <span>{insights[0].icon}</span>
                <span className="font-semibold text-gray-300">{insights[0].title}</span>
              </div>
              <div className="text-gray-400 text-xs truncate">
                {insights[0].description}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Insights Dashboard - Fixed positioned upward expansion */}
      {isExpanded && (
        <div className={`fixed bg-gradient-to-br from-gray-900/95 to-purple-900/20 backdrop-blur-xl border-2 border-neon-purple/40 rounded-xl shadow-2xl flex flex-col transition-all duration-300 ease-out transform ${
          isExpanded ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
        }`}
             style={{
               bottom: '80px',
               left: '20px',
               width: '320px',
               height: '400px',
               zIndex: 10000,
               boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(147, 51, 234, 0.4), 0 0 20px rgba(147, 51, 234, 0.2)',
               transformOrigin: 'bottom'
             }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neon-purple/30 bg-gradient-to-r from-gray-900/80 to-purple-900/20 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-neon-purple rounded-full animate-pulse" />
              <h3 className="text-neon-purple font-semibold font-cal-sans text-sm">AI Productivity Insights</h3>
              <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">{insights.length}</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-neon-purple transition-colors text-lg w-7 h-7 flex items-center justify-center hover:bg-neon-purple/10 rounded-lg border border-transparent hover:border-neon-purple/30"
            >
              ×
            </button>
          </div>

          {/* Insights List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-lg ${getTypeColor(insight.type)} ${getPriorityColor(insight.priority)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{insight.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-gray-200 mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      {insight.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(insight.priority)} border`}>
                        {insight.priority.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {insight.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {insights.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <div className="text-2xl mb-2">🤔</div>
                <div className="text-sm">Analyzing your patterns...</div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-600 p-3">
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 text-xs bg-neon-purple/20 border border-neon-purple text-neon-purple rounded hover:bg-neon-purple/30 transition-colors">
                Refresh Analysis
              </button>
              <button className="flex-1 px-3 py-2 text-xs bg-gray-700 border border-gray-600 text-gray-300 rounded hover:bg-gray-600 transition-colors">
                Export Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
