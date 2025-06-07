export interface Event {
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

export interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags: string[];
  section: 'WORK' | 'LIFE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  archived: boolean;
  aiGenerated: boolean;
  aiSummary?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatContext {
  events?: Event[];
  notes?: Note[];
  currentDate?: string;
  selectedTimeSlot?: {
    day: number;
    quarter: number;
    hour: number;
  };
  [key: string]: unknown;
}

export interface CreateEventData {
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  category?: string;
  tags?: string[];
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  category?: string;
  tags?: string[];
  completed?: boolean;
}
