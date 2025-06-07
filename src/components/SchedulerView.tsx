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
  selectedTimeSlot,
  setSelectedTimeSlot,
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
    setCurrentWeekDates(dates);
    return dates;
  }, [selectedWeekStart, setCurrentWeekDates]);

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
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    // Generate calendar days
    const calendarDays = [];

    // Previous month's trailing days
    const prevMonth = new Date(currentYear, currentMonth - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      calendarDays.push({
        day: prevMonth.getDate() - i,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth - 1, prevMonth.getDate() - i)
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push({
        day,
        isCurrentMonth: true,
        date: new Date(currentYear, currentMonth, day)
      });
    }

    // Next month's leading days
    const remainingSlots = 42 - calendarDays.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingSlots; day++) {
      calendarDays.push({
        day,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth + 1, day)
      });
    }

    return (
      <div className="h-full p-3 flex flex-col overflow-hidden">
        {/* Month/Year Header */}
        <div className="text-center text-neon-aqua text-lg font-semibold mb-4 font-cal-sans">
          {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-neon-purple text-xs font-semibold font-red-hat p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 flex-1 min-h-0">
          {calendarDays.map((dayObj, i) => {
            const dayKey = (dayObj.day - 1).toString();
            const events = dayEvents[dayKey] || [];

            return (
              <div
                key={i}
                onClick={() => {
                  setSelectedTimeSlot({ day: i, quarter: 0, hour: 0 });
                }}
                className={`border rounded p-1 hover:border-neon-purple transition-colors relative cursor-pointer ${
                  dayObj.isCurrentMonth
                    ? 'border-gray-600 text-gray-300'
                    : 'border-gray-800 text-gray-600'
                } ${
                  selectedTimeSlot?.day === i ? 'border-neon-pink shadow-neon-pink' : ''
                }`}
              >
                <div className="text-xs font-syne-mono mb-1">{dayObj.day}</div>

                {/* Events display as editable inputs */}
                <div className="space-y-1">
                  {events.map((event, idx) => (
                    <input
                      key={idx}
                      type="text"
                      defaultValue={event}
                      className="w-full text-xs bg-transparent border-none outline-none text-neon-blue font-red-hat"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTimeSlot({ day: i, quarter: 0, hour: 0 });
                      }}
                      onFocus={(e) => {
                        e.stopPropagation();
                        setSelectedTimeSlot({ day: i, quarter: 0, hour: 0 });
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

                  {/* Input for new event */}
                  {dayObj.isCurrentMonth && (
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
                        setSelectedTimeSlot({ day: i, quarter: 0, hour: 0 });
                      }}
                      onFocus={(e) => {
                        e.stopPropagation();
                        setSelectedTimeSlot({ day: i, quarter: 0, hour: 0 });
                      }}
                    />
                  )}
                </div>
              </div>
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
                const hourKey = `${selectedDayIndex}-${quarterIndex}-${hourIndex}`;
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
