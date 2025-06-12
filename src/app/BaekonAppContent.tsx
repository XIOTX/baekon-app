"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MainPanel from "@/components/MainPanel";
import DetailsPanel from "@/components/DetailsPanel";
import BottomPanel from "@/components/BottomPanel";
import AIResponsePanel from "@/components/AIResponsePanel";
import ChatLogPanel from "@/components/ChatLogPanel";
import AIInsightsPanel from "@/components/AIInsightsPanel";
import { useEvents } from "@/hooks/useEvents";
import { useChat } from "@/hooks/useChat";

interface BaekonAppContentProps {
  userId?: string;
}

export default function BaekonAppContent({ userId }: BaekonAppContentProps) {
  const [chatExpanded, setChatExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<'sched' | 'work' | 'life'>('sched');
  const [schedView, setSchedView] = useState<'planner' | 'calendar'>(() => {
    if (typeof window !== 'undefined') {
      const savedDefaultView = localStorage.getItem('baekon-default-view');
      return (savedDefaultView as 'planner' | 'calendar') || 'planner';
    }
    return 'planner';
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    day: number;
    quarter: number;
    hour: number;
  } | null>(null);

  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(() => {
    const today = new Date();
    return today.getDay() === 0 ? 6 : today.getDay() - 1;
  });

  const { events, loading: eventsLoading, error: eventsError, fetchEvents, createEvent, updateEvent, deleteEvent } = useEvents(userId);
  const { messages, loading: chatLoading, error: chatError, sendMessage } = useChat(userId);

  const [hourEvents, setHourEvents] = useState<{ [key: string]: string[] }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('baekon-hour-events');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [dayEvents, setDayEvents] = useState<{ [key: string]: string[] }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('baekon-day-events');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [currentWeekDates, setCurrentWeekDates] = useState<Date[]>([]);

  const handleViewSwitch = (newView: 'planner' | 'calendar') => {
    setSchedView(newView);
    if (selectedTimeSlot && currentWeekDates.length > 0) {
      const currentSelectedDate = currentWeekDates[selectedTimeSlot.day];
      if (currentSelectedDate) {
        setSelectedDate(new Date(currentSelectedDate));
      }
    }
  };

  useEffect(() => {
    if (currentWeekDates.length > 0) {
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      for (let i = 0; i < currentWeekDates.length; i++) {
        const weekDateStr = currentWeekDates[i].toISOString().split('T')[0];
        if (weekDateStr === selectedDateStr) {
          setSelectedDayOfWeek(i);
          if (!selectedTimeSlot) {
            setSelectedTimeSlot({ day: i, quarter: 0, hour: 0 });
          }
          break;
        }
      }
    }
  }, [selectedDate, currentWeekDates, selectedTimeSlot]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('baekon-hour-events', JSON.stringify(hourEvents));
    }
  }, [hourEvents]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('baekon-day-events', JSON.stringify(dayEvents));
    }
  }, [dayEvents]);

  const getCurrentSlotEvents = () => {
    if (!selectedTimeSlot) return [];

    let weekDates = currentWeekDates;
    if (currentWeekDates.length === 0) {
      const date = new Date(selectedDate);
      const day = date.getDay();
      const monday = new Date(date);
      monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));

      weekDates = [];
      for (let i = 0; i < 7; i++) {
        const weekDate = new Date(monday);
        weekDate.setDate(monday.getDate() + i);
        weekDates.push(weekDate);
      }
    }

    const selectedDateForSlot = weekDates[selectedTimeSlot.day];
    if (!selectedDateForSlot) return [];

    const dateKey = selectedDateForSlot.toISOString().split('T')[0];

    if (selectedTimeSlot.quarter === -1 || selectedTimeSlot.hour === -1) {
      return dayEvents[dateKey] || [];
    }

    const hourKey = `${dateKey}-${selectedTimeSlot.quarter}-${selectedTimeSlot.hour}`;
    return hourEvents[hourKey] || [];
  };

  const createAIContext = () => {
    const currentDateStr = selectedDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const todayEvents = [];
    const todayDayEvents = dayEvents[todayStr] || [];
    todayEvents.push(...todayDayEvents);

    for (let quarter = 0; quarter < 4; quarter++) {
      for (let hour = 0; hour < 6; hour++) {
        const hourKey = `${todayStr}-${quarter}-${hour}`;
        const slotEvents = hourEvents[hourKey] || [];
        todayEvents.push(...slotEvents);
      }
    }

    const weekEvents: any[] = [];
    currentWeekDates.forEach((date, dayIndex) => {
      const dateKey = date.toISOString().split('T')[0];
      const dayEventsForDate = dayEvents[dateKey] || [];
      weekEvents.push(...dayEventsForDate.map(event => ({ event, date: dateKey, type: 'day' })));

      for (let quarter = 0; quarter < 4; quarter++) {
        for (let hour = 0; hour < 6; hour++) {
          const hourKey = `${dateKey}-${quarter}-${hour}`;
          const slotEvents = hourEvents[hourKey] || [];
          weekEvents.push(...slotEvents.map(event => ({ event, date: dateKey, quarter, hour, type: 'hour' })));
        }
      }
    });

    return {
      currentDate: todayStr,
      selectedDate: currentDateStr,
      activeSection,
      schedView,
      todayEvents,
      weekEvents,
      currentWeekDates: currentWeekDates.map(d => d.toISOString().split('T')[0]),
      selectedTimeSlot,
      totalEvents: todayEvents.length,
      weekEventCount: weekEvents.length,
      userPatterns: {
        mostActiveDay: currentWeekDates.length > 0 ? 'Monday' : 'Unknown',
        preferredView: schedView,
        recentActivity: activeSection
      }
    };
  };

  return (
    <div className="h-screen w-screen text-white p-[10px] overflow-visible relative">
      {/* Expanded Chat Overlay - Outside of panel containers */}
      {chatExpanded && (
        <div
          className="fixed z-50"
          style={{
            top: '82px', // 10px (root padding) + 60px (header) + 12px (gap) = 82px
            left: '10px', // 10px root padding
            width: '300px', // Exact left column width w-[300px]
            height: 'calc(100vh - 244px)', // 100vh - 10px (root top padding) - 82px (top offset) - 150px (bottom panel + gap + root bottom padding) - 2px (border adjustments)
            transform: 'translateY(0)',
            transformOrigin: 'top left',
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px'
          }}
        >
          <div
            className="h-full relative overflow-hidden rounded-lg border-2 border-pink-500"
            style={{
              boxShadow: '0px 0px 37px -10px #C080FF inset',
              outline: '1px #C080FF solid',
              outlineOffset: '-1px',
              background: 'rgba(20, 20, 20, 0.98)'
            }}
          >
            {/* Background overlay */}
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                backgroundImage: 'url(https://i.imgur.com/fu1Gj1m.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.3,
                zIndex: 0
              }}
            >
              <img
                src="https://i.imgur.com/fu1Gj1m.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-30"
                style={{ zIndex: -1 }}
                onError={(e) => {
                  console.log('Background image failed to load:', e);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            {/* Chat Content */}
            <div className="relative z-10 h-full p-4 flex flex-col">
              {/* Header */}
              <div
                className="flex items-center justify-between cursor-pointer mb-3 pb-2 relative"
                onClick={() => setChatExpanded(false)}
              >
                {/* Fading line under BÆKON */}
                <div
                  className="absolute bottom-0 left-0 h-px"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(to right, #FF5983 16.67%, transparent 100%)'
                  }}
                />
                <div
                  className="text-xl font-medium"
                  style={{
                    color: '#FF5983',
                    fontFamily: 'Cal Sans, sans-serif',
                    textShadow: '0px 0px 18px rgba(255, 89, 131, 1.00)'
                  }}
                >
                  BÆKON Chat ({messages.length})
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatExpanded(false);
                  }}
                  className="text-lg hover:bg-pink-500/20 rounded px-3 py-2 transition-colors"
                  style={{
                    color: '#F1E2FF',
                    fontFamily: 'Cal Sans, sans-serif'
                  }}
                >
                  ↙
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div
                    className="text-center py-8"
                    style={{
                      color: '#F1E2FF',
                      fontFamily: 'Syne Mono, monospace',
                      opacity: 0.6
                    }}
                  >
                    No chat history yet. Start a conversation with AI!
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-pink-500/20 border border-pink-500/30'
                            : 'bg-purple-500/20 border border-purple-500/30'
                        }`}
                        style={{
                          color: '#F1E2FF',
                          fontFamily: 'Syne Mono, monospace',
                          textShadow: '0px 0px 8px rgba(255, 255, 255, 0.8)'
                        }}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</div>
                        <div
                          className="text-xs mt-2 text-right"
                          style={{ opacity: 0.6 }}
                        >
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-full w-full flex flex-col gap-3 overflow-visible">
        <div className="h-[60px] flex-shrink-0 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-hidden">
          <Header
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            schedView={schedView}
            setSchedView={handleViewSwitch}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            setSelectedTimeSlot={setSelectedTimeSlot}
          />
        </div>

        <div className="flex-1 flex gap-3 min-h-0 overflow-visible">
          <div className="w-[300px] flex-shrink-0 flex flex-col gap-3 overflow-visible">
            <div className="flex-1 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-hidden">
              <Sidebar
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                currentWeekDates={currentWeekDates}
              />
            </div>

            <div className="h-64 flex-shrink-0 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-hidden">
              <AIResponsePanel
                messages={messages}
                loading={chatLoading}
                isExpanded={chatExpanded}
                setIsExpanded={setChatExpanded}
              />
            </div>



            {/* AI Insights Panel - Temporarily disabled */}
            {/* <div className="h-16 flex-shrink-0 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-visible relative z-50">
              <AIInsightsPanel
                hourEvents={hourEvents}
                dayEvents={dayEvents}
                currentWeekDates={currentWeekDates}
                messages={messages}
              />
            </div> */}
          </div>

          <div className="flex-1 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-hidden">
            <MainPanel
              activeSection={activeSection}
              schedView={schedView}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedTimeSlot={selectedTimeSlot}
              setSelectedTimeSlot={setSelectedTimeSlot}
              selectedDayOfWeek={selectedDayOfWeek}
              setSelectedDayOfWeek={setSelectedDayOfWeek}
              hourEvents={hourEvents}
              setHourEvents={setHourEvents}
              dayEvents={dayEvents}
              setDayEvents={setDayEvents}
              setCurrentWeekDates={setCurrentWeekDates}
              events={events}
              createEvent={createEvent}
              updateEvent={updateEvent}
              deleteEvent={deleteEvent}
              fetchEvents={fetchEvents}
              userId={userId}
            />
          </div>

          <div className="w-[300px] flex-shrink-0 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-hidden">
            <DetailsPanel
              selectedTimeSlot={selectedTimeSlot}
              events={getCurrentSlotEvents()}
              currentWeekDates={currentWeekDates}
              selectedDate={selectedDate}
              schedView={schedView}
            />
          </div>
        </div>

        <div className="h-[150px] flex-shrink-0 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-visible relative z-40">
          <BottomPanel
            messages={messages}
            sendMessage={sendMessage}
            loading={chatLoading}
            userId={userId}
            aiContext={createAIContext()}
            hourEvents={hourEvents}
            setHourEvents={setHourEvents}
            dayEvents={dayEvents}
            setDayEvents={setDayEvents}
            currentWeekDates={currentWeekDates}
            activeSection={activeSection}
            schedView={schedView}
          />
        </div>
      </div>
    </div>
  );
}
