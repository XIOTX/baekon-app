"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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

export default function BaekonApp() {
  const { data: session, status } = useSession();

  const [activeSection, setActiveSection] = useState<'sched' | 'work' | 'life'>('sched');
  // Load default view from localStorage (default to 'planner')
  const [schedView, setSchedView] = useState<'planner' | 'calendar'>(() => {
    if (typeof window !== 'undefined') {
      const savedDefaultView = localStorage.getItem('baekon-default-view');
      return (savedDefaultView as 'planner' | 'calendar') || 'planner';
    }
    return 'planner';
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    // Always start with today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    return today;
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    day: number;
    quarter: number;
    hour: number;
  } | null>(null);

  // Track which day of the week is selected (0-6, Monday=0)
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(() => {
    const today = new Date();
    // Convert Sunday=0 to Monday=0 format
    return today.getDay() === 0 ? 6 : today.getDay() - 1;
  });

  // Real API hooks
  const { events, loading: eventsLoading, error: eventsError, fetchEvents, createEvent, updateEvent, deleteEvent } = useEvents(session?.user?.id || null);
  const { messages, loading: chatLoading, error: chatError, sendMessage } = useChat(session?.user?.id || null);

  // Event state management with localStorage persistence
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

  // Week context for proper date-based keys (will be updated by MainPanel)
  const [currentWeekDates, setCurrentWeekDates] = useState<Date[]>([]);

  // Synchronize selected date when switching between calendar and planner
  const handleViewSwitch = (newView: 'planner' | 'calendar') => {
    setSchedView(newView);

    // If we have a selected time slot, maintain the same day
    if (selectedTimeSlot && currentWeekDates.length > 0) {
      const currentSelectedDate = currentWeekDates[selectedTimeSlot.day];
      if (currentSelectedDate) {
        setSelectedDate(new Date(currentSelectedDate));
      }
    }
  };

  // Update planner to show the week containing selectedDate when date changes
  useEffect(() => {
    if (currentWeekDates.length > 0) {
      // Find which day in current week matches selectedDate
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      for (let i = 0; i < currentWeekDates.length; i++) {
        const weekDateStr = currentWeekDates[i].toISOString().split('T')[0];
        if (weekDateStr === selectedDateStr) {
          setSelectedDayOfWeek(i);
          // Auto-select this day's first hour slot if no time slot selected
          if (!selectedTimeSlot) {
            setSelectedTimeSlot({ day: i, quarter: 0, hour: 0 });
          }
          break;
        }
      }
    }
  }, [selectedDate, currentWeekDates, selectedTimeSlot]);

  // Save to localStorage whenever events change
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

  // Get current slot events for DetailsPanel
  // Get current slot events for DetailsPanel with date-specific keys
  const getCurrentSlotEvents = () => {
    if (!selectedTimeSlot) return [];

    // If currentWeekDates hasn't been set yet, calculate it based on selectedDate
    let weekDates = currentWeekDates;
    if (currentWeekDates.length === 0) {
      // Calculate week dates manually as fallback
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

    // Get the actual date for the selected day
    const selectedDateForSlot = weekDates[selectedTimeSlot.day];
    if (!selectedDateForSlot) return [];

    // Create date-specific key (YYYY-MM-DD format)
    const dateKey = selectedDateForSlot.toISOString().split('T')[0];

    // Calendar day selection uses negative values to avoid conflict with planner hours
    if (selectedTimeSlot.quarter === -1 || selectedTimeSlot.hour === -1) {
      return dayEvents[dateKey] || [];
    }

    // Planner hour selection - use date-specific key
    const hourKey = `${dateKey}-${selectedTimeSlot.quarter}-${selectedTimeSlot.hour}`;
    return hourEvents[hourKey] || [];
  };

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const result = await signIn('credentials', {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        setLoginError('Invalid credentials');
      } else {
        console.log('Sign-in successful, redirecting...');
        // NextAuth will automatically update the session
      }
    } catch (error) {
      setLoginError('Sign-in failed');
    }

    setLoginLoading(false);
  };

  // Create rich context for AI interactions
  const createAIContext = () => {
    const currentDateStr = selectedDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    // Get today's events from both hour and day events
    const todayEvents = [];

    // Day events for today
    const todayDayEvents = dayEvents[todayStr] || [];
    todayEvents.push(...todayDayEvents);

    // Hour events for today
    for (let quarter = 0; quarter < 4; quarter++) {
      for (let hour = 0; hour < 6; hour++) {
        const hourKey = `${todayStr}-${quarter}-${hour}`;
        const slotEvents = hourEvents[hourKey] || [];
        todayEvents.push(...slotEvents);
      }
    }

    // Get this week's events
    const weekEvents = [];
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
        mostActiveDay: currentWeekDates.length > 0 ? 'Monday' : 'Unknown', // Could analyze this
        preferredView: schedView,
        recentActivity: activeSection
      }
    };
  };

  // Enhanced debug logging for session state
  console.log('🔍 Main page session debug:', {
    status,
    hasSession: !!session,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    userName: session?.user?.name,
    timestamp: new Date().toISOString()
  });

  // TEMPORARY: Skip auth to test app - TODO: Fix NextAuth redirect loop
  /*
  if (status === "loading") {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin h-8 w-8 border-2 border-neon-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Checking authentication...</p>
          <p className="text-xs text-gray-400 mt-2">Status: {status}</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in page if unauthenticated
  if (status === "unauthenticated") {
    // Use window.location to avoid router issues
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin';
    }
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin h-8 w-8 border-2 border-neon-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Redirecting to sign in...</p>
        </div>
      </div>
    );
  }
  */

  // TEMPORARY: Create fake session for testing - use real user ID
  const fakeSession = {
    user: { id: 'clcx8x1234567890abcdef', email: 'gamebraicher@gmail.com', name: 'Brion Aiota' }
  };

  // Show app if authenticated
  if (fakeSession) {
    console.log('✅ Authenticated user accessing BÆKON:', {
      userId: fakeSession.user.id,
      userEmail: fakeSession.user.email,
      userName: fakeSession.user.name
    });
  }

  return (
    <div className="h-screen w-screen text-white p-[10px] overflow-visible">
      <div className="h-full w-full flex flex-col gap-3 overflow-visible">
        {/* Header - Fixed height */}
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

        {/* Middle Section - Flexible content area */}
        <div className="flex-1 flex gap-3 min-h-0 overflow-visible">
          {/* Left Column - Sidebar + AI Response + Chat Log */}
          <div className="w-[300px] flex-shrink-0 flex flex-col gap-3 overflow-visible">
            {/* Sidebar */}
            <div className="flex-1 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-hidden">
          <Sidebar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentWeekDates={currentWeekDates}
              />
            </div>

            {/* AI Response Area */}
            <div className="h-28 flex-shrink-0 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-hidden">
              <AIResponsePanel
                messages={messages}
                loading={chatLoading}
              />
            </div>

            {/* Chat Log Panel */}
            <div className="h-16 flex-shrink-0 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-visible relative z-50">
              <ChatLogPanel
                messages={messages}
              />
            </div>

            {/* AI Insights Panel (smaller) */}
            <div className="h-16 flex-shrink-0 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-visible relative z-50">
              <AIInsightsPanel
                hourEvents={hourEvents}
                dayEvents={dayEvents}
                currentWeekDates={currentWeekDates}
                messages={messages}
              />
            </div>
          </div>

          {/* Main Panel - Center column */}
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
              userId={fakeSession.user.id}
            />
          </div>

          {/* Details Panel - Right column */}
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

        {/* Bottom Panel - Fixed height, never pushed off screen */}
        <div className="h-[150px] flex-shrink-0 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-visible relative z-40">
          <BottomPanel
            messages={messages}
            sendMessage={sendMessage}
            loading={chatLoading}
            userId={fakeSession.user.id}
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
