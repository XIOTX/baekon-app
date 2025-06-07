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
}

export default function DetailsPanel({ selectedTimeSlot, events, currentWeekDates }: DetailsPanelProps) {
  const [isImageExpanded, setIsImageExpanded] = useState(false);

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

    // Quarter selection (hour === -1)
    if (selectedTimeSlot.hour === -1) {
      const quarterLabels = ['9AM-3PM', '3PM-9PM', '9PM-3AM', '3AM-9AM'];
      const quarterLabel = quarterLabels[selectedTimeSlot.quarter] || 'Quarter';

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

      // Handle overnight hours (3AM quarter)
      if (quarter === 3 && hour > 12) {
        hour = hour - 12; // Convert to next day hours (3AM quarter goes 3,4,5,6,7,8)
      }

      // Handle 24-hour to 12-hour conversion with proper AM/PM
      if (hour === 0) return "12 AM";
      if (hour === 12) return "12 PM";
      if (hour > 12) return `${hour - 12} PM`;
      if (hour < 12 && quarter >= 2) return `${hour} AM`; // Late night/early morning
      return `${hour} ${quarter < 2 ? 'PM' : 'AM'}`;
    };

    const hourDisplay = getActualHourDisplay(selectedTimeSlot.quarter, selectedTimeSlot.hour);

    return {
      title: hourDisplay,
      description: "No events scheduled",
      duration: "1 hour",
      priority: "none",
      suggestions: ["Add an event", "Set a reminder", "Block time for focus work"],
      context: `Time slot details for ${hourDisplay}. This is where event information, notes, and context for this specific hour will be displayed.`,
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
      <div className="neon-panel h-full p-3 flex flex-col relative z-10 overflow-hidden">

        {/* Image Section - Top Half */}
        <div className="h-1/2 mb-3 flex-shrink-0">
          <div
            className="w-full h-full border border-gray-600 rounded-lg overflow-hidden cursor-pointer hover:border-neon-aqua transition-colors grid-bg flex items-center justify-center"
            onClick={() => details.image && setIsImageExpanded(true)}
          >
            {details.image ? (
              <img
                src={details.image}
                alt="Event reference"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🖼️</div>
                <div className="text-sm">No image</div>
              </div>
            )}
          </div>
        </div>

        {/* Details Section - Bottom Half */}
        <div className="h-1/2 overflow-y-auto space-y-2 text-sm">

          {/* Title */}
          <div>
            <h3 className="text-neon-pink font-semibold text-sm neon-text mb-1 font-cal-sans">
              {details.title}
            </h3>
          </div>

          {/* Description */}
          <div>
            <label className="text-neon-blue text-xs font-medium font-red-hat">Description</label>
            <p className="text-gray-300 text-xs mt-1 font-red-hat">
              {details.description}
            </p>
          </div>

          {/* Duration */}
          {details.duration && (
            <div>
              <label className="text-neon-blue text-xs font-medium font-red-hat">Duration</label>
              <p className="text-gray-300 text-xs mt-1 font-red-hat">
                {details.duration}
              </p>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="text-neon-blue text-xs font-medium font-red-hat">Priority (AI Analyzed)</label>
            <div className="flex space-x-1 mt-1">
              {['low', 'medium', 'high'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedPriority(level as 'low' | 'medium' | 'high')}
                  className={`px-2 py-1 text-xs rounded border transition-all duration-200 ${
                    selectedPriority === level
                      ? 'border-neon-purple text-neon-purple bg-neon-purple bg-opacity-20'
                      : 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                  }`}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* AI Suggestions */}
          {details.suggestions.length > 0 && (
            <div>
              <label className="text-neon-blue text-xs font-medium font-red-hat">AI Suggestions</label>
              <ul className="mt-1 space-y-1">
                {details.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-gray-300 text-xs flex items-start">
                    <span className="text-neon-green mr-2">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Context */}
          <div>
            <label className="text-neon-blue text-xs font-medium font-red-hat">Context</label>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed font-red-hat">
              {details.context}
            </p>
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
