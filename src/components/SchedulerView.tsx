"use client";

import { useState, useMemo, useEffect } from "react";

// Helper function moved outside component to avoid useEffect dependency issues
function getMondaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const mondays = [];

  // Start from the first day of the month
  const firstDay = new Date(year, month, 1);
  const current = new Date(firstDay);

  // Find the first Monday
  while (current.getDay() !== 1) {
    current.setDate(current.getDate() + 1);
  }

  // Collect all Mondays in the month
  while (current.getMonth() === month) {
    mondays.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }

  return mondays;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category?: string;
  tags: string[];
  completed: boolean;
  userId: string;
}

interface SchedulerViewProps {
  view: 'planner' | 'calendar';
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedTimeSlot: {
    day: number;
    quarter: number;
    hour: number;
  } | null;
  setSelectedTimeSlot: (slot: {
    day: number;
    quarter: number;
    hour: number;
  } | null) => void;
  selectedDayOfWeek: number;
  setSelectedDayOfWeek: (day: number) => void;
  hourEvents: { [key: string]: string[] };
  setHourEvents: (events: { [key: string]: string[] } | ((prev: { [key: string]: string[] }) => { [key: string]: string[] })) => void;
  dayEvents: { [key: string]: string[] };
  setDayEvents: (events: { [key: string]: string[] } | ((prev: { [key: string]: string[] }) => { [key: string]: string[] })) => void;
  setCurrentWeekDates: (dates: Date[]) => void;

  // Real API functions
  events: Event[];
  createEvent: (data: any) => Promise<Event | null>;
  updateEvent: (id: string, data: any) => Promise<Event | null>;
  deleteEvent: (id: string) => Promise<boolean>;
  fetchEvents: (startDate?: Date, endDate?: Date) => Promise<void>;
  userId: string;
}

