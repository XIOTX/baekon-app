"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MainPanel from "@/components/MainPanel";
import DetailsPanel from "@/components/DetailsPanel";
import BottomPanel from "@/components/BottomPanel";
import { useEvents } from "@/hooks/useEvents";
import { useChat } from "@/hooks/useChat";

export default function BaekonApp() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState<'sched' | 'work' | 'life'>('sched');
  const [schedView, setSchedView] = useState<'planner' | 'calendar'>('planner');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    day: number;
    quarter: number;
    hour: number;
  } | null>(null);

  // Real API hooks
  const { events, loading: eventsLoading, error: eventsError, fetchEvents, createEvent, updateEvent, deleteEvent } = useEvents(session?.user?.id || null);
  const { messages, loading: chatLoading, error: chatError, sendMessage } = useChat(session?.user?.id || null);

  // Event state management (keeping for compatibility with existing UI)
  const [hourEvents, setHourEvents] = useState<{ [key: string]: string[] }>({});
  const [dayEvents, setDayEvents] = useState<{ [key: string]: string[] }>({});

  // Week context for proper date-based keys (will be updated by MainPanel)
  const [currentWeekDates, setCurrentWeekDates] = useState<Date[]>([]);

  // Get current slot events for DetailsPanel
  const getCurrentSlotEvents = () => {
    if (!selectedTimeSlot) return [];

    // Calendar day selection (quarter: 0, hour: 0)
    if (selectedTimeSlot.quarter === 0 && selectedTimeSlot.hour === 0) {
      // For calendar, use day index directly as key
      const dayKey = selectedTimeSlot.day.toString();
      return dayEvents[dayKey] || [];
    }
    // Planner hour selection - get event key based on day and hour
    const dayKey = selectedTimeSlot.day.toString();
    const hourKey = `${dayKey}-${selectedTimeSlot.hour}`;
    return hourEvents[hourKey] || [];
  };

  // If no session, don't render the app (will be handled by ClientBody redirect)
  if (!session) {
    return null;
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-900 via-blue-950 to-purple-900 text-white grid grid-cols-[300px_1fr_300px] grid-rows-[60px_1fr_150px] gap-3 p-3">
      {/* Header - Full width top */}
      <div className="col-span-3 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-hidden">
        <Header
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          schedView={schedView}
          setSchedView={setSchedView}
        />
      </div>

      {/* Sidebar - Left column */}
      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-hidden">
        <Sidebar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      </div>

      {/* Main Panel - Center column */}
      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-hidden">
        <MainPanel
          activeSection={activeSection}
          schedView={schedView}
          selectedDate={selectedDate}
          selectedTimeSlot={selectedTimeSlot}
          setSelectedTimeSlot={setSelectedTimeSlot}
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
          userId={session.user.id}
        />
      </div>

      {/* Details Panel - Right column */}
      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-hidden">
        <DetailsPanel
          selectedTimeSlot={selectedTimeSlot}
          events={getCurrentSlotEvents()}
          currentWeekDates={currentWeekDates}
        />
      </div>

      {/* Bottom Panel - Full width bottom */}
      <div className="col-span-3 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl overflow-hidden">
        <BottomPanel
          messages={messages}
          sendMessage={sendMessage}
          loading={chatLoading}
          userId={session.user.id}
        />
      </div>
    </div>
  );
}
