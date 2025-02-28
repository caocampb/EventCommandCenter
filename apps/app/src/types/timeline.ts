// Timeline block status type
export type TimelineBlockStatus = 'pending' | 'in-progress' | 'complete' | 'cancelled';

// Timeline block interface matching database schema
export interface TimelineBlock {
  id: string;
  eventId: string;
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  location?: string;
  description?: string;
  status: TimelineBlockStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Type for creating a new timeline block (omit generated fields)
export type TimelineBlockCreateInput = Omit<
  TimelineBlock,
  'id' | 'createdAt' | 'updatedAt'
>;

// Type for updating a timeline block (make fields optional)
export type TimelineBlockUpdateInput = Partial<TimelineBlockCreateInput>;

// Type for timeline block from DB (with snake_case keys)
export type TimelineBlockDbRow = {
  id: string;
  event_id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}; 