export default function SchedulerView({
  view,
  selectedDate,
  setSelectedDate,
  selectedTimeSlot,
  setSelectedTimeSlot,
  selectedDayOfWeek,
  setSelectedDayOfWeek,
  hourEvents,
  setHourEvents,
  dayEvents,
  setDayEvents,
  setCurrentWeekDates,
  events,
  createEvent,
  updateEvent,
  deleteEvent,
  fetchEvents,
  userId
}: SchedulerViewProps) {
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
    const date = new Date(selectedDate);
    const day = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
    return monday;
  });

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Update selectedWeekStart when selectedDate changes (month change)
  useEffect(() => {
    const date = new Date(selectedDate);
    const mondaysInCurrentMonth = getMondaysInMonth(date);
    if (mondaysInCurrentMonth.length > 0) {
      setSelectedWeekStart(mondaysInCurrentMonth[0]);
    }
  }, [selectedDate]);

  // Fetch events when component mounts or date changes
  useEffect(() => {
    if (userId) {
      const startOfWeek = new Date(selectedWeekStart);
      const endOfWeek = new Date(selectedWeekStart);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      fetchEvents(startOfWeek, endOfWeek);
    }
  }, [selectedWeekStart, userId, fetchEvents]);

  const mondaysInMonth = getMondaysInMonth(selectedDate);

  // Get week dates based on selected Monday
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(selectedWeekStart);
      date.setDate(selectedWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [selectedWeekStart]);

  // Update parent's currentWeekDates when weekDates change
  useEffect(() => {
    setCurrentWeekDates(weekDates);
  }, [weekDates, setCurrentWeekDates]);

  const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  // Time quarters configuration
  const timeQuarters = [
    { label: '9AM-3PM', start: 9, hours: ['9', '10', '11', '12', '1', '2'] },
    { label: '3PM-9PM', start: 15, hours: ['3', '4', '5', '6', '7', '8'] },
    { label: '9PM-3AM', start: 21, hours: ['9', '10', '11', '12', '1', '2'] },
    { label: '3AM-9AM', start: 3, hours: ['3', '4', '5', '6', '7', '8'] }
  ];

  const handleTimeSlotClick = (dayIndex: number, quarterIndex: number, hourIndex: number) => {
    setSelectedTimeSlot({ day: dayIndex, quarter: quarterIndex, hour: hourIndex });
  };

  const handleQuarterClick = (dayIndex: number, quarterIndex: number) => {
    setSelectedTimeSlot({ day: dayIndex, quarter: quarterIndex, hour: -1 }); // -1 indicates quarter selection
  };

  const isTimeSlotSelected = (dayIndex: number, quarterIndex: number, hourIndex: number) => {
    return selectedTimeSlot?.day === dayIndex &&
           selectedTimeSlot?.quarter === quarterIndex &&
           selectedTimeSlot?.hour === hourIndex;
  };

  // Handle enter key for event input
  const handleEventSubmit = (value: string, type: 'day' | 'hour', key: string) => {
    if (value.trim()) {
      if (type === 'day') {
        setDayEvents(prev => ({
          ...prev,
          [key]: [...(prev[key] || []), value.trim()]
        }));
      } else {
        setHourEvents(prev => ({
          ...prev,
          [key]: [...(prev[key] || []), value.trim()]
        }));
      }
    }
  };

  if (view === 'calendar') {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    // Calculate 7 weeks of days with current month starting on row 2
    const firstOfMonth = new Date(currentYear, currentMonth, 1);

    // Find the Monday of the week containing the 1st of the month
    const startOfMonthWeek = new Date(firstOfMonth);
    const dayOfWeek = firstOfMonth.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfMonthWeek.setDate(firstOfMonth.getDate() - daysToMonday);

    // Go back 1 more week so the month starts on row 2 (instead of row 1)
    const startOfWeek = new Date(startOfMonthWeek);
    startOfWeek.setDate(startOfMonthWeek.getDate() - 7);

    // Generate 7 weeks (49 days) of calendar days
    const calendarDays = [];
    for (let i = 0; i < 49; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);

      calendarDays.push({
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === currentMonth && currentDate.getFullYear() === currentYear,
        isAdjacentMonth: Math.abs(currentDate.getMonth() - currentMonth) <= 1 ||
                        (currentMonth === 0 && currentDate.getMonth() === 11) ||
                        (currentMonth === 11 && currentDate.getMonth() === 0),
        date: currentDate
      });
    }

    // Navigation functions
    const goToPreviousMonth = () => {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setSelectedDate(newDate);
    };

    const goToNextMonth = () => {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setSelectedDate(newDate);
    };

    return (
      <div className="h-full p-3 flex flex-col overflow-hidden">
        {/* Month/Year Header with Navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-neon-purple hover:text-neon-pink border border-neon-purple/50 hover:border-neon-pink/50 rounded transition-all duration-200"
            title="Previous month"
          >
            ←
          </button>

          <div className="text-center text-neon-aqua text-lg font-semibold font-cal-sans">
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>

          <button
            onClick={goToNextMonth}
            className="p-2 text-neon-purple hover:text-neon-pink border border-neon-purple/50 hover:border-neon-pink/50 rounded transition-all duration-200"
            title="Next month"
          >
            →
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-neon-purple text-xs font-semibold font-red-hat p-1">
              {day}
            </div>
          ))}
        </div>

        {/* 7-week Calendar grid (7 rows × 7 days = 49 days) */}
        <div className="grid grid-cols-7 gap-1 flex-1 min-h-0 max-h-full grid-rows-7">
          {calendarDays.map((dayObj, i) => {
            // Use actual date for calendar day events
            const dayKey = dayObj.date ? dayObj.date.toISOString().split('T')[0] : `cal-${i}`;

            // Aggregate all events for this day (day events + hour events)
            const dayOnlyEvents = dayEvents[dayKey] || [];
            const hourOnlyEvents: string[] = [];

            // Collect all hour events for this day
            if (dayObj.date) {
              for (let quarter = 0; quarter < 4; quarter++) {
                for (let hour = 0; hour < 6; hour++) {
                  const hourKey = `${dayKey}-${quarter}-${hour}`;
                  const slotEvents = hourEvents[hourKey] || [];
                  hourOnlyEvents.push(...slotEvents);
                }
              }
            }

            // Combine day events and hour events
            const events = [...dayOnlyEvents, ...hourOnlyEvents];

            return (
              <CalendarDay
                key={i}
                dayObj={dayObj}
                dayIndex={i}
                events={events}
                dayKey={dayKey}
                selectedTimeSlot={selectedTimeSlot}
                setSelectedDate={setSelectedDate}
                setSelectedTimeSlot={setSelectedTimeSlot}
                setDayEvents={setDayEvents}
                handleEventSubmit={handleEventSubmit}
                currentMonth={currentMonth}
                currentYear={currentYear}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-3 flex flex-col overflow-hidden">

      {/* Week Navigation - Reduced spacing */}
      <div className="mb-1 flex-shrink-0">

        {/* Day tabs - Quarter height and closer to top */}
        <div className="flex space-x-1 mb-1">
          {weekDates.map((date, index) => (
            <div key={index} className="flex-1">
              <button
                onClick={() => setSelectedDayIndex(index)}
                className={`day-tab text-center py-0.5 w-full text-xs ${index === selectedDayIndex ? 'selected' : ''}`}
              >
                <div className="font-semibold font-red-hat">{dayNames[index]}</div>
                <div className="text-xs font-cal-sans">{date.getDate()}</div>
              </button>
            </div>
          ))}
        </div>

        {/* Week chooser */}
        <div className="flex justify-start">
          <div className="neon-panel p-2 border-neon-blue relative z-10">
            <div className="flex space-x-2">
              {mondaysInMonth.map((monday, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedWeekStart(monday)}
                  className={`px-2 py-1 rounded transition-all duration-200 font-syne-mono text-xs ${
                    monday.getTime() === selectedWeekStart.getTime()
                      ? 'text-neon-aqua font-bold neon-text'
                      : 'text-gray-400 hover:text-neon-blue'
                  }`}
                >
                  {monday.getDate()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Highlights Section - Reduced height */}
      <div className="mb-2 h-12 neon-panel p-2 border-yellow-500 relative z-10 flex-shrink-0">
        <div className="text-yellow-400 text-xs uppercase tracking-wide mb-1 font-red-hat">
          Week highlights and upcoming events
        </div>
        <div className="text-yellow-300 text-xs font-syne-mono">
          Relevant info and insights
        </div>
      </div>

      {/* Time Quarters Grid - More space */}
      <div className="flex-1 grid grid-cols-2 gap-2 min-h-0">
        {timeQuarters.map((quarter, quarterIndex) => (
          <div key={quarterIndex} className="neon-panel p-2 relative z-10 flex flex-col min-h-0">

            {/* Quarter header */}
            <div className="text-center mb-2 flex-shrink-0">
              <button
                onClick={() => handleQuarterClick(selectedDayIndex, quarterIndex)}
                className={`text-neon-purple font-semibold text-sm font-red-hat hover:text-neon-aqua transition-colors duration-200 px-2 py-1 rounded ${
                  selectedTimeSlot?.day === selectedDayIndex && selectedTimeSlot?.quarter === quarterIndex && selectedTimeSlot?.hour === -1
                    ? 'bg-neon-purple bg-opacity-20 shadow-neon-purple'
                    : ''
                }`}
              >
                {quarter.label}
              </button>
            </div>

            {/* Hour slots */}
            <div className="space-y-1 flex-1 overflow-y-auto">
              {quarter.hours.map((hour, hourIndex) => {
                // Create date-specific key using actual date
                const currentDate = weekDates[selectedDayIndex];
                const dateKey = currentDate ? currentDate.toISOString().split('T')[0] : `day-${selectedDayIndex}`;
                const hourKey = `${dateKey}-${quarterIndex}-${hourIndex}`;
                const events = hourEvents[hourKey] || [];

                return (
                  <div
                    key={hourIndex}
                    onClick={() => handleTimeSlotClick(selectedDayIndex, quarterIndex, hourIndex)}
                    className={`time-block w-full p-1 cursor-pointer ${
                      isTimeSlotSelected(selectedDayIndex, quarterIndex, hourIndex) ? 'selected' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-neon-blue font-syne-mono text-xs flex-shrink-0 mt-0.5">{hour}</span>
                      <div className="flex-1">
                        {/* Display existing events */}
                        {events.map((event, idx) => (
                          <div key={idx} className="text-xs text-gray-300 font-red-hat mb-1">
                            • {event}
                          </div>
                        ))}

                        {/* Input for new event */}
                        <input
                          type="text"
                          placeholder="Add event..."
                          className="w-full bg-transparent border-none outline-none text-gray-300 text-xs font-red-hat placeholder-gray-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEventSubmit(e.currentTarget.value, 'hour', hourKey);
                              e.currentTarget.value = '';
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTimeSlotClick(selectedDayIndex, quarterIndex, hourIndex);
                          }}
                          onFocus={(e) => {
                            handleTimeSlotClick(selectedDayIndex, quarterIndex, hourIndex);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// CalendarDay component with fixed height and expandable overlay
function CalendarDay({
  dayObj,
  dayIndex,
  events,
  dayKey,
  selectedTimeSlot,
  setSelectedDate,
  setSelectedTimeSlot,
  setDayEvents,
  handleEventSubmit,
  currentMonth,
  currentYear
}: {
  dayObj: any;
  dayIndex: number;
  events: string[];
  dayKey: string;
  selectedTimeSlot: any;
  setSelectedDate: (date: Date) => void;
  setSelectedTimeSlot: (slot: any) => void;
  setDayEvents: (fn: (prev: any) => any) => void;
  handleEventSubmit: (value: string, type: string, key: string) => void;
  currentMonth?: number;
  currentYear?: number;
}) {
  const [showExpanded, setShowExpanded] = useState(false);

  return (
    <div
      onClick={() => {
        if (dayObj.date) {
          const newDate = new Date(dayObj.date);
          setSelectedDate(newDate);

          // Calculate which day of the week this date corresponds to (0-6, Monday=0)
          const dayOfWeek = newDate.getDay() === 0 ? 6 : newDate.getDay() - 1;

          // For calendar view, we need to use a unique identifier that doesn't conflict with planner
          // Use negative values to distinguish calendar selection from planner time slots
          setSelectedTimeSlot({ day: -1, quarter: -1, hour: dayIndex }); // Use dayIndex as unique calendar identifier
        }
      }}
      className={`border rounded p-1 hover:border-neon-purple transition-colors relative cursor-pointer ${
        dayObj.isCurrentMonth
          ? 'border-neon-blue/50 text-gray-200 bg-gray-800/30' // Current month - highlighted
          : dayObj.isAdjacentMonth
            ? 'border-gray-700 text-gray-500 bg-gray-900/30' // Adjacent months - dimmed but visible
            : 'border-gray-800 text-gray-700 bg-gray-900/10' // Other months - very dimmed
      } ${
        selectedTimeSlot?.day === -1 && selectedTimeSlot?.quarter === -1 && selectedTimeSlot?.hour === dayIndex
          ? 'border-neon-pink shadow-neon-pink' : ''
      }`}
      style={{ height: '80px', minHeight: '80px', maxHeight: '80px' }} // Taller for 7-week view
    >
      <div className="text-xs font-syne-mono mb-1">{dayObj.day}</div>

      {/* Events container with fixed height and overflow handling */}
      <div className="h-14 overflow-hidden relative">
        <div className="space-y-1">
          {/* Show only first 2 events to prevent overflow in smaller cells */}
          {events.slice(0, 2).map((event, idx) => (
            <input
              key={idx}
              type="text"
              defaultValue={event}
              className="w-full text-xs bg-transparent border-none outline-none text-neon-blue font-red-hat truncate"
              onClick={(e) => {
                e.stopPropagation();
                if (dayObj.date && dayObj.isCurrentMonth) {
                  setSelectedDate(new Date(dayObj.date));
                  setSelectedTimeSlot({ day: dayIndex, quarter: -1, hour: -1 });
                }
              }}
              onFocus={(e) => {
                e.stopPropagation();
                if (dayObj.date && dayObj.isCurrentMonth) {
                  setSelectedDate(new Date(dayObj.date));
                  setSelectedTimeSlot({ day: dayIndex, quarter: -1, hour: -1 });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const newEvents = [...events];
                  newEvents[idx] = e.currentTarget.value;
                  setDayEvents(prev => ({
                    ...prev,
                    [dayKey]: newEvents
                  }));
                }
              }}
            />
          ))}

          {/* Show "more events" indicator if there are more than 2 events */}
          {events.length > 2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowExpanded(true);
              }}
              className="w-full text-xs text-neon-purple hover:text-neon-pink transition-colors text-left font-red-hat"
            >
              +{events.length - 2} more...
            </button>
          )}

          {/* Input for new event - only show for current month and if there's space */}
          {dayObj.isCurrentMonth && events.length < 2 && (
            <input
              type="text"
              placeholder="Add event..."
              className="w-full text-xs bg-transparent border-none outline-none text-gray-400 placeholder-gray-600 font-red-hat"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEventSubmit(e.currentTarget.value, 'day', dayKey);
                  e.currentTarget.value = '';
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (dayObj.date && dayObj.isCurrentMonth) {
                  setSelectedDate(new Date(dayObj.date));
                  setSelectedTimeSlot({ day: dayIndex, quarter: -1, hour: -1 });
                }
              }}
              onFocus={(e) => {
                e.stopPropagation();
                if (dayObj.date && dayObj.isCurrentMonth) {
                  setSelectedDate(new Date(dayObj.date));
                  setSelectedTimeSlot({ day: dayIndex, quarter: -1, hour: -1 });
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Expanded overlay for days with many events */}
      {showExpanded && events.length > 0 && (
        <div
          className="absolute bg-gray-800/95 backdrop-blur-md border border-neon-purple/50 rounded-lg p-3 shadow-2xl z-50 max-h-96 overflow-y-auto"
          style={{
            top: '0',
            left: dayIndex % 7 > 3 ? '-240px' : '0', // Position left for right-side cells
            width: '300px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(168, 85, 247, 0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-neon-pink font-semibold text-sm font-cal-sans">
              {dayObj.date?.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })} ({events.length} events)
            </h4>
            <button
              onClick={() => setShowExpanded(false)}
              className="text-gray-400 hover:text-white w-6 h-6 flex items-center justify-center hover:bg-gray-700 rounded text-lg"
            >
              ×
            </button>
          </div>

          {/* All events in scrollable list */}
          <div className="space-y-2">
            {events.map((event, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  defaultValue={event}
                  className="flex-1 text-xs bg-gray-700/50 border border-gray-600 rounded px-2 py-1 text-gray-300 focus:border-neon-blue focus:outline-none font-red-hat"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const newEvents = [...events];
                      newEvents[idx] = e.currentTarget.value;
                      setDayEvents(prev => ({
                        ...prev,
                        [dayKey]: newEvents
                      }));
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const newEvents = events.filter((_, i) => i !== idx);
                    setDayEvents(prev => ({
                      ...prev,
                      [dayKey]: newEvents.length > 0 ? newEvents : []
                    }));

                    // Close overlay if no events left
                    if (newEvents.length === 0) {
                      setShowExpanded(false);
                    }
                  }}
                  className="text-red-400 hover:text-red-300 text-sm px-2 py-1 hover:bg-red-500/20 rounded"
                  title="Delete event"
                >
                  ×
                </button>
              </div>
            ))}

            {/* Add new event input */}
            <div className="pt-2 border-t border-gray-600">
              <input
                type="text"
                placeholder="Add new event..."
                className="w-full text-xs bg-gray-700/50 border border-gray-600 rounded px-2 py-1 text-gray-300 placeholder-gray-500 focus:border-neon-green focus:outline-none font-red-hat"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEventSubmit(e.currentTarget.value, 'day', dayKey);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Click outside overlay to close */}
      {showExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowExpanded(false)}
        />
      )}
    </div>
  );
}
