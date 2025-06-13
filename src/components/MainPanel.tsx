"use client";

import { useState } from "react";
import SchedulerView from "./SchedulerView";
import WorkView from "./WorkView";
import LifeView from "./LifeView";

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

interface MainPanelProps {
  activeSection: 'sched' | 'work' | 'life';
  schedView: 'planner' | 'calendar';
  workView: 'box' | 'board';
  setWorkView: (view: 'box' | 'board') => void;
  lifeView: 'box' | 'board';
  setLifeView: (view: 'box' | 'board') => void;
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
  selectedBoxId?: string | null;
}

export default function MainPanel({
  activeSection,
  schedView,
  workView,
  setWorkView,
  lifeView,
  setLifeView,
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
  userId,
  selectedBoxId
}: MainPanelProps) {

  const renderContent = () => {
    switch (activeSection) {
      case 'sched':
        return (
          <SchedulerView
            view={schedView}
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
        );
      case 'work':
        return <WorkView userId={userId} activeView={workView} selectedBoxId={selectedBoxId} />;
      case 'life':
        return <LifeView userId={userId} activeView={lifeView} selectedBoxId={selectedBoxId} />;
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
