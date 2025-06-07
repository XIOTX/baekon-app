"use client";

import { useState } from "react";
import SchedulerView from "./SchedulerView";
import WorkView from "./WorkView";
import LifeView from "./LifeView";
import type { Event, CreateEventData, UpdateEventData } from '@/types/chat';

interface MainPanelProps {
  activeSection: 'sched' | 'work' | 'life';
  schedView: 'planner' | 'calendar';
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
  createEvent: (data: CreateEventData) => Promise<Event | null>;
  updateEvent: (id: string, data: UpdateEventData) => Promise<Event | null>;
  deleteEvent: (id: string) => Promise<boolean>;
  fetchEvents: (startDate?: Date, endDate?: Date) => Promise<void>;
  userId: string;
}

export default function MainPanel({
  activeSection,
  schedView,
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
}: MainPanelProps) {

  const renderContent = () => {
    switch (activeSection) {
      case 'sched':
        return (
          <SchedulerView
            view={schedView}
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
            userId={userId}
          />
        );
      case 'work':
        return <WorkView userId={userId} />;
      case 'life':
        return <LifeView userId={userId} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full p-4">
      {renderContent()}
    </div>
  );
}
