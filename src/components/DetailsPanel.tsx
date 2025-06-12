"use client";

import { useState, useEffect } from "react";

interface DetailsPanelProps {
  selectedTimeSlot: {
    day: number;
    quarter: number;
    hour: number;
  } | null;
  events: string[];
  currentWeekDates: Date[];
  selectedDate: Date;
  schedView: 'planner' | 'calendar';
}

export default function DetailsPanel({ selectedTimeSlot, events, currentWeekDates, selectedDate, schedView }: DetailsPanelProps) {
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high' | 'none'>('none');

  // Mock data for demonstration
  const getSlotDetails = () => {
    if (!selectedTimeSlot) {
      return {
        title: "Select a time slot",
        description: "Click on any hour block or quarter to view details",
        duration: "",
        priority: "none",
        suggestions: [],
        context: "",
        image: null
      };
    }

    // Calendar day selection (quarter === -1 AND hour === -1)
    if (selectedTimeSlot.quarter === -1 && selectedTimeSlot.hour === -1) {
      let dayName: string;

      if (schedView === 'calendar') {
        // For calendar view, use the selectedDate directly
        dayName = selectedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        });
      } else {
        // For planner view, use currentWeekDates with day index
        dayName = currentWeekDates[selectedTimeSlot.day]?.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        }) || 'Selected Day';
      }

      return {
        title: dayName,
        description: events.length > 0 ? events.join(', ') : "No events scheduled for this day",
        duration: "Full day",
        priority: events.length > 0 ? "medium" : "none",
        suggestions: events.length > 0 ?
          ["Edit day events", "Review schedule", "Add more activities"] :
          ["Add day event", "Plan activities", "Set daily goals"],
        context: `Day overview for ${dayName}. Use this to plan full-day events or activities.`,
        image: null
      };
    }

    // Quarter selection (hour === -1 but quarter >= 0)
    if (selectedTimeSlot.hour === -1 && selectedTimeSlot.quarter >= 0) {
      const quarterLabels = ['9AM-3PM', '3PM-9PM', '9PM-3AM', '3AM-9AM'];
      const quarterLabel = quarterLabels[selectedTimeSlot.quarter] || 'Quarter';

      // Collect all events from this quarter's hours
      const quarterEvents = [];
      for (let hourIndex = 0; hourIndex < 6; hourIndex++) {
        // Check if we have events prop or need to look them up differently
        // For now, use the basic quarter view
      }

      return {
        title: `${quarterLabel} Quarter Block`,
        description: `Overview of activities and schedule for the ${quarterLabel} time block`,
        duration: "6 hours",
        priority: "medium",
        suggestions: [
          "Review all events in this block",
          "Optimize time allocation",
          "Add buffer time between activities"
        ],
        context: `This is where details for the entire ${quarterLabel} quarter go. Summary of all activities, energy levels, and planning insights for this time block.`,
        image: null
      };
    }

    // Hour selection - calculate actual hour with proper AM/PM display
    const getActualHourDisplay = (quarter: number, hourIndex: number) => {
      const quarterStarts = [9, 15, 21, 3]; // 9AM, 3PM, 9PM, 3AM
      let hour = quarterStarts[quarter] + hourIndex;

      // Handle overnight hours (3AM quarter going into next day)
      if (quarter === 3 && hour > 12) {
        hour = hour - 12; // Convert to next day hours (3AM quarter goes 3,4,5,6,7,8)
      }

      // Handle 24-hour to 12-hour conversion with proper AM/PM
      if (hour === 0) return "12 AM";
      if (hour === 12) return "12 PM";
      if (hour > 12) return `${hour - 12} PM`;

      // Determine AM/PM based on quarter
      if (quarter === 0) { // 9AM-3PM quarter
        if (hour === 12) return "12 PM";
        if (hour > 12) return `${hour - 12} PM`;
        return `${hour} AM`;
      } else if (quarter === 1) { // 3PM-9PM quarter
        return `${hour > 12 ? hour - 12 : hour} PM`;
      } else if (quarter === 2) { // 9PM-3AM quarter
        return hour > 12 ? `${hour - 12} AM` : `${hour} PM`;
      } else { // 3AM-9AM quarter
        return `${hour} AM`;
      }
    };

    const hourDisplay = getActualHourDisplay(selectedTimeSlot.quarter, selectedTimeSlot.hour);

    // Use actual events data if available
    const hasEvents = events && events.length > 0;
    const eventList = hasEvents ? events.join(', ') : "No events scheduled";

    return {
      title: hourDisplay,
      description: hasEvents ? eventList : "No events scheduled",
      duration: "1 hour",
      priority: hasEvents ? "medium" : "none",
      suggestions: hasEvents ?
        ["Edit events", "Add more details", "Set reminders"] :
        ["Add an event", "Set a reminder", "Block time for focus work"],
      context: hasEvents ?
        `Events for ${hourDisplay}: ${eventList}` :
        `Time slot details for ${hourDisplay}. Click to add events or notes for this hour.`,
      image: null
    };
  };

  const details = getSlotDetails();

  // Update priority when selection changes
  useEffect(() => {
    setSelectedPriority(details.priority as 'low' | 'medium' | 'high' | 'none');
  }, [selectedTimeSlot, details.priority]);

  return (
    <div className="h-full w-full p-2">
      <div
        className="h-full relative overflow-hidden rounded-lg"
        style={{
          boxShadow: '0px 0px 37px -10px #C080FF inset',
          outline: '1px #C080FF solid',
          outlineOffset: '-1px'
        }}
      >

        {/* Main Visual Area - Top Section */}
        <div
          className="absolute top-7 left-7 right-7 rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
          style={{
            height: '45%',
            boxShadow: '0px 0px 37px -10px #C080FF inset',
            borderColor: '#C080FF',
            background: 'linear-gradient(135deg, rgba(192, 128, 255, 0.1) 0%, rgba(255, 89, 131, 0.1) 100%)'
          }}
          onClick={() => details.image && setIsImageExpanded(true)}
        >
          {details.image ? (
            <img
              src={details.image}
              alt="Event reference"
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-4 text-center">
              <div
                className="text-2xl mb-2 font-mono"
                style={{
                  color: '#C080FF',
                  textShadow: '0px 0px 12px rgba(192, 128, 255, 0.8)'
                }}
              >
                {selectedTimeSlot ? '●' : '○'}
              </div>
              <div
                className="text-lg font-mono mb-1"
                style={{
                  color: '#F1E2FF',
                  textShadow: '0px 0px 8px rgba(255, 255, 255, 0.8)'
                }}
              >
                {details.title}
              </div>
              <div
                className="text-sm font-mono opacity-80"
                style={{
                  color: '#C080FF',
                  textShadow: '0px 0px 6px rgba(192, 128, 255, 0.6)'
                }}
              >
                {details.duration}
              </div>
              <div
                className="text-xs mt-2 font-mono opacity-60"
                style={{ color: '#9CA3AF' }}
              >
                {schedView.toUpperCase()} VIEW
              </div>
            </div>
          )}
        </div>

        {/* Details Section - Activities */}
        <div
          className="absolute left-7 right-7 text-center"
          style={{
            top: '51%',
            height: '32%',
            color: '#FF5983',
            fontSize: '14px',
            fontFamily: 'monospace',
            fontWeight: '400',
            lineHeight: '18px',
            textShadow: '0px 0px 18px rgba(255, 89, 131, 1.00)',
            opacity: 0.9
          }}
        >
          <div className="h-full overflow-y-auto">
            {events.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs opacity-70 mb-2">ACTIVITIES & EVENTS</div>
                {events.slice(0, 3).map((event, index) => (
                  <div
                    key={index}
                    className="bg-pink-500/10 backdrop-blur-sm border border-pink-500/30 rounded-md p-2 text-sm"
                    style={{ textShadow: '0px 0px 8px rgba(255, 89, 131, 0.8)' }}
                  >
                    {event}
                  </div>
                ))}
                {events.length > 3 && (
                  <div className="text-xs opacity-60 mt-2">
                    +{events.length - 3} more activities...
                  </div>
                )}

                {/* Priority Indicator */}
                <div className="flex justify-center mt-3 space-x-1">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedPriority(level as 'low' | 'medium' | 'high')}
                      className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                        selectedPriority === level
                          ? 'bg-pink-500/30 border border-pink-400'
                          : 'bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20'
                      }`}
                      style={{
                        color: '#FF5983',
                        textShadow: selectedPriority === level ? '0px 0px 8px rgba(255, 89, 131, 1)' : 'none'
                      }}
                    >
                      {level.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-sm mb-2">
                  {selectedTimeSlot ? 'Available Time Block' : 'Select Time to View Details'}
                </div>
                <div className="text-xs opacity-70 mb-3">
                  {selectedTimeSlot ? 'Ready for scheduling activities' : 'Choose a quarter, hour, or day'}
                </div>

                {/* AI Suggestions when no events */}
                {details.suggestions.length > 0 && selectedTimeSlot && (
                  <div className="space-y-1">
                    {details.suggestions.slice(0, 2).map((suggestion, index) => (
                      <div
                        key={index}
                        className="text-xs bg-pink-500/10 border border-pink-500/20 rounded px-2 py-1"
                        style={{ textShadow: '0px 0px 6px rgba(255, 89, 131, 0.6)' }}
                      >
                        • {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Secondary Details - Bottom */}
        <div
          className="absolute left-7 right-7 bottom-4 text-center"
          style={{
            height: '12%',
            color: '#F1E2FF',
            fontSize: '12px',
            fontFamily: 'monospace',
            fontWeight: '400',
            lineHeight: '14px',
            textShadow: '0px 0px 8px rgba(255, 255, 255, 1.00)',
            opacity: 0.8
          }}
        >
          <div className="h-full flex items-center justify-center">
            <div className="text-xs leading-tight">
              {details.context}
            </div>
          </div>
        </div>

        {/* Expanded Image Overlay */}
        {isImageExpanded && details.image && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
            onClick={() => setIsImageExpanded(false)}
          >
            <div className="max-w-4xl max-h-4xl p-4">
              <img
                src={details.image}
                alt="Expanded view"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
