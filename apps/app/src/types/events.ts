// Event status type using string literals as recommended in backend docs
export type EventStatus = 'draft' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';

// Base Event type matching our database schema
export interface Event {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  location: string;
  status: EventStatus;
  attendeeCount: number;
  description?: string;
  type?: string;
  parentEventId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Type for creating a new event (omit generated fields)
export type EventCreateInput = Omit<
  Event,
  'id' | 'createdAt' | 'updatedAt'
>;

// Type for updating an event (make fields optional)
export type EventUpdateInput = Partial<EventCreateInput>;

// Event template type for the template-first approach
export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  features: string[];
  timeblocks?: Array<{
    startTime: string;
    endTime: string;
    activity: string;
  }>;
} 