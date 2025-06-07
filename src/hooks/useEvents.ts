import { useState, useEffect, useCallback } from 'react';
import type { Event, CreateEventData, UpdateEventData } from '@/types/chat';

export function useEvents(userId: string | null) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (startDate?: Date, endDate?: Date) => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      let url = `/api/events?userId=${userId}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch events');

      const data = await response.json();
      setEvents(data.map((event: Event) => ({
        ...event,
        startTime: new Date(event.startTime),
        endTime: event.endTime ? new Date(event.endTime) : undefined,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createEvent = useCallback(async (data: CreateEventData): Promise<Event | null> => {
    if (!userId) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId }),
      });

      if (!response.ok) throw new Error('Failed to create event');

      const newEvent = await response.json();
      const transformedEvent = {
        ...newEvent,
        startTime: new Date(newEvent.startTime),
        endTime: newEvent.endTime ? new Date(newEvent.endTime) : undefined,
      };

      setEvents(prev => [...prev, transformedEvent]);
      return transformedEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateEvent = useCallback(async (id: string, data: UpdateEventData): Promise<Event | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update event');

      const updatedEvent = await response.json();
      const transformedEvent = {
        ...updatedEvent,
        startTime: new Date(updatedEvent.startTime),
        endTime: updatedEvent.endTime ? new Date(updatedEvent.endTime) : undefined,
      };

      setEvents(prev => prev.map(event =>
        event.id === id ? transformedEvent : event
      ));

      return transformedEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete event');

      setEvents(prev => prev.filter(event => event.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchEvents();
    }
  }, [userId, fetchEvents]);

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